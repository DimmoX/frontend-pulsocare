import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheck, lucideClock4, lucideUserRound } from '@ng-icons/lucide';
import { ConsultasService } from '../../core/services/consultas.service';
import { AlertaDTO, definicionSigno, EstadoSigno, LecturaDTO } from '../../core/models/consultas.dto';
import { UmbralDTO } from '../../core/models/umbral.dto';
import { PacienteDTO, edadDesdeFechaNacimiento } from '../../core/models/paciente.dto';
import { VitalCard } from '../vital-card/vital-card';

const ORDEN_SIGNOS = ['FC', 'SPO2', 'PAS', 'PAD', 'TEMP', 'FR'];
const INTERVALO_REFRESCO_MS = 8000;

const RESUMEN: Record<EstadoSigno, { texto: string; detalle: string }> = {
  ok: { texto: 'Estable', detalle: 'Todos los signos vitales dentro de su rango normal.' },
  alerta: { texto: 'En observación', detalle: 'Uno o más signos vitales están cerca de su límite normal.' },
  critico: { texto: 'Atención requerida', detalle: 'Uno o más signos vitales están fuera de su rango normal.' },
};

const ESTADO_CLASES: Record<EstadoSigno, { borde: string; chip: string }> = {
  ok: { borde: 'border-l-[var(--color-status-ok)]', chip: 'bg-[var(--color-status-ok-soft)] text-[var(--color-status-ok)]' },
  alerta: { borde: 'border-l-[var(--color-status-warn)]', chip: 'bg-[var(--color-status-warn-soft)] text-[var(--color-status-warn)]' },
  critico: { borde: 'border-l-[var(--color-status-critical)]', chip: 'bg-[var(--color-status-critical-soft)] text-[var(--color-status-critical)]' },
};

@Component({
  selector: 'app-vitals-board',
  imports: [VitalCard, NgIcon],
  viewProviders: [provideIcons({ lucideUserRound, lucideClock4, lucideCheck })],
  template: `
    <section class="flex flex-col gap-6">
      <div
        class="flex flex-wrap items-center justify-between gap-5 p-6 px-7 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] border-l-[6px]"
        [class]="clases().borde"
      >
        <div class="flex items-center gap-4 min-w-64">
          <span class="flex items-center justify-center w-12 h-12 rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary-dark)] shrink-0">
            <ng-icon name="lucideUserRound" size="22" />
          </span>
          <div>
            <h2 class="font-display text-xl font-semibold m-0 text-[var(--color-ink)]">
              {{ paciente().nombre }} {{ paciente().apellidoPaterno }} {{ paciente().apellidoMaterno }}
            </h2>
            <p class="mt-1 text-sm text-[var(--color-ink-soft)]">{{ edad() }} años</p>
          </div>
        </div>

        <div class="flex flex-col gap-1 max-w-88">
          <span class="self-start font-display font-semibold text-xs uppercase tracking-wide px-3 py-1.5 rounded-full" [class]="clases().chip">
            {{ resumen().texto }}
          </span>
          <p class="m-0 text-sm text-[var(--color-ink-soft)]">{{ resumen().detalle }}</p>
        </div>

        <div class="flex flex-col items-end gap-2.5">
          <div class="inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-soft)] whitespace-nowrap">
            <ng-icon name="lucideClock4" size="16" />
            {{ ultimaActualizacionTexto() }}
          </div>
          <!-- Hueco para acciones del paciente. Se proyecta desde la vista que lo usa:
               el medico pone aqui el acceso al historico y el familiar no pone nada,
               porque esa ruta esta protegida por rol. -->
          <ng-content select="[acciones]" />
        </div>
      </div>

      <!-- Mismo criterio que [acciones]: la vista del medico proyecta aqui la escala
           NEWS2, entre la ficha y las tarjetas, y la del familiar no proyecta nada
           porque un puntaje de riesgo clinico sin contexto no le corresponde leer. -->
      <ng-content select="[escala]" />

      @if (cargando()) {
        <p class="text-sm text-[var(--color-ink-soft)]">Cargando signos vitales…</p>
      } @else if (lecturas().length === 0) {
        <p class="text-sm text-[var(--color-ink-soft)]">
          Aún no hay lecturas registradas para este paciente. El monitor comenzará a mostrar datos
          apenas llegue la primera medición.
        </p>
      } @else {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          @for (lectura of lecturasOrdenadas(); track lectura.idSignoVital) {
            <app-vital-card [lectura]="lectura" [umbral]="umbralDe(lectura.idSignoVital)" />
          }
        </div>
      }
    </section>
  `,
})
export class VitalsBoard {
  private consultas = inject(ConsultasService);

  paciente = input.required<PacienteDTO>();

  private lecturasSignal = signal<LecturaDTO[]>([]);
  private alertasSignal = signal<AlertaDTO[]>([]);
  private umbralesSignal = signal<UmbralDTO[]>([]);
  private ahoraSignal = signal(Date.now());
  cargando = signal(true);

  lecturas = this.lecturasSignal.asReadonly();

  lecturasOrdenadas = computed(() =>
    [...this.lecturas()].sort(
      (a, b) => ORDEN_SIGNOS.indexOf(a.signoCodigo) - ORDEN_SIGNOS.indexOf(b.signoCodigo)
    )
  );

  alertasActivas = computed(() =>
    this.alertasSignal().filter((a) => a.estadoCodigo === 'GENERADA' || a.estadoCodigo === 'NOTIFICADA')
  );

  edad = computed(() => edadDesdeFechaNacimiento(this.paciente().fechaNacimiento));

  private estadoDeLectura(lectura: LecturaDTO): EstadoSigno {
    const valor = lectura.valorNum;
    const u = this.umbralDe(lectura.idSignoVital);

    if (u) {
      if (valor < u.valorMinCritico || valor > u.valorMaxCritico) return 'critico';
      if (valor < u.valorMin || valor > u.valorMax) return 'alerta';
      return 'ok';
    }

    const { min, max } = definicionSigno(lectura.signoCodigo).rangoDefault;
    const margen = definicionSigno(lectura.signoCodigo).margenDefault;
    if (valor < min || valor > max) return 'critico';
    if (valor <= min + margen || valor >= max - margen) return 'alerta';
    return 'ok';
  }

  estado = computed<EstadoSigno>(() => {
    const estados = this.lecturas().map((l) => this.estadoDeLectura(l));
    if (estados.some((e) => e === 'critico')) return 'critico';
    if (estados.some((e) => e === 'alerta')) return 'alerta';
    return 'ok';
  });
  resumen = computed(() => RESUMEN[this.estado()]);
  clases = computed(() => ESTADO_CLASES[this.estado()]);

  /** Instante de la lectura mas reciente, en ms. La base guarda UTC (por eso la "Z"). */
  private ultimaMedicionMs = computed(() => {
    const tiempos = this.lecturas()
      .map((l) => new Date(`${l.fechaMedicion}Z`).getTime())
      .filter((t) => !Number.isNaN(t));
    return tiempos.length ? Math.max(...tiempos) : null;
  });

  /**
   * Antiguedad del ultimo dato REAL, no de la ultima consulta. Antes se medía contra el
   * momento del fetch, asi que un paciente sin monitoreo (dado de alta o con el equipo
   * desconectado) seguia diciendo "hace unos segundos" para siempre. Ahora crece y
   * muestra con honestidad que los signos vitales estan congelados.
   */
  ultimaActualizacionTexto = computed(() => {
    const medicion = this.ultimaMedicionMs();
    if (medicion === null) return this.cargando() ? 'Cargando…' : 'Sin lecturas';

    const segundos = Math.max(0, Math.round((this.ahoraSignal() - medicion) / 1000));
    if (segundos < 60) return `Última lectura hace ${segundos} s`;
    if (segundos < 3600) return `Última lectura hace ${Math.round(segundos / 60)} min`;
    return `Última lectura hace ${Math.round(segundos / 3600)} h`;
  });

  private intervalo?: ReturnType<typeof setInterval>;
  private cargaEnCurso = false;

  constructor() {
    effect((onCleanup) => {
      const idPaciente = this.paciente().idPaciente;
      this.cargando.set(true);
      this.cargarTodo(idPaciente);
      this.intervalo = setInterval(() => this.cargarTodo(idPaciente), INTERVALO_REFRESCO_MS);
      onCleanup(() => clearInterval(this.intervalo));
    });

    effect((onCleanup) => {
      const tick = setInterval(() => this.ahoraSignal.set(Date.now()), 1000);
      onCleanup(() => clearInterval(tick));
    });
  }

  umbralDe(idSignoVital: number): UmbralDTO | null {
    return this.umbralesSignal().find((u) => u.idSignoVital === idSignoVital) ?? null;
  }

  private async cargarTodo(idPaciente: number) {
    // El refresco es por intervalo fijo: si una carga tarda mas que el intervalo,
    // sin esta guarda se acumulan peticiones en vuelo, cada una reteniendo una
    // conexion del pool del backend hasta agotarlo.
    if (this.cargaEnCurso) return;
    this.cargaEnCurso = true;
    try {
      await this.cargarDatos(idPaciente);
    } finally {
      this.cargaEnCurso = false;
    }
  }

  private async cargarDatos(idPaciente: number) {
    const [lecturasResultado, alertasResultado, umbralesResultado] = await Promise.allSettled([
      this.consultas.ultimas(idPaciente),
      this.consultas.alertas(idPaciente),
      this.consultas.umbrales(idPaciente),
    ]);

    if (lecturasResultado.status === 'fulfilled') {
      this.lecturasSignal.set(lecturasResultado.value);
    } else {
      console.error('Error al cargar lecturas:', lecturasResultado.reason);
    }

    if (alertasResultado.status === 'fulfilled') {
      this.alertasSignal.set(alertasResultado.value);
    } else {
      console.error('Error al cargar alertas (no bloquea lecturas ni umbrales):', alertasResultado.reason);
    }

    if (umbralesResultado.status === 'fulfilled') {
      this.umbralesSignal.set(umbralesResultado.value);
    } else {
      console.error('Error al cargar umbrales:', umbralesResultado.reason);
    }

    this.cargando.set(false);
  }
}
