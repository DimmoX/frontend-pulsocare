import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { PACIENTES } from '../../../data/mock-data';
import { Topbar } from '../../../shared/topbar/topbar';
import { VitalsBoard } from '../../../shared/vitals-board/vitals-board';

@Component({
  selector: 'app-signos-vitales-familiar',
  imports: [Topbar, VitalsBoard],
  template: `
    <app-topbar
      titulo="Signos vitales"
      [subtitulo]="'Paciente: ' + paciente.nombre + ' ' + paciente.apellidoPaterno"
      usuario="Marcela Fuentealba"
      rol="Familiar"
      (cerrarSesion)="cerrarSesion()"
    />

    <main class="max-w-6xl mx-auto p-7 flex flex-col gap-5">
      <app-vitals-board [paciente]="paciente" />

      <p class="text-sm text-[var(--color-ink-soft)] leading-relaxed max-w-3xl">
        Esta vista se actualiza automáticamente y solo muestra los valores numéricos de los
        signos vitales de tu familiar. Si un bloque cambia a amarillo o rojo, el equipo médico
        también recibirá una alerta por mensaje de texto.
      </p>
    </main>
  `,
})
export class SignosVitalesFamiliar {
  private router = inject(Router);

  // En el mockup, el familiar solo tiene acceso al paciente que tiene a cargo.
  paciente = PACIENTES[0];

  cerrarSesion() {
    this.router.navigateByUrl('/');
  }
}
