import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideChevronDown,
  lucideChevronLeft,
  lucideChevronRight,
  lucideChevronUp,
  lucideChevronsUpDown,
  lucideDownload,
  lucideSearch,
  lucideX,
} from '@ng-icons/lucide';
import { AdminStore } from '../../admin/admin-store';
import { AuthStore } from '../../../core/services/auth.store';
import { ConsultasService } from '../../../core/services/consultas.service';
import { definicionSigno, EstadoSigno, LecturaDTO } from '../../../core/models/consultas.dto';
import { UmbralDTO } from '../../../core/models/umbral.dto';
// El paquete no expone una raiz: hay una build por entorno y esta es la del navegador.
import escribirExcel from 'write-excel-file/browser';
import { Topbar } from '../../../shared/topbar/topbar';

/** Signos que ofrece el filtro; el id coincide con PC_SIGNO_VITAL.ID_SIGNO_VITAL. */
const SIGNOS = [
  { id: 1, codigo: 'FC' },
  { id: 2, codigo: 'SPO2' },
  { id: 3, codigo: 'PAS' },
  { id: 4, codigo: 'PAD' },
  { id: 5, codigo: 'TEMP' },
  { id: 6, codigo: 'FR' },
];

const ESTADO_COPY: Record<EstadoSigno, string> = {
  ok: 'Normal',
  alerta: 'Atención',
  critico: 'Crítico',
};

const ESTADO_CLASES: Record<EstadoSigno, string> = {
  ok: 'bg-[var(--color-status-ok-soft)] text-[var(--color-status-ok)]',
  alerta: 'bg-[var(--color-status-warn-soft)] text-[var(--color-status-warn)]',
  critico: 'bg-[var(--color-status-critical-soft)] text-[var(--color-status-critical)]',
};

/** Debe coincidir con la lista blanca del backend (LecturaRepository.COLUMNAS_ORDEN). */
type CampoOrden = 'fecha' | 'signo' | 'valor';

const TAMANO_PAGINA = 50;

/**
 * campo null = columna no ordenable. "Estado" lo es: no viene de la base, se calcula
 * aqui comparando cada lectura con el umbral del paciente. Ordenarlo en el navegador
 * solo reordenaria las 50 filas de la pagina, no las miles del filtro, y eso engaña.
 */
const COLUMNAS: { campo: CampoOrden | null; etiqueta: string; alineacion: string }[] = [
  { campo: 'fecha', etiqueta: 'Fecha y hora', alineacion: 'text-left' },
  { campo: 'signo', etiqueta: 'Signo vital', alineacion: 'text-left' },
  { campo: 'valor', etiqueta: 'Valor', alineacion: 'text-right' },
  { campo: null, etiqueta: 'Estado', alineacion: 'text-left' },
];

/** Horas del dia como bloques completos: "7 AM" = de 07:00:00 a 07:59:59. */
const HORAS = Array.from({ length: 24 }, (_, h) => ({
  valor: h,
  etiqueta: `${h % 12 === 0 ? 12 : h % 12} ${h < 12 ? 'AM' : 'PM'}`,
}));

@Component({
  selector: 'app-historico',
  imports: [Topbar, FormsModule, NgIcon],
  viewProviders: [
    provideIcons({
      lucideSearch,
      lucideX,
      lucideDownload,
      lucideChevronUp,
      lucideChevronDown,
      lucideChevronsUpDown,
      lucideChevronLeft,
      lucideChevronRight,
    }),
  ],
  template: `
    @if (paciente(); as p) {
      <app-topbar
        titulo="Histórico de signos vitales"
        [subtitulo]="p.nombre + ' ' + p.apellidoPaterno + ' ' + p.apellidoMaterno"
        [usuario]="nombreUsuario()"
        rol="Médico"
        [volverA]="'/medico/pacientes/' + p.idPaciente"
        (cerrarSesion)="cerrarSesion()"
      />

      <main class="max-w-6xl mx-auto p-7 flex flex-col gap-5">
        <!-- FILTROS -->
        <form
          class="flex flex-wrap items-end gap-4 p-5 px-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]"
          (ngSubmit)="buscar()"
        >
          <label class="flex flex-col gap-1.5">
            <span class="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-soft)]">Signo vital</span>
            <select
              name="signo"
              [(ngModel)]="filtroSigno"
              class="min-w-52 px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-ink)] font-body"
            >
              <option [ngValue]="null">Todos los signos</option>
              @for (s of SIGNOS; track s.id) {
                <option [ngValue]="s.id">{{ etiquetaSigno(s.codigo) }}</option>
              }
            </select>
          </label>

          <div class="flex flex-col gap-1.5">
            <span class="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-soft)]">Desde</span>
            <div class="flex gap-2">
              <input
                type="date"
                name="desde"
                [(ngModel)]="filtroDesde"
                class="px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-ink)] font-body"
              />
              <select
                name="horaDesde"
                [(ngModel)]="filtroHoraDesde"
                [disabled]="!filtroDesde"
                class="px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-ink)] font-body disabled:opacity-40"
              >
                <option [ngValue]="null">Todo el día</option>
                @for (h of HORAS; track h.valor) {
                  <option [ngValue]="h.valor">{{ h.etiqueta }}</option>
                }
              </select>
            </div>
          </div>

          <div class="flex flex-col gap-1.5">
            <span class="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-soft)]">Hasta</span>
            <div class="flex gap-2">
              <input
                type="date"
                name="hasta"
                [(ngModel)]="filtroHasta"
                class="px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-ink)] font-body"
              />
              <select
                name="horaHasta"
                [(ngModel)]="filtroHoraHasta"
                [disabled]="!filtroHasta"
                class="px-3 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-ink)] font-body disabled:opacity-40"
              >
                <option [ngValue]="null">Todo el día</option>
                @for (h of HORAS; track h.valor) {
                  <option [ngValue]="h.valor">{{ h.etiqueta }}</option>
                }
              </select>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button
              type="submit"
              class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border-none bg-[var(--color-primary)] text-white font-semibold text-sm cursor-pointer transition-colors hover:bg-[var(--color-primary-dark)]"
            >
              <ng-icon name="lucideSearch" size="16" />
              Buscar
            </button>
            @if (hayFiltros()) {
              <button
                type="button"
                (click)="limpiar()"
                class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--color-surface-sunken)] border border-[var(--color-border)] text-[var(--color-ink-soft)] font-semibold text-sm cursor-pointer"
              >
                <ng-icon name="lucideX" size="16" />
                Limpiar
              </button>
            }
          </div>
        </form>

        <!-- RESULTADOS -->
        @if (cargando()) {
          <p class="text-sm text-[var(--color-ink-soft)]">Cargando histórico…</p>
        } @else if (error()) {
          <p class="text-sm text-[var(--color-status-critical)]">{{ error() }}</p>
        } @else if (lecturas().length === 0) {
          <p class="text-sm text-[var(--color-ink-soft)]">
            {{ mensajeVacio() }}
          </p>
        } @else {
          <div class="flex items-center justify-between flex-wrap gap-2">
            <p class="m-0 text-sm text-[var(--color-ink-soft)]">
              Mostrando <span class="font-semibold text-[var(--color-ink)]">{{ rangoVisible().desde }}–{{ rangoVisible().hasta }}</span>
              de {{ total() }} lectura{{ total() === 1 ? '' : 's' }}.
            </p>
            <button
              type="button"
              (click)="exportarExcel()"
              class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--color-surface-sunken)] border border-[var(--color-border)] text-[var(--color-ink-soft)] font-semibold text-xs cursor-pointer transition-colors hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]/40"
            >
              <ng-icon name="lucideDownload" size="14" />
              Exportar a Excel
            </button>
          </div>

          <div class="overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
            <table class="w-full border-collapse text-sm">
              <thead>
                <tr class="border-b border-[var(--color-border)] bg-[var(--color-surface-sunken)]">
                  @for (col of COLUMNAS; track col.etiqueta) {
                    <th class="font-display text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)] px-5 py-3"
                        [class]="col.alineacion">
                      @if (col.campo; as campo) {
                        <button
                          type="button"
                          (click)="ordenarPor(campo)"
                          [attr.aria-sort]="orden().campo === campo ? (orden().dir === 'asc' ? 'ascending' : 'descending') : 'none'"
                          class="inline-flex items-center gap-1 bg-transparent border-none p-0 font-display text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors hover:text-[var(--color-primary)]"
                          [class]="orden().campo === campo ? 'text-[var(--color-primary)]' : 'text-[var(--color-ink-soft)]'"
                        >
                          {{ col.etiqueta }}
                          <ng-icon [name]="iconoOrden(campo)" size="14" />
                        </button>
                      } @else {
                        {{ col.etiqueta }}
                      }
                    </th>
                  }
                </tr>
              </thead>
              <tbody>
                @for (l of lecturas(); track l.idLectura) {
                  <tr class="border-b border-[var(--color-border)] last:border-b-0">
                    <td class="px-5 py-3 font-mono text-xs text-[var(--color-ink-soft)] whitespace-nowrap">{{ fecha(l.fechaMedicion) }}</td>
                    <td class="px-5 py-3 text-[var(--color-ink)]">{{ etiquetaSigno(l.signoCodigo) }}</td>
                    <td class="px-5 py-3 text-right font-mono text-[var(--color-ink)] whitespace-nowrap">
                      {{ l.valorNum }} <span class="text-[var(--color-ink-soft)]">{{ l.unidad }}</span>
                    </td>
                    <td class="px-5 py-3">
                      <span class="inline-block font-display text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-full" [class]="claseEstado(l)">
                        {{ copiaEstado(l) }}
                      </span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          @if (totalPaginas() > 1) {
            <nav class="flex items-center justify-center gap-2" aria-label="Paginación del histórico">
              <button
                type="button"
                (click)="irAPagina(pagina() - 1)"
                [disabled]="pagina() === 1"
                class="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-sm font-semibold text-[var(--color-ink-soft)] cursor-pointer transition-colors enabled:hover:text-[var(--color-primary)] enabled:hover:border-[var(--color-primary)]/40 disabled:opacity-40 disabled:cursor-default"
              >
                <ng-icon name="lucideChevronLeft" size="16" />
                Anterior
              </button>

              @for (n of paginas(); track n) {
                <button
                  type="button"
                  (click)="irAPagina(n)"
                  [attr.aria-current]="n === pagina() ? 'page' : null"
                  class="w-9 h-9 rounded-xl border text-sm font-semibold cursor-pointer transition-colors"
                  [class]="
                    n === pagina()
                      ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white'
                      : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-ink-soft)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]/40'
                  "
                >
                  {{ n }}
                </button>
              }

              <button
                type="button"
                (click)="irAPagina(pagina() + 1)"
                [disabled]="pagina() === totalPaginas()"
                class="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-sm font-semibold text-[var(--color-ink-soft)] cursor-pointer transition-colors enabled:hover:text-[var(--color-primary)] enabled:hover:border-[var(--color-primary)]/40 disabled:opacity-40 disabled:cursor-default"
              >
                Siguiente
                <ng-icon name="lucideChevronRight" size="16" />
              </button>
            </nav>
          }
        }
      </main>
    } @else if (cargandoPaciente()) {
      <main class="max-w-6xl mx-auto p-7 flex items-center justify-center min-h-[60vh] text-[var(--color-ink-soft)]">
        <p>Cargando paciente…</p>
      </main>
    } @else {
      <main class="max-w-6xl mx-auto p-7 flex items-center justify-center min-h-[60vh] text-[var(--color-ink-soft)]">
        <p>No se encontró el paciente solicitado, o no está asignado a tu cuidado.</p>
      </main>
    }
  `,
})
export class Historico implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private adminStore = inject(AdminStore);
  private authStore = inject(AuthStore);
  private consultas = inject(ConsultasService);

  protected readonly SIGNOS = SIGNOS;
  protected readonly COLUMNAS = COLUMNAS;
  protected readonly HORAS = HORAS;
  protected readonly etiquetaSigno = (codigo: string) => definicionSigno(codigo).etiqueta;

  // Ordenar y paginar los consulta la base: un dia son miles de lecturas, ordenar en
  // el navegador solo reordenaria las 50 de la pagina y eso engaña.
  orden = signal<{ campo: CampoOrden; dir: 'asc' | 'desc' }>({ campo: 'fecha', dir: 'desc' });

  pagina = signal(1);
  total = signal(0);

  // Lo que se pidio en la ultima busqueda. El mensaje de vacio se arma con esto y no
  // con el formulario: si el medico cambia la hora sin pulsar Buscar, el texto seguiria
  // describiendo los filtros que si se aplicaron.
  private aplicado = signal<{ hora: number | null; dia: string }>({ hora: null, dia: '' });

  // Sin filtros al abrir: se muestran las ultimas lecturas, exista o no ingesta
  // reciente. Arrancar acotado a "hoy" dejaria la tabla vacia si el replayer
  // estuvo detenido.
  filtroSigno: number | null = null;
  filtroDesde = '';
  filtroHoraDesde: number | null = null;
  filtroHasta = '';
  filtroHoraHasta: number | null = null;

  cargando = signal(true);
  cargandoPaciente = signal(true);
  error = signal<string | null>(null);
  lecturas = signal<LecturaDTO[]>([]);
  private umbrales = signal<UmbralDTO[]>([]);

  private idPacienteRuta = toSignal(this.route.paramMap.pipe(map((p) => Number(p.get('id')))), {
    initialValue: NaN,
  });

  nombreUsuario = computed(() => {
    const u = this.authStore.usuario();
    return u ? `Dr. ${u.nombre} ${u.apellidoPaterno}` : 'Médico';
  });

  paciente = computed(() => {
    const idUsuario = this.authStore.usuario()?.idUsuario;
    if (!idUsuario) return undefined;
    const pacientes = this.adminStore.pacientesPorUsuario()[idUsuario] ?? [];
    return pacientes.find((p) => p.idPaciente === this.idPacienteRuta());
  });

  hayFiltros = () =>
    this.filtroSigno !== null ||
    !!this.filtroDesde ||
    !!this.filtroHasta ||
    this.filtroHoraDesde !== null ||
    this.filtroHoraHasta !== null;

  totalPaginas = computed(() => Math.max(1, Math.ceil(this.total() / TAMANO_PAGINA)));

  /**
   * Una ventana de paginas alrededor de la actual: con miles de lecturas hay cientos
   * de paginas y pintarlas todas llenaria la pantalla de botones.
   */
  paginas = computed(() => {
    const actual = this.pagina();
    const ultima = this.totalPaginas();
    const desde = Math.max(1, Math.min(actual - 2, ultima - 4));
    const hasta = Math.min(ultima, Math.max(actual + 2, 5));
    return Array.from({ length: hasta - desde + 1 }, (_, i) => desde + i);
  });

  /** "51-100 de 5.845", para saber donde se esta parado. */
  rangoVisible = computed(() => {
    const inicio = (this.pagina() - 1) * TAMANO_PAGINA + 1;
    return { desde: inicio, hasta: Math.min(inicio + TAMANO_PAGINA - 1, this.total()) };
  });

  irAPagina(n: number) {
    const destino = Math.min(Math.max(1, n), this.totalPaginas());
    if (destino === this.pagina()) return;
    this.pagina.set(destino);
    void this.cargarPagina();
  }

  /** Primer clic ordena descendente (lo mas reciente/alto arriba); el segundo invierte. */
  ordenarPor(campo: CampoOrden) {
    const actual = this.orden();
    this.orden.set(
      actual.campo === campo
        ? { campo, dir: actual.dir === 'asc' ? 'desc' : 'asc' }
        : { campo, dir: 'desc' }
    );
    // Reordenar cambia que filas caen en cada pagina: quedarse en la 3 mostraria
    // un tramo arbitrario del nuevo orden.
    this.pagina.set(1);
    void this.cargarPagina();
  }

  iconoOrden(campo: CampoOrden): string {
    if (this.orden().campo !== campo) return 'lucideChevronsUpDown';
    return this.orden().dir === 'asc' ? 'lucideChevronUp' : 'lucideChevronDown';
  }

  async ngOnInit() {
    const idUsuario = this.authStore.usuario()?.idUsuario;
    if (idUsuario) {
      await this.adminStore.cargarPacientesDeUsuario(idUsuario);
    }
    this.cargandoPaciente.set(false);

    if (!this.paciente()) {
      this.cargando.set(false);
      return;
    }

    // Auditoria: dejar constancia de que este medico abrio el historico de este
    // paciente. Fire-and-forget: si la bitacora falla, no debe impedir ver el historico.
    if (idUsuario) {
      this.consultas
        .registrarAcceso(idUsuario, this.idPacienteRuta(), 'VER_HISTORICO')
        .catch(() => {});
    }

    // Los umbrales definen el estado de cada fila; si fallan, se cae al rango por
    // defecto del catalogo de signos y la tabla igual se muestra.
    this.consultas
      .umbrales(this.idPacienteRuta())
      .then((u) => this.umbrales.set(u))
      .catch(() => this.umbrales.set([]));
    await this.buscar();
  }

  /**
   * Convierte un instante de la hora LOCAL del medico al UTC que entiende la base.
   * Sin esto el filtro y la tabla hablarian husos distintos: pedir "4 AM" traeria las
   * 04:00 UTC, que en Chile es medianoche.
   */
  private aUtc(dia: string, hora: number, minuto: number, segundo: number): string {
    const [a, m, d] = dia.split('-').map(Number);
    const local = new Date(a, m - 1, d, hora, minuto, segundo);
    const p = (n: number) => String(n).padStart(2, '0');
    return `${local.getUTCFullYear()}-${p(local.getUTCMonth() + 1)}-${p(local.getUTCDate())}` +
           `T${p(local.getUTCHours())}:${p(local.getUTCMinutes())}:${p(local.getUTCSeconds())}`;
  }

  /**
   * El filtro se elige por dia y hora locales; aqui se traduce al rango UTC. La hora es
   * un bloque completo: "7 AM" va de 07:00:00 a 07:59:59, y sin hora, el dia entero.
   * Sin el :59:59 final, "hasta las 7" excluiria toda esa hora.
   */
  private rangoFechas() {
    return {
      desde: this.filtroDesde
        ? this.aUtc(this.filtroDesde, this.filtroHoraDesde ?? 0, 0, 0)
        : undefined,
      hasta: this.filtroHasta
        ? this.aUtc(this.filtroHasta, this.filtroHoraHasta ?? 23, 59, 59)
        : undefined,
    };
  }

  /** Filtros nuevos: se vuelve a la primera pagina. */
  async buscar() {
    this.pagina.set(1);
    await this.cargarPagina();
  }

  private async cargarPagina() {
    if (!this.paciente()) return;
    this.cargando.set(true);
    this.error.set(null);
    this.aplicado.set({ hora: this.filtroHoraDesde, dia: this.filtroDesde });
    const { desde, hasta } = this.rangoFechas();
    try {
      const pagina = await this.consultas.historico(this.idPacienteRuta(), {
        idSignoVital: this.filtroSigno ?? undefined,
        desde,
        hasta,
        limite: TAMANO_PAGINA,
        offset: (this.pagina() - 1) * TAMANO_PAGINA,
        orden: this.orden().campo,
        ascendente: this.orden().dir === 'asc',
      });
      this.lecturas.set(pagina.lecturas);
      this.total.set(pagina.total);
    } catch {
      this.error.set('No se pudo cargar el histórico. Intenta nuevamente en unos segundos.');
      this.lecturas.set([]);
      this.total.set(0);
    } finally {
      this.cargando.set(false);
    }
  }

  /**
   * El monitoreo puede tener horas sin registros (el equipo estuvo desconectado), asi
   * que caer en una hora vacia es normal. En vez de un "no hay datos" a secas, el
   * mensaje empuja al flujo que si funciona: ver el dia entero y ahi elegir la hora.
   */
  mensajeVacio(): string {
    const { hora, dia } = this.aplicado();
    if (hora !== null && dia) {
      const etiqueta = HORAS.find((h) => h.valor === hora)?.etiqueta ?? '';
      const [a, m, d] = dia.split('-');
      return `No hay lecturas a las ${etiqueta} del ${d}/${m}/${a}. Prueba con «Todo el día» ` +
             `para ver a qué horas hubo registros.`;
    }
    if (this.hayFiltros()) {
      return 'No hay lecturas para los filtros seleccionados. Prueba con un rango de fechas ' +
             'más amplio o quita los filtros.';
    }
    return 'Este paciente aún no tiene lecturas registradas. Aparecerán aquí apenas el monitor ' +
           'envíe la primera medición.';
  }

  limpiar() {
    this.filtroSigno = null;
    this.filtroDesde = '';
    this.filtroHasta = '';
    this.filtroHoraDesde = null;
    this.filtroHoraHasta = null;
    void this.buscar();
  }

  /**
   * La base guarda en UTC y el backend lo devuelve sin zona ("2026-07-17T08:09:46"),
   * que JavaScript interpretaria como hora local. La "Z" lo marca como UTC para que
   * el navegador lo pase al huso del medico: en Chile (UTC-4), 08:09 se ve 04:09.
   */
  fecha(iso: string): string {
    const d = new Date(`${iso}Z`);
    const p = (n: number) => String(n).padStart(2, '0');
    return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ` +
           `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  }

  /** Mismo criterio que vitals-board: umbral del paciente y, si no hay, el del catalogo. */
  private estado(l: LecturaDTO): EstadoSigno {
    const u = this.umbrales().find((x) => x.idSignoVital === l.idSignoVital);
    if (u) {
      if (l.valorNum < u.valorMinCritico || l.valorNum > u.valorMaxCritico) return 'critico';
      if (l.valorNum < u.valorMin || l.valorNum > u.valorMax) return 'alerta';
      return 'ok';
    }
    const def = definicionSigno(l.signoCodigo);
    if (l.valorNum < def.rangoDefault.min || l.valorNum > def.rangoDefault.max) return 'critico';
    if (
      l.valorNum <= def.rangoDefault.min + def.margenDefault ||
      l.valorNum >= def.rangoDefault.max - def.margenDefault
    ) {
      return 'alerta';
    }
    return 'ok';
  }

  copiaEstado(l: LecturaDTO): string {
    return ESTADO_COPY[this.estado(l)];
  }

  claseEstado(l: LecturaDTO): string {
    return ESTADO_CLASES[this.estado(l)];
  }

  /**
   * Descarga lo que se ve en la tabla (mismas filas y mismo orden) como un Excel real.
   *
   * No es un CSV: un CSV es texto plano y no lleva formato de celda, asi que Excel
   * decide como pintar la fecha y la recorta a "17-07-26 4:26", sin segundos. En .xlsx
   * la fecha viaja como fecha, con su formato, y ademas queda ordenable y filtrable.
   */
  async exportarExcel() {
    const cabecera = { fontWeight: 'bold' as const, backgroundColor: '#EFF6FF' };

    await escribirExcel<LecturaDTO>(this.lecturas(), {
      columns: [
        {
          header: { value: 'Fecha y hora', ...cabecera },
          width: 22,
          // Fecha real (no texto): asi Excel la ordena y filtra como fecha, y el
          // formato la muestra completa en vez de recortarla a "17-07-26 4:26".
          cell: (l: LecturaDTO) => ({
            type: Date,
            value: this.fechaParaExcel(l.fechaMedicion),
            format: 'dd/mm/yyyy hh:mm:ss',
          }),
        },
        {
          header: { value: 'Signo vital', ...cabecera },
          width: 24,
          cell: (l: LecturaDTO) => ({ type: String, value: definicionSigno(l.signoCodigo).etiqueta }),
        },
        {
          header: { value: 'Valor', ...cabecera },
          width: 10,
          // Numero, no texto: se puede promediar y graficar sin convertir nada.
          cell: (l: LecturaDTO) => ({ type: Number, value: l.valorNum }),
        },
        {
          header: { value: 'Unidad', ...cabecera },
          width: 12,
          cell: (l: LecturaDTO) => ({ type: String, value: l.unidad }),
        },
        {
          header: { value: 'Estado', ...cabecera },
          width: 12,
          cell: (l: LecturaDTO) => ({ type: String, value: ESTADO_COPY[this.estado(l)] }),
        },
      ],
    }).toFile(this.nombreArchivo());
  }

  /**
   * Un serial de Excel es solo un numero: no lleva zona horaria. La libreria lo calcula
   * con los campos UTC del Date, asi que pasarle el instante real escribiria la hora
   * UTC (08:42) en vez de la del medico (04:42). Se le entrega un Date corrido para
   * que sus campos UTC coincidan con la hora local, que es la que debe quedar escrita.
   */
  private fechaParaExcel(iso: string): Date {
    const real = new Date(`${iso}Z`);
    return new Date(real.getTime() - real.getTimezoneOffset() * 60_000);
  }

  /** historico_Nombre_Apellidos.xlsx, sin caracteres que Windows rechaza en un nombre. */
  private nombreArchivo(): string {
    const p = this.paciente();
    const nombre = [p?.nombre, p?.apellidoPaterno, p?.apellidoMaterno]
      .filter(Boolean)
      .join(' ')
      .trim()
      .replace(/[\\/:*?"<>|]/g, '')
      .replace(/\s+/g, '_');
    return `historico_${nombre || this.idPacienteRuta()}.xlsx`;
  }

  cerrarSesion() {
    this.router.navigateByUrl('/');
  }
}
