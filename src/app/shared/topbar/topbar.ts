import { Component, input, output } from '@angular/core';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowLeft, lucideHeartPulse, lucideLogOut } from '@ng-icons/lucide';
import { EcgTrace } from '../ecg-trace/ecg-trace';
import { MsalService } from '@azure/msal-angular';

@Component({
  selector: 'app-topbar',
  imports: [NgIcon, EcgTrace],
  viewProviders: [provideIcons({ lucideHeartPulse, lucideLogOut, lucideArrowLeft })],
  template: `
    <header class="flex items-center gap-6 px-7 py-4 bg-[var(--color-surface)] border-b border-[var(--color-border)] flex-wrap">
      <div class="flex items-center gap-3">
        <span class="flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--color-primary)] text-white shrink-0">
          <ng-icon name="lucideHeartPulse" size="20" />
        </span>
        <div class="flex flex-col gap-0.5">
          <span class="font-display font-bold text-lg text-[var(--color-primary-dark)] tracking-tight">PulsoCare</span>
          <span class="block w-20 h-2.5 text-[var(--color-pulse)]"><app-ecg-trace color="var(--color-pulse)" /></span>
        </div>
      </div>

      <div class="flex-1 min-w-48">
        @if (volverA()) {
          <button type="button" class="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-primary)] bg-transparent border-none p-0 pb-1.5 cursor-pointer" (click)="onVolver()">
            <ng-icon name="lucideArrowLeft" size="16" />
            Volver
          </button>
        }
        <h1 class="font-display text-xl font-semibold text-[var(--color-ink)] m-0">{{ titulo() }}</h1>
        @if (subtitulo()) {
          <p class="mt-0.5 text-sm text-[var(--color-ink-soft)]">{{ subtitulo() }}</p>
        }
      </div>

      <div class="flex items-center gap-4">
        <div class="flex flex-col items-end leading-tight">
          <span class="font-semibold text-sm">{{ usuario() }}</span>
          <span class="text-xs text-[var(--color-ink-soft)] uppercase tracking-wider">{{ rol() }}</span>
        </div>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-ink-soft)] bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-xl px-3.5 py-2 cursor-pointer transition-colors hover:text-[var(--color-status-critical)] hover:border-[var(--color-status-critical)]/40"
          (click)="cierreSesion()"
        >
          <ng-icon name="lucideLogOut" size="16" />
          Salir
        </button>
      </div>
    </header>
  `,
})
export class Topbar {
  titulo = input.required<string>();
  subtitulo = input<string>('');
  usuario = input<string>('');
  rol = input<string>('');

  /**
   * URL a la que vuelve el boton; vacio lo oculta. Es explicita a proposito: las rutas
   * se declaran como un solo segmento ("pacientes/:id/historico"), asi que un
   * navigate(['..']) relativo subiria por el arbol de rutas (a /medico) y no por la URL.
   */
  volverA = input<string>('');

  cerrarSesion = output<void>();

  constructor(
    private router: Router,
    private authService: MsalService
  ) {}

  onVolver() {
    this.router.navigateByUrl(this.volverA());
  }

  cierreSesion() {
    this.authService.logoutRedirect({ });
  }
}
