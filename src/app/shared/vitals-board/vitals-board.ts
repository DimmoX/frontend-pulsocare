import { Component, computed, input } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideClock4, lucideUserRound } from '@ng-icons/lucide';
import { EstadoSigno, Paciente, estadoPaciente } from '../../data/mock-data';
import { VitalCard } from '../vital-card/vital-card';

const RESUMEN: Record<EstadoSigno, { texto: string; detalle: string }> = {
  ok: { texto: 'Estable', detalle: 'Todos los signos vitales dentro de su rango normal.' },
  alerta: {
    texto: 'En observación',
    detalle: 'Uno o más signos vitales están cerca de su límite normal.',
  },
  critico: {
    texto: 'Atención requerida',
    detalle: 'Uno o más signos vitales están fuera de su rango normal.',
  },
};

const ESTADO_CLASES: Record<EstadoSigno, { borde: string; chip: string }> = {
  ok: {
    borde: 'border-l-[var(--color-status-ok)]',
    chip: 'bg-[var(--color-status-ok-soft)] text-[var(--color-status-ok)]',
  },
  alerta: {
    borde: 'border-l-[var(--color-status-warn)]',
    chip: 'bg-[var(--color-status-warn-soft)] text-[var(--color-status-warn)]',
  },
  critico: {
    borde: 'border-l-[var(--color-status-critical)]',
    chip: 'bg-[var(--color-status-critical-soft)] text-[var(--color-status-critical)]',
  },
};

@Component({
  selector: 'app-vitals-board',
  imports: [VitalCard, NgIcon],
  viewProviders: [provideIcons({ lucideUserRound, lucideClock4 })],
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
            <p class="mt-1 text-sm text-[var(--color-ink-soft)]">
              {{ paciente().edad }} años · {{ paciente().diagnostico }} · {{ paciente().habitacion }}
            </p>
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
          Actualizado {{ paciente().ultimaActualizacion }}
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        @for (signo of paciente().signos; track signo.clave) {
          <app-vital-card [signo]="signo" />
        }
      </div>
    </section>
  `,
})
export class VitalsBoard {
  paciente = input.required<Paciente>();

  estado = computed<EstadoSigno>(() => estadoPaciente(this.paciente()));
  resumen = computed(() => RESUMEN[this.estado()]);
  clases = computed(() => ESTADO_CLASES[this.estado()]);
}
