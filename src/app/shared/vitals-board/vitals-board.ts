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

        <div class="inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-soft)] whitespace-nowrap">
          <ng-icon name="lucideClock4" size="16" />
          {{ ultimaActualizacionTexto() }}
        </div>
      </div>

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
  // puedeReconocerAlertas = input<boolean>(false);
  idUsuarioActual = input<number | null>(null);

  private lecturasSignal = signal<LecturaDTO[]>([]);
  private alertasSignal = signal<AlertaDTO[]>([]);
  private umbralesSignal = signal<UmbralDTO[]>([]);
  private ultimaCarga = signal<Date | null>(null);
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

  ultimaActualizacionTexto = computed(() => {
    const fecha = this.ultimaCarga();
    const ahora = this.ahoraSignal();
    if (!fecha) return 'Cargando…';
    const segundos = Math.max(0, Math.round((ahora - fecha.getTime()) / 1000));
    return segundos < 60 ? `Actualizado hace ${segundos} s` : `Actualizado hace ${Math.round(segundos / 60)} min`;
  });

  private intervalo?: ReturnType<typeof setInterval>;

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
    try {
      const [lecturas, alertas, umbrales] = await Promise.all([
        this.consultas.ultimas(idPaciente),
        this.consultas.alertas(idPaciente),
        this.consultas.umbrales(idPaciente),
      ]);
      this.lecturasSignal.set(lecturas);
      this.alertasSignal.set(alertas);
      this.umbralesSignal.set(umbrales);
      this.ultimaCarga.set(new Date());
    } catch (error) {
      console.error('Error al cargar signos vitales:', error);
    } finally {
      this.cargando.set(false);
    }
  }
}
