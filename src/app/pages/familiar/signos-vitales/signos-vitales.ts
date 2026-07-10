import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AdminStore } from '../../admin/admin-store';
import { AuthStore } from '../../../core/services/auth.store';
import { Topbar } from '../../../shared/topbar/topbar';
import { VitalsBoard } from '../../../shared/vitals-board/vitals-board';

@Component({
  selector: 'app-signos-vitales-familiar',
  imports: [Topbar, VitalsBoard],
  template: `
    @if (paciente(); as p) {
      <app-topbar
        titulo="Signos vitales"
        [subtitulo]="'Paciente: ' + p.nombre + ' ' + p.apellidoPaterno"
        [usuario]="nombreUsuario()"
        rol="Familiar"
        (cerrarSesion)="cerrarSesion()"
      />

      <main class="max-w-6xl mx-auto p-7 flex flex-col gap-5">
        <app-vitals-board [paciente]="p" />

        <p class="text-sm text-[var(--color-ink-soft)] leading-relaxed max-w-3xl">
          Esta vista se actualiza automáticamente y solo muestra los valores numéricos de los
          signos vitales de tu familiar. Si un bloque cambia a amarillo o rojo, el equipo médico
          también recibirá una alerta.
        </p>
      </main>
    } @else if (cargando()) {
      <main class="max-w-6xl mx-auto p-7 flex items-center justify-center min-h-[60vh] text-[var(--color-ink-soft)]">
        <p>Cargando paciente…</p>
      </main>
    } @else {
      <main class="max-w-6xl mx-auto p-7 flex items-center justify-center min-h-[60vh] text-[var(--color-ink-soft)]">
        <p>Todavía no tienes un paciente asignado. Contacta al administrador de PulsoCare.</p>
      </main>
    }
  `,
})
export class SignosVitalesFamiliar implements OnInit {
  private router = inject(Router);
  private adminStore = inject(AdminStore);
  private authStore = inject(AuthStore);

  cargando = signal(true);

  nombreUsuario = computed(() => {
    const u = this.authStore.usuario();
    return u ? `${u.nombre} ${u.apellidoPaterno}` : 'Familiar';
  });

  // En el diseño actual un familiar tiene un solo paciente a cargo: se toma el primero.
  paciente = computed(() => {
    const idUsuario = this.authStore.usuario()?.idUsuario;
    if (!idUsuario) return undefined;
    return (this.adminStore.pacientesPorUsuario()[idUsuario] ?? [])[0];
  });

  async ngOnInit() {
    const idUsuario = this.authStore.usuario()?.idUsuario;
    if (idUsuario) {
      await this.adminStore.cargarPacientesDeUsuario(idUsuario);
    }
    this.cargando.set(false);
  }

  cerrarSesion() {
    this.router.navigateByUrl('/');
  }
}
