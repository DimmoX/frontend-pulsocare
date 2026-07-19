import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideInfo, lucideRotateCcw, lucideTriangleAlert } from '@ng-icons/lucide';
import { AdminStore } from '../../admin/admin-store';
import { AuthStore } from '../../../core/services/auth.store';
import { ConsultasService } from '../../../core/services/consultas.service';
import { definicionSigno, SIGNOS_MONITOREADOS } from '../../../core/models/consultas.dto';
import { UmbralDTO } from '../../../core/models/umbral.dto';
import { Topbar } from '../../../shared/topbar/topbar';
import { NotificacionesService } from '../../../core/services/notificaciones.service';

/** Lo que se edita en pantalla para un signo. */
interface FilaUmbral {
  idSignoVital: number;
  codigo: string;
  etiqueta: string;
  /** null mientras el paciente use el rango por defecto. */
  idUmbral: number | null;
  min: number | null;
  max: number | null;
  minCritico: number | null;
  maxCritico: number | null;
  /** Rangos por defecto, para poder restaurarlos y mostrar de que se aparta el medico. */
  porDefecto: { min: number; max: number };
  criticoPorDefecto: { min: number; max: number };
  guardando: boolean;
  error: string | null;
}

@Component({
  selector: 'app-umbrales',
  imports: [Topbar, FormsModule, NgIcon],
  viewProviders: [provideIcons({ lucideInfo, lucideRotateCcw, lucideTriangleAlert })],
  template: `
    @if (paciente(); as p) {
      <app-topbar
        titulo="Límites de alarma"
        [subtitulo]="p.nombre + ' ' + p.apellidoPaterno + ' ' + p.apellidoMaterno"
        [usuario]="nombreUsuario()"
        rol="Médico"
        [volverA]="'/medico/pacientes/' + p.idPaciente"
        (cerrarSesion)="cerrarSesion()"
      />

      <main class="max-w-6xl mx-auto p-7 flex flex-col gap-5">
        <div class="flex items-start gap-2.5 p-4 px-5 rounded-2xl bg-[var(--color-surface-sunken)] border border-[var(--color-border)] text-sm text-[var(--color-ink-soft)]">
          <ng-icon name="lucideInfo" size="18" class="mt-0.5 shrink-0" />
          <div class="flex flex-col gap-2">
            <p class="m-0">
              <strong class="text-[var(--color-ink)]">Valores por defecto.</strong>
              Cada signo usa los rangos de referencia del catálogo de signos vitales de
              la plataforma, pensados para población adulta general. Bajo el nombre de
              cada signo se indica si este paciente los está usando o si tiene límites
              propios, junto al rango por defecto del que se aparta.
            </p>
            <p class="m-0">
              <strong class="text-[var(--color-ink)]">Cómo cambiar un límite.</strong>
              Edita los campos Mín. normal, Máx. normal, Mín. crítico o Máx. crítico de
              la fila y presiona <strong class="text-[var(--color-ink)]">Guardar</strong>
              en esa misma fila. El cambio no se aplica hasta presionar Guardar, y el
              monitoreo lo toma dentro del minuto siguiente.
            </p>
            <p class="m-0">
              <strong class="text-[var(--color-ink)]">Cómo volver a los valores por defecto.</strong>
              Presiona el botón
              <ng-icon name="lucideRotateCcw" size="13" class="align-middle" />
              de la fila: los campos vuelven a mostrar los rangos por defecto y el signo
              deja de usar límites propios. Ese botón aparece solo cuando el signo tiene
              límites personalizados.
            </p>
          </div>
        </div>

        @if (cargando()) {
          <p class="text-sm text-[var(--color-ink-soft)]">Cargando límites…</p>
        } @else {
          <div class="overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
            <table class="w-full border-collapse text-sm min-w-3xl">
              <thead>
                <tr class="text-left text-xs uppercase tracking-wider text-[var(--color-ink-soft)] border-b border-[var(--color-border)]">
                  <th class="p-4 font-semibold">Signo vital</th>
                  <th class="p-4 font-semibold">Mín. normal</th>
                  <th class="p-4 font-semibold">Máx. normal</th>
                  <th class="p-4 font-semibold">Mín. crítico</th>
                  <th class="p-4 font-semibold">Máx. crítico</th>
                  <th class="p-4 font-semibold text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                @for (f of filas(); track f.idSignoVital) {
                  <tr class="border-b border-[var(--color-border)] last:border-0 align-top">
                    <td class="p-4">
                      <div class="font-semibold text-[var(--color-ink)]">{{ f.etiqueta }}</div>
                      <div class="text-xs text-[var(--color-ink-soft)] mt-0.5">
                        @if (f.idUmbral) {
                          Personalizado · por defecto {{ f.porDefecto.min }}–{{ f.porDefecto.max }}
                        } @else {
                          Usando el rango por defecto
                        }
                      </div>
                      @if (f.error) {
                        <div class="flex items-start gap-1 mt-1.5 text-xs text-[var(--color-status-critical)]">
                          <ng-icon name="lucideTriangleAlert" size="13" class="mt-0.5 shrink-0" />
                          <span>{{ f.error }}</span>
                        </div>
                      }
                    </td>
                    <td class="p-4"><input type="number" [(ngModel)]="f.min" [class]="claseInput" /></td>
                    <td class="p-4"><input type="number" [(ngModel)]="f.max" [class]="claseInput" /></td>
                    <td class="p-4"><input type="number" [(ngModel)]="f.minCritico" [class]="claseInput" /></td>
                    <td class="p-4"><input type="number" [(ngModel)]="f.maxCritico" [class]="claseInput" /></td>
                    <td class="p-4">
                      <div class="flex items-center justify-end gap-2">
                        @if (f.idUmbral) {
                          <button
                            type="button"
                            title="Volver al rango por defecto"
                            [disabled]="f.guardando"
                            (click)="restaurar(f)"
                            class="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl border border-[var(--color-border)] text-[var(--color-ink-soft)] text-xs cursor-pointer transition-colors hover:border-[var(--color-primary)]/40 disabled:opacity-50"
                          >
                            <ng-icon name="lucideRotateCcw" size="13" />
                          </button>
                        }
                        <button
                          type="button"
                          [disabled]="f.guardando"
                          (click)="guardar(f)"
                          class="px-3.5 py-2 rounded-xl bg-[var(--color-primary)] text-white font-semibold text-xs cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
                        >
                          {{ f.guardando ? 'Guardando…' : 'Guardar' }}
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <p class="m-0 text-xs text-[var(--color-ink-soft)] leading-relaxed">
            Los cuatro límites son obligatorios. El rango crítico debe contener al
            normal: un valor no puede estar dentro de lo aceptable y ser crítico a la vez.
          </p>
        }
      </main>
    } @else if (cargando()) {
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
export class Umbrales implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private adminStore = inject(AdminStore);
  private authStore = inject(AuthStore);
  private consultas = inject(ConsultasService);
  private avisos = inject(NotificacionesService);

  protected readonly claseInput =
    'w-24 px-2.5 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-ink)] text-sm';

  private idPacienteRuta = toSignal(this.route.paramMap.pipe(map((p) => Number(p.get('id')))), {
    initialValue: NaN,
  });

  cargando = signal(true);
  filas = signal<FilaUmbral[]>([]);

  private idUsuario = computed(() => this.authStore.usuario()?.idUsuario ?? null);

  nombreUsuario = computed(() => {
    const u = this.authStore.usuario();
    return u ? `Dr. ${u.nombre} ${u.apellidoPaterno}` : 'Médico';
  });

  paciente = computed(() => {
    const idUsuario = this.idUsuario();
    if (!idUsuario) return undefined;
    const pacientes = this.adminStore.pacientesPorUsuario()[idUsuario] ?? [];
    return pacientes.find((p) => p.idPaciente === this.idPacienteRuta());
  });

  async ngOnInit() {
    const idUsuario = this.idUsuario();
    if (idUsuario) {
      await this.adminStore.cargarPacientesDeUsuario(idUsuario);
    }
    const p = this.paciente();
    if (p) {
      await this.cargarUmbrales(p.idPaciente);
    }
    this.cargando.set(false);
  }

  private async cargarUmbrales(idPaciente: number) {
    let definidos: UmbralDTO[] = [];
    try {
      definidos = await this.consultas.umbrales(idPaciente);
    } catch {
      // Sin umbrales propios la tabla igual sirve: se muestran los valores por defecto.
    }

    this.filas.set(
      SIGNOS_MONITOREADOS.map(({ id, codigo }) => {
        const definicion = definicionSigno(codigo);
        const propio = definidos.find((u) => u.idSignoVital === id);
        // Los campos nunca quedan vacios: si el paciente no tiene umbral propio (o le
        // falta algun limite) se muestra el valor por defecto, que es el que el sistema
        // esta aplicando de verdad. Un campo en blanco no decia nada.
        return {
          idSignoVital: id,
          codigo,
          etiqueta: definicion.etiqueta,
          idUmbral: propio?.idUmbral ?? null,
          min: propio?.valorMin ?? definicion.rangoDefault.min,
          max: propio?.valorMax ?? definicion.rangoDefault.max,
          minCritico: propio?.valorMinCritico ?? definicion.criticoDefault.min,
          maxCritico: propio?.valorMaxCritico ?? definicion.criticoDefault.max,
          porDefecto: definicion.rangoDefault,
          criticoPorDefecto: definicion.criticoDefault,
          guardando: false,
          error: null,
        };
      })
    );
  }

  async guardar(fila: FilaUmbral) {
    const idUsuario = this.idUsuario();
    const p = this.paciente();
    if (!idUsuario || !p) return;

    // Los cuatro limites son obligatorios: un umbral a medias deja al sistema
    // clasificando ese signo con una mezcla de valores propios y por defecto, que es
    // imposible de razonar mirando la pantalla.
    const faltantes = this.camposVacios(fila);
    if (faltantes.length > 0) {
      this.avisos.error(
        `${fila.etiqueta}: falta completar ${faltantes.join(', ')}. Todos los límites son obligatorios.`
      );
      return;
    }

    this.marcar(fila, { guardando: true, error: null });
    const valores = {
      valorMin: this.numero(fila.min),
      valorMax: this.numero(fila.max),
      valorMinCritico: this.numero(fila.minCritico),
      valorMaxCritico: this.numero(fila.maxCritico),
      idDefinidoPor: idUsuario,
    };

    try {
      if (fila.idUmbral) {
        await this.consultas.actualizarUmbral(fila.idUmbral, valores);
      } else {
        const creado = await this.consultas.crearUmbral({
          idPaciente: p.idPaciente,
          idSignoVital: fila.idSignoVital,
          ...valores,
        });
        this.marcar(fila, { idUmbral: creado.idUmbral });
      }
      this.avisos.exito(`${fila.etiqueta}: límites guardados. Se aplican en el próximo minuto.`);
    } catch (e: unknown) {
      const mensaje = this.mensajeDe(e);
      this.marcar(fila, { error: mensaje });
      this.avisos.error(`${fila.etiqueta}: ${mensaje}`);
    } finally {
      this.marcar(fila, { guardando: false });
    }
  }

  async restaurar(fila: FilaUmbral) {
    const idUsuario = this.idUsuario();
    if (!idUsuario || !fila.idUmbral) return;

    this.marcar(fila, { guardando: true, error: null });
    try {
      await this.consultas.eliminarUmbral(fila.idUmbral, idUsuario);
      // Se rellenan con los valores por defecto en vez de vaciarlos: son los que el
      // sistema pasa a aplicar, y dejarlos en blanco hacia parecer que el signo se
      // quedo sin limites.
      this.marcar(fila, {
        idUmbral: null,
        min: fila.porDefecto.min,
        max: fila.porDefecto.max,
        minCritico: fila.criticoPorDefecto.min,
        maxCritico: fila.criticoPorDefecto.max,
      });
      this.avisos.exito(`${fila.etiqueta}: vuelve a sus valores por defecto.`);
    } catch (e: unknown) {
      const mensaje = this.mensajeDe(e);
      this.marcar(fila, { error: mensaje });
      this.avisos.error(`${fila.etiqueta}: ${mensaje}`);
    } finally {
      this.marcar(fila, { guardando: false });
    }
  }

  /** Etiquetas de los limites que quedaron sin valor. */
  private camposVacios(fila: FilaUmbral): string[] {
    const revisar: [string, number | null][] = [
      ['Mín. normal', fila.min],
      ['Máx. normal', fila.max],
      ['Mín. crítico', fila.minCritico],
      ['Máx. crítico', fila.maxCritico],
    ];
    return revisar.filter(([, v]) => v === null || v === undefined || Number.isNaN(v)).map(([e]) => e);
  }

  private numero(valor: number | null): number | null {
    return valor === null || Number.isNaN(valor) ? null : Number(valor);
  }

  /** El backend explica por que rechazo el rango; conviene mostrarle eso al medico. */
  private mensajeDe(e: unknown): string {
    const error = e as { error?: { message?: string }; message?: string };
    return error?.error?.message ?? error?.message ?? 'No se pudo guardar el límite.';
  }

  private marcar(fila: FilaUmbral, cambios: Partial<FilaUmbral>) {
    this.filas.update((filas) =>
      filas.map((f) => (f.idSignoVital === fila.idSignoVital ? { ...f, ...cambios } : f))
    );
    Object.assign(fila, cambios);
  }

  cerrarSesion() {
    this.router.navigateByUrl('/');
  }
}
