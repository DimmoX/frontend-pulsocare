import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideActivity, lucideInfo, lucideTriangleAlert } from '@ng-icons/lucide';
import { ConsultasService } from '../../core/services/consultas.service';
import { definicionSigno } from '../../core/models/consultas.dto';
import { MAXIMO_NEWS2, NivelRiesgoNews2, PARAMETROS_NEWS2, PuntajeNews2DTO } from '../../core/models/news2.dto';

/** Mismo intervalo que los signos vitales, para que el puntaje no quede desfasado. */
const INTERVALO_REFRESCO_MS = 8000;

const NIVEL: Record<NivelRiesgoNews2, { texto: string; detalle: string }> = {
  BAJO: {
    texto: 'Riesgo bajo',
    detalle: 'Los signos vitales no sugieren deterioro. Continuar el monitoreo habitual.',
  },
  MEDIO: {
    texto: 'Riesgo medio',
    detalle: 'Hay señales de posible deterioro. Se recomienda revisar al paciente.',
  },
  ALTO: {
    texto: 'Riesgo alto',
    detalle: 'El conjunto de signos vitales sugiere deterioro. Requiere revisión inmediata.',
  },
};

const CLASES: Record<NivelRiesgoNews2, { borde: string; chip: string; numero: string }> = {
  BAJO: {
    borde: 'border-l-[var(--color-status-ok)]',
    chip: 'bg-[var(--color-status-ok-soft)] text-[var(--color-status-ok)]',
    numero: 'text-[var(--color-status-ok)]',
  },
  MEDIO: {
    borde: 'border-l-[var(--color-status-warn)]',
    chip: 'bg-[var(--color-status-warn-soft)] text-[var(--color-status-warn)]',
    numero: 'text-[var(--color-status-warn)]',
  },
  ALTO: {
    borde: 'border-l-[var(--color-status-critical)]',
    chip: 'bg-[var(--color-status-critical-soft)] text-[var(--color-status-critical)]',
    numero: 'text-[var(--color-status-critical)]',
  },
};

@Component({
  selector: 'app-news2-panel',
  imports: [NgIcon],
  viewProviders: [provideIcons({ lucideActivity, lucideTriangleAlert, lucideInfo })],
  template: `
    @if (puntaje(); as p) {
      <section
        class="flex flex-wrap items-center gap-6 p-6 px-7 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] border-l-[6px]"
        [class]="clases().borde"
      >
        <!-- Puntaje -->
        <div class="flex items-center gap-4 min-w-56">
          <span class="flex items-center justify-center w-12 h-12 rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary-dark)] shrink-0">
            <ng-icon name="lucideActivity" size="22" />
          </span>
          <div>
            <div class="flex items-baseline gap-1.5">
              <span class="font-mono text-4xl font-semibold leading-none" [class]="clases().numero">{{ p.total }}</span>
              <span class="text-sm text-[var(--color-ink-soft)]">/ {{ MAXIMO_NEWS2 }}</span>
            </div>
            <p class="mt-1 text-xs uppercase tracking-wider font-semibold text-[var(--color-ink-soft)]">
              Alerta temprana (NEWS2)
            </p>
          </div>
        </div>

        <!-- Nivel de riesgo -->
        <div class="flex flex-col gap-1 max-w-96 flex-1 min-w-64">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="self-start font-display font-semibold text-xs uppercase tracking-wide px-3 py-1.5 rounded-full" [class]="clases().chip">
              {{ nivel().texto }}
            </span>
            @if (p.banderaRoja) {
              <span class="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-status-critical)]">
                <ng-icon name="lucideTriangleAlert" size="13" />
                Un signo en rango crítico
              </span>
            }
          </div>
          <p class="m-0 text-sm text-[var(--color-ink-soft)]">{{ nivel().detalle }}</p>
        </div>

        <!-- Qué signos aportan puntos -->
        <div class="flex flex-col gap-1.5 min-w-48">
          @if (aportantes().length === 0) {
            <p class="m-0 text-xs text-[var(--color-ink-soft)]">Ningún signo suma puntos.</p>
          } @else {
            @for (s of aportantes(); track s.signoCodigo) {
              <div class="flex items-center justify-between gap-3 text-xs">
                <span class="text-[var(--color-ink)]">{{ etiqueta(s.signoCodigo) }}</span>
                <span class="font-mono font-semibold text-[var(--color-ink-soft)]">
                  {{ s.valor }} · +{{ s.puntos }}
                </span>
              </div>
            }
          }
        </div>
      </section>

      <!-- El denominador es el maximo de la escala completa, asi que hay que decir
           sobre cuantos parametros se calculo realmente: sin eso, un puntaje bajo
           podria leerse como "paciente estable" cuando en realidad faltan signos. -->
      <p class="m-0 mt-2 flex items-start gap-1.5 text-xs text-[var(--color-ink-soft)] leading-relaxed">
        <ng-icon name="lucideInfo" size="13" class="mt-0.5 shrink-0" />
        <span>
          {{ notaAlcance() }} Escala de apoyo a la decisión clínica: orienta la
          revisión, no reemplaza el criterio médico.
        </span>
      </p>
    }
  `,
})
export class News2Panel {
  private consultas = inject(ConsultasService);

  idPaciente = input.required<number>();

  protected readonly PARAMETROS_NEWS2 = PARAMETROS_NEWS2;
  protected readonly MAXIMO_NEWS2 = MAXIMO_NEWS2;

  puntaje = signal<PuntajeNews2DTO | null>(null);

  /** Solo los signos que suman puntos: son los que explican el riesgo. */
  aportantes = computed(() =>
    (this.puntaje()?.detalle ?? []).filter((s) => s.puntos > 0).sort((a, b) => b.puntos - a.puntos)
  );

  /**
   * El puntaje siempre se muestra sobre 20, el máximo de la escala publicada, pero se
   * calcula con menos parámetros: PulsoCare no capta nivel de conciencia ni oxígeno
   * suplementario, y un paciente puede además no tener lectura de algún signo. Decirlo
   * evita que un total bajo se lea como "estable" cuando en realidad está incompleto.
   */
  notaAlcance = computed(() => {
    const medidos = this.puntaje()?.detalle.length ?? 0;
    const base = `Sobre un máximo de ${MAXIMO_NEWS2} de la escala completa (7 parámetros). PulsoCare mide ${PARAMETROS_NEWS2}`;
    return medidos < PARAMETROS_NEWS2
      ? `${base} y este paciente tiene lecturas de ${medidos}, así que el puntaje es un piso.`
      : `${base}, así que el puntaje es un piso.`;
  });

  nivel = computed(() => NIVEL[this.puntaje()?.nivelRiesgo ?? 'BAJO']);
  clases = computed(() => CLASES[this.puntaje()?.nivelRiesgo ?? 'BAJO']);

  private cargaEnCurso = false;

  constructor() {
    effect((onCleanup) => {
      const id = this.idPaciente();
      void this.cargar(id);
      const t = setInterval(() => this.cargar(id), INTERVALO_REFRESCO_MS);
      onCleanup(() => clearInterval(t));
    });
  }

  etiqueta(codigo: string): string {
    return definicionSigno(codigo).etiqueta;
  }

  /**
   * El puntaje es informativo: si la consulta falla se conserva el último valor y no se
   * muestra error, para no ensuciar la vista clínica por un fallo pasajero.
   */
  private async cargar(idPaciente: number) {
    if (this.cargaEnCurso) return;
    this.cargaEnCurso = true;
    try {
      this.puntaje.set(await this.consultas.news2(idPaciente));
    } catch {
      // se mantiene el valor previo
    } finally {
      this.cargaEnCurso = false;
    }
  }
}
