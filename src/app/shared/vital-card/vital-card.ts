import { Component, computed, input } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideActivity,
  lucideDroplets,
  lucideHeartPulse,
  lucideThermometer,
  lucideWind,
} from '@ng-icons/lucide';
import { EstadoSigno, SignoVital, estadoSigno } from '../../data/mock-data';

const ESTADO_COPY: Record<EstadoSigno, { etiqueta: string }> = {
  ok: { etiqueta: 'Normal' },
  alerta: { etiqueta: 'Atención' },
  critico: { etiqueta: 'Crítico' },
};

const ESTADO_CLASES: Record<EstadoSigno, { card: string; icon: string; badge: string }> = {
  ok: {
    card: 'border-[var(--color-status-ok)]/40',
    icon: 'bg-[var(--color-status-ok-soft)] text-[var(--color-status-ok)]',
    badge: 'bg-[var(--color-status-ok-soft)] text-[var(--color-status-ok)]',
  },
  alerta: {
    card: 'border-[var(--color-status-warn)]/50 ring-1 ring-[var(--color-status-warn)]/25',
    icon: 'bg-[var(--color-status-warn-soft)] text-[var(--color-status-warn)]',
    badge: 'bg-[var(--color-status-warn-soft)] text-[var(--color-status-warn)]',
  },
  critico: {
    card: 'border-[var(--color-status-critical)]/60 ring-2 ring-[var(--color-status-critical)]/25',
    icon: 'bg-[var(--color-status-critical-soft)] text-[var(--color-status-critical)]',
    badge: 'bg-[var(--color-status-critical-soft)] text-[var(--color-status-critical)]',
  },
};

@Component({
  selector: 'app-vital-card',
  imports: [NgIcon],
  viewProviders: [
    provideIcons({
      lucideHeartPulse,
      lucideDroplets,
      lucideActivity,
      lucideThermometer,
      lucideWind,
    }),
  ],
  template: `
    <article
      class="flex flex-col justify-between gap-4 p-6 rounded-2xl border bg-[var(--color-surface)] min-h-44 transition-shadow"
      [class]="clases().card"
    >
      <header class="flex items-center justify-between">
        <span class="flex items-center justify-center w-10 h-10 rounded-xl" [class]="clases().icon">
          <ng-icon [name]="signo().icono" size="22" />
        </span>
        <span
          class="font-display text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full"
          [class]="clases().badge"
        >
          {{ copia().etiqueta }}
        </span>
      </header>

      <div class="flex items-baseline gap-1.5">
        <span class="font-mono text-5xl font-semibold leading-none text-[var(--color-ink)]">{{ signo().valor }}</span>
        <span class="font-mono text-lg text-[var(--color-ink-soft)]">{{ signo().unidad }}</span>
      </div>

      <footer class="flex flex-col gap-0.5">
        <span class="font-semibold text-sm text-[var(--color-ink)]">{{ signo().etiqueta }}</span>
        <span class="text-xs text-[var(--color-ink-soft)]">
          Rango normal: {{ signo().rango.min }}–{{ signo().rango.max }} {{ signo().unidad }}
        </span>
      </footer>
    </article>
  `,
})
export class VitalCard {
  signo = input.required<SignoVital>();

  estado = computed<EstadoSigno>(() => estadoSigno(this.signo()));
  copia = computed(() => ESTADO_COPY[this.estado()]);
  clases = computed(() => ESTADO_CLASES[this.estado()]);
}
