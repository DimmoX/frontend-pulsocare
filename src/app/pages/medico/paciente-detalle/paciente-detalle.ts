import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { AdminStore } from '../../admin/admin-store';
import { AuthStore } from '../../../core/services/auth.store';
import { Topbar } from '../../../shared/topbar/topbar';
import { VitalsBoard } from '../../../shared/vitals-board/vitals-board';

@Component({
  selector: 'app-paciente-detalle',
  imports: [Topbar, VitalsBoard],
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

      <main class="max-w-6xl mx-auto p-7">
        <app-vitals-board [paciente]="p" [puedeReconocerAlertas]="true" [idUsuarioActual]="idUsuario()" />
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

  cerrarSesion() {
    this.router.navigateByUrl('/');
  }
}
