import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowRight, lucideClock4, lucideUserRound } from '@ng-icons/lucide';
import { AdminStore } from '../../admin/admin-store';
import { AuthStore } from '../../../core/services/auth.store';
import { ConsultasService } from '../../../core/services/consultas.service';
import { edadDesdeFechaNacimiento, PacienteDTO } from '../../../core/models/paciente.dto';
import { EstadoSigno } from '../../../core/models/consultas.dto';
import { Topbar } from '../../../shared/topbar/topbar';

const ESTADO_COPY: Record<EstadoSigno, string> = {
  ok: 'Estable',
  alerta: 'En observación',
  critico: 'Atención requerida',
};

const ESTADO_CLASES: Record<EstadoSigno, { borde: string; chip: string }> = {
  ok: { borde: 'border-l-[var(--color-status-ok)]', chip: 'bg-[var(--color-status-ok-soft)] text-[var(--color-status-ok)]' },
  alerta: { borde: 'border-l-[var(--color-status-warn)]', chip: 'bg-[var(--color-status-warn-soft)] text-[var(--color-status-warn)]' },
  critico: { borde: 'border-l-[var(--color-status-critical)]', chip: 'bg-[var(--color-status-critical-soft)] text-[var(--color-status-critical)]' },
};

@Component({
  selector: 'app-pacientes',
  imports: [Topbar, NgIcon],
  viewProviders: [provideIcons({ lucideUserRound, lucideClock4, lucideArrowRight })],
  template: `
    <app-topbar
      titulo="Mis pacientes"
      subtitulo="Pacientes en hospitalización domiciliaria asignados a tu cuidado"
      [usuario]="nombreUsuario()"
      rol="Médico"
      (cerrarSesion)="cerrarSesion()"
    />

    <main class="max-w-6xl mx-auto p-7">
      @if (cargando()) {
        <p class="text-sm text-[var(--color-ink-soft)]">Cargando pacientes…</p>
      } @else if (pacientes().length === 0) {
        <p class="text-sm text-[var(--color-ink-soft)]">
          Todavía no tienes pacientes asignados. Pídele al administrador que te asigne uno desde
          la sección "Médicos y familiares".
        </p>
      } @else {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          @for (paciente of pacientes(); track paciente.idPaciente) {
            <button
              type="button"
              class="flex flex-col gap-2.5 text-left p-6 rounded-2xl border border-[var(--color-border)] border-l-[6px] bg-[var(--color-surface)] cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg font-body"
              [class]="clases(paciente.idPaciente).borde"
              (click)="verPaciente(paciente.idPaciente)"
            >
              <div class="flex items-center justify-between">
                <span class="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary-dark)]">
                  <ng-icon name="lucideUserRound" size="20" />
                </span>
                <span class="font-display text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-full" [class]="clases(paciente.idPaciente).chip">
                  {{ ESTADO_COPY[estado(paciente.idPaciente)] }}
                </span>
              </div>

              <h2 class="font-display text-lg font-semibold m-0 text-[var(--color-ink)]">
                {{ paciente.nombre }} {{ paciente.apellidoPaterno }} {{ paciente.apellidoMaterno }}
              </h2>
              <p class="m-0 text-sm text-[var(--color-ink-soft)]">{{ edad(paciente) }} años</p>

              <div class="mt-2 flex items-center justify-end pt-3 border-t border-[var(--color-border)] text-xs">
                <span class="inline-flex items-center gap-1 font-semibold text-[var(--color-primary)]">
                  Ver signos vitales
                  <ng-icon name="lucideArrowRight" size="14" />
                </span>
              </div>
            </button>
          }
        </div>
      }
    </main>
  `,
})
export class Pacientes implements OnInit {
  private router = inject(Router);
  private adminStore = inject(AdminStore);
  private authStore = inject(AuthStore);
  private consultas = inject(ConsultasService);

  protected readonly ESTADO_COPY = ESTADO_COPY;

  cargando = signal(true);
  private estadosPorPaciente = signal<Record<number, EstadoSigno>>({});

  pacientes = computed(() => {
    const idUsuario = this.authStore.usuario()?.idUsuario;
    return idUsuario ? this.adminStore.pacientesPorUsuario()[idUsuario] ?? [] : [];
  });

  nombreUsuario = computed(() => {
    const u = this.authStore.usuario();
    return u ? `Dr. ${u.nombre} ${u.apellidoPaterno}` : 'Médico';
  });

  async ngOnInit() {
    const idUsuario = this.authStore.usuario()?.idUsuario;
    if (!idUsuario) {
      this.cargando.set(false);
      return;
    }
    await this.adminStore.cargarPacientesDeUsuario(idUsuario);
    await this.cargarEstados();
    this.cargando.set(false);
  }

  private async cargarEstados() {
    const resultados: Record<number, EstadoSigno> = {};
    await Promise.all(
      this.pacientes().map(async (p) => {
        try {
          const alertas = await this.consultas.alertas(p.idPaciente);
          const activas = alertas.filter((a) => a.estadoCodigo === 'GENERADA' || a.estadoCodigo === 'NOTIFICADA');
          resultados[p.idPaciente] = activas.some((a) => a.nivelCodigo === 'ROJO')
            ? 'critico'
            : activas.length > 0
              ? 'alerta'
              : 'ok';
        } catch {
          resultados[p.idPaciente] = 'ok';
        }
      })
    );
    this.estadosPorPaciente.set(resultados);
  }

  edad(p: PacienteDTO): number {
    return edadDesdeFechaNacimiento(p.fechaNacimiento);
  }

  estado(idPaciente: number): EstadoSigno {
    return this.estadosPorPaciente()[idPaciente] ?? 'ok';
  }

  clases(idPaciente: number) {
    return ESTADO_CLASES[this.estado(idPaciente)];
  }

  verPaciente(idPaciente: number) {
    this.router.navigateByUrl(`/medico/pacientes/${idPaciente}`);
  }

  cerrarSesion() {
    this.router.navigateByUrl('/');
  }
}
