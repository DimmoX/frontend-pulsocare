import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowRight, lucideClock4, lucideUserRound } from '@ng-icons/lucide';
import { EstadoSigno, PACIENTES, estadoPaciente } from '../../../data/mock-data';
import { Topbar } from '../../../shared/topbar/topbar';

const ESTADO_COPY: Record<EstadoSigno, string> = {
  ok: 'Estable',
  alerta: 'En observación',
  critico: 'Atención requerida',
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
  selector: 'app-pacientes',
  imports: [Topbar, NgIcon],
  viewProviders: [provideIcons({ lucideUserRound, lucideClock4, lucideArrowRight })],
  template: `
    <app-topbar
      titulo="Mis pacientes"
      subtitulo="Pacientes en hospitalización domiciliaria asignados a tu cuidado"
      usuario="Dr. Carlos Valverde"
      rol="Médico"
      (cerrarSesion)="cerrarSesion()"
    />

    <main class="max-w-6xl mx-auto p-7">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        @for (paciente of pacientes; track paciente.id) {
          <button
            type="button"
            class="flex flex-col gap-2.5 text-left p-6 rounded-2xl border border-[var(--color-border)] border-l-[6px] bg-[var(--color-surface)] cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg font-body"
            [class]="clases(paciente).borde"
            (click)="verPaciente(paciente.id)"
          >
            <div class="flex items-center justify-between">
              <span class="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary-dark)]">
                <ng-icon name="lucideUserRound" size="20" />
              </span>
              <span class="font-display text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-full" [class]="clases(paciente).chip">
                {{ ESTADO_COPY[estado(paciente)] }}
              </span>
            </div>

            <h2 class="font-display text-lg font-semibold m-0 text-[var(--color-ink)]">
              {{ paciente.nombre }} {{ paciente.apellidoPaterno }} {{ paciente.apellidoMaterno }}
            </h2>
            <p class="m-0 text-sm text-[var(--color-ink-soft)]">{{ paciente.edad }} años · {{ paciente.diagnostico }}</p>
            <p class="m-0 text-xs text-[var(--color-ink-faint)]">{{ paciente.habitacion }}</p>

            <div class="mt-2 flex items-center justify-between pt-3 border-t border-[var(--color-border)] text-xs text-[var(--color-ink-soft)]">
              <span class="inline-flex items-center gap-1">
                <ng-icon name="lucideClock4" size="14" />
                {{ paciente.ultimaActualizacion }}
              </span>
              <span class="inline-flex items-center gap-1 font-semibold text-[var(--color-primary)]">
                Ver signos vitales
                <ng-icon name="lucideArrowRight" size="14" />
              </span>
            </div>
          </button>
        }
      </div>
    </main>
  `,
})
export class Pacientes {
  private router = inject(Router);

  protected readonly ESTADO_COPY = ESTADO_COPY;
  pacientes = PACIENTES;

  estado(paciente: (typeof PACIENTES)[number]): EstadoSigno {
    return estadoPaciente(paciente);
  }

  clases(paciente: (typeof PACIENTES)[number]) {
    return ESTADO_CLASES[this.estado(paciente)];
  }

  verPaciente(id: string) {
    this.router.navigateByUrl(`/medico/pacientes/${id}`);
  }

  cerrarSesion() {
    this.router.navigateByUrl('/');
  }
}
