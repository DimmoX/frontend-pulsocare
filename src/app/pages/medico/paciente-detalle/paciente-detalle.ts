import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideHistory } from '@ng-icons/lucide';
import { AdminStore } from '../../admin/admin-store';
import { AuthStore } from '../../../core/services/auth.store';
import { Topbar } from '../../../shared/topbar/topbar';
import { VitalsBoard } from '../../../shared/vitals-board/vitals-board';

@Component({
  selector: 'app-paciente-detalle',
  imports: [Topbar, VitalsBoard, NgIcon],
  viewProviders: [provideIcons({ lucideHistory })],
  template: `
    @if (paciente(); as p) {
      <app-topbar
        titulo="Signos vitales"
        [subtitulo]="p.nombre + ' ' + p.apellidoPaterno + ' ' + p.apellidoMaterno"
        [usuario]="nombreUsuario()"
        rol="Médico"
        [volver]="true"
        (cerrarSesion)="cerrarSesion()"
      />

      <main class="max-w-6xl mx-auto p-7 flex flex-col gap-5">
        <app-vitals-board [paciente]="p" />

        <div class="flex justify-end">
          <button
            type="button"
            (click)="verHistorico(p.idPaciente)"
            class="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-primary)] font-semibold text-sm cursor-pointer transition-colors hover:border-[var(--color-primary)]/40"
          >
            <ng-icon name="lucideHistory" size="16" />
            Ver histórico de lecturas
          </button>
        </div>
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
export class PacienteDetalle implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private adminStore = inject(AdminStore);
  private authStore = inject(AuthStore);

  private idPacienteRuta = toSignal(this.route.paramMap.pipe(map((p) => Number(p.get('id')))), {
    initialValue: NaN,
  });

  cargando = signal(true);

  idUsuario = computed(() => this.authStore.usuario()?.idUsuario ?? null);

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
    this.cargando.set(false);
  }

  verHistorico(idPaciente: number) {
    this.router.navigateByUrl(`/medico/pacientes/${idPaciente}/historico`);
  }

  cerrarSesion() {
    this.router.navigateByUrl('/');
  }
}
