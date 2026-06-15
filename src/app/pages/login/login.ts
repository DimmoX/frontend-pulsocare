import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideHeartPulse, lucideLock, lucideMail } from '@ng-icons/lucide';
import { EcgTrace } from '../../shared/ecg-trace/ecg-trace';

type VistaDemo = 'familiar' | 'medico' | 'admin';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, NgIcon, EcgTrace],
  viewProviders: [provideIcons({ lucideHeartPulse, lucideMail, lucideLock })],
  template: `
    <div class="min-h-dvh grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] bg-[var(--color-bg)]">
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

      <section class="flex items-center justify-center p-6 sm:p-8">
        <div class="w-full max-w-sm flex flex-col gap-6 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-8">
          <div>
            <h2 class="font-display text-2xl font-semibold m-0 text-[var(--color-ink)]">Inicia sesión</h2>
            <p class="mt-1.5 text-[var(--color-ink-soft)] text-sm">Ingresa con tu correo institucional para continuar.</p>
          </div>

          <form class="flex flex-col gap-4" [formGroup]="form" (ngSubmit)="ingresar()">
            <label class="flex flex-col gap-1.5">
              <span class="text-sm font-semibold text-[var(--color-ink)]">Correo electrónico</span>
              <span class="flex items-center gap-2.5 px-3.5 py-3 border border-[var(--color-border)] rounded-xl bg-[var(--color-surface)] text-[var(--color-ink-soft)] transition-colors focus-within:border-[var(--color-primary)]">
                <ng-icon name="lucideMail" size="18" />
                <input
                  type="email"
                  formControlName="correo"
                  placeholder="nombre.apellido@pulsocare.cl"
                  autocomplete="email"
                  class="flex-1 border-none outline-none text-sm text-[var(--color-ink)] bg-transparent font-body"
                />
              </span>
              @if (form.controls.correo.touched && form.controls.correo.invalid) {
                <span class="text-xs text-[var(--color-status-critical)]">Ingresa un correo válido.</span>
              }
            </label>

            <label class="flex flex-col gap-1.5">
              <span class="text-sm font-semibold text-[var(--color-ink)]">Contraseña</span>
              <span class="flex items-center gap-2.5 px-3.5 py-3 border border-[var(--color-border)] rounded-xl bg-[var(--color-surface)] text-[var(--color-ink-soft)] transition-colors focus-within:border-[var(--color-primary)]">
                <ng-icon name="lucideLock" size="18" />
                <input
                  type="password"
                  formControlName="contrasena"
                  placeholder="••••••••"
                  autocomplete="current-password"
                  class="flex-1 border-none outline-none text-sm text-[var(--color-ink)] bg-transparent font-body"
                />
              </span>
              @if (form.controls.contrasena.touched && form.controls.contrasena.invalid) {
                <span class="text-xs text-[var(--color-status-critical)]">La contraseña es obligatoria.</span>
              }
            </label>

            <div class="flex justify-end">
              <a class="text-sm font-semibold text-[var(--color-primary)] no-underline hover:underline" routerLink="/recuperar-password">¿Olvidaste tu contraseña?</a>
            </div>

            @if (errorMensaje()) {
              <p class="text-xs text-[var(--color-status-critical)] m-0">{{ errorMensaje() }}</p>
            }

            <button type="submit" class="mt-1 px-4 py-3 rounded-xl border-none bg-[var(--color-primary)] text-white font-semibold text-sm cursor-pointer transition-colors hover:bg-[var(--color-primary-dark)]">
              Ingresar
            </button>
          </form>

          <div class="pt-5 border-t border-dashed border-[var(--color-border)]">
            <p class="m-0 mb-2.5 text-xs text-[var(--color-ink-soft)] uppercase tracking-wide">Vista previa del mockup — entrar como</p>
            <div class="flex gap-2 flex-wrap">
              <button type="button" class="px-3.5 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-sunken)] text-[var(--color-ink)] text-sm font-semibold cursor-pointer transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary-dark)]" (click)="ingresarComo('familiar')">Familiar</button>
              <button type="button" class="px-3.5 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-sunken)] text-[var(--color-ink)] text-sm font-semibold cursor-pointer transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary-dark)]" (click)="ingresarComo('medico')">Médico</button>
              <button type="button" class="px-3.5 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-sunken)] text-[var(--color-ink)] text-sm font-semibold cursor-pointer transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary-dark)]" (click)="ingresarComo('admin')">Administrador</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  `,
})
export class Login {
  private fb = inject(FormBuilder);
  private router = inject(Router);

  form = this.fb.group({
    correo: this.fb.control('', [Validators.required, Validators.email]),
    contrasena: this.fb.control('', [Validators.required]),
  });

  errorMensaje = signal('');

  ingresar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.router.navigateByUrl('/familiar/signos-vitales');
  }

  ingresarComo(vista: VistaDemo) {
    const rutas: Record<VistaDemo, string> = {
      familiar: '/familiar/signos-vitales',
      medico: '/medico/pacientes',
      admin: '/admin/usuarios',
    };
    this.router.navigateByUrl(rutas[vista]);
  }
}
