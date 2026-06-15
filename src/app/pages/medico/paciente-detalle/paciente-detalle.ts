import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { PACIENTES, buscarPaciente } from '../../../data/mock-data';
import { Topbar } from '../../../shared/topbar/topbar';
import { VitalsBoard } from '../../../shared/vitals-board/vitals-board';

@Component({
  selector: 'app-paciente-detalle',
  imports: [Topbar, VitalsBoard],
  template: `
    @if (paciente()) {
      <app-topbar
        titulo="Signos vitales"
        [subtitulo]="
          paciente()!.nombre +
          ' ' +
          paciente()!.apellidoPaterno +
          ' ' +
          paciente()!.apellidoMaterno +
          ' · Familiar a cargo: ' +
          paciente()!.familiar
        "
        usuario="Dr. Carlos Valverde"
        rol="Médico"
        [volver]="true"
        (cerrarSesion)="cerrarSesion()"
      />

      <main class="max-w-6xl mx-auto p-7">
        <app-vitals-board [paciente]="paciente()!" />
      </main>
    } @else {
      <main class="max-w-6xl mx-auto p-7 flex items-center justify-center min-h-[60vh] text-[var(--color-ink-soft)]">
        <p>No se encontró el paciente solicitado.</p>
      </main>
    }
  `,
})
export class PacienteDetalle {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  private id = toSignal(this.route.paramMap.pipe(map((p) => p.get('id') ?? '')), {
    initialValue: '',
  });

  paciente = computed(() => buscarPaciente(this.id()) ?? PACIENTES[0]);

  cerrarSesion() {
    this.router.navigateByUrl('/');
  }
}
