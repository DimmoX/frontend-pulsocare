import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideHeartPulse, lucideLock, lucideMail, lucideTriangleAlert } from '@ng-icons/lucide';
import { EcgTrace } from '../../shared/ecg-trace/ecg-trace';
import { MsalService } from '@azure/msal-angular';
import { AuthStore } from '../../core/services/auth.store';
import { SCOPE_API } from '../../app.config';

@Component({
  selector: 'app-login',
  imports: [NgIcon, EcgTrace],
  viewProviders: [provideIcons({ lucideHeartPulse, lucideTriangleAlert })],
  template: `
    <div class="min-h-dvh grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] bg-[var(--color-bg)]">
      <!-- PANEL IZQUIERDO -->
      <section class="relative flex flex-col justify-between p-8 lg:p-12 overflow-hidden bg-gradient-to-br from-[var(--color-primary-dark)] to-[var(--color-primary)] text-[var(--color-primary-soft)]">
        <div class="flex flex-col gap-5 max-w-md">
          <span class="flex items-center justify-center w-12 h-12 rounded-2xl bg-white/15 text-white">
            <ng-icon name="lucideHeartPulse" size="26" />
          </span>
          <h1 class="font-display text-4xl lg:text-5xl font-bold tracking-tight m-0 text-white">PulsoCare</h1>
          <p class="text-base leading-relaxed m-0 text-[var(--color-primary-soft)]">
            Monitoreo en tiempo real de los signos vitales de pacientes en hospitalización
            domiciliaria, al alcance del equipo médico y la familia.
          </p>
        </div>
        <div class="w-full h-16 opacity-85">
          <app-ecg-trace color="var(--color-pulse)" />
        </div>
      </section>

      <!-- PANEL DERECHO -->
      <section class="flex items-center justify-center p-6 sm:p-8">
        <div class="w-full max-w-sm flex flex-col gap-6 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-8">
          <div>
            <h2 class="font-display text-2xl font-semibold m-0 text-[var(--color-ink)]">Inicia sesión</h2>
            <p class="mt-1.5 text-[var(--color-ink-soft)] text-sm">
              Serás redirigido a la plataforma segura de Microsoft para ingresar tus credenciales.
            </p>
          </div>

          @if (motivoRechazo(); as motivo) {
            <div
              role="alert"
              class="flex items-start gap-2 mt-4 p-3.5 px-4 rounded-xl bg-[var(--color-status-critical-soft)] border border-[var(--color-status-critical)]/30 text-sm text-[var(--color-status-critical)]"
            >
              <ng-icon name="lucideTriangleAlert" size="17" class="mt-0.5 shrink-0" />
              <span>{{ motivo }}</span>
            </div>
          }

          <div class="flex flex-col gap-4 mt-2">
            <button
              (click)="iniciarSesion()"
              class="w-full px-4 py-3 rounded-xl border-none bg-[var(--color-primary)] text-white font-semibold text-sm cursor-pointer transition-colors hover:bg-[var(--color-primary-dark)]">
              Ingresar de forma segura
            </button>
          </div>
        </div>
      </section>
    </div>
  `,
})
export class Login {
  private authService = inject(MsalService);
  private authStore = inject(AuthStore);

  /** Por qué se rechazó la sesión anterior, si es que la hubo. */
  motivoRechazo = this.authStore.motivoRechazo.asReadonly();

  iniciarSesion() {
    // Se limpia antes de reintentar: el aviso es de la sesión anterior y dejarlo
    // visible durante el nuevo intento haría creer que volvió a fallar.
    this.authStore.motivoRechazo.set(null);
    // Los scopes van explicitos: loginRedirect() a secas NO aplica el authRequest de
    // la configuracion (eso solo lo hace MsalGuard al proteger rutas), asi que sin
    // esto B2C emite solo el idToken y las llamadas al backend salen sin token.
    this.authService.loginRedirect({ scopes: ['openid', 'profile', SCOPE_API] });
  }
}
