import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowLeft, lucideHeartPulse, lucideMail } from '@ng-icons/lucide';

@Component({
  selector: 'app-recuperar-password',
  imports: [ReactiveFormsModule, RouterLink, NgIcon],
  viewProviders: [provideIcons({ lucideHeartPulse, lucideMail, lucideArrowLeft })],
  template: `
    <div class="min-h-dvh flex items-center justify-center p-6 bg-gradient-to-b from-[var(--color-primary-soft)] to-[var(--color-bg)]">
      <div class="w-full max-w-md flex flex-col gap-5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-8 sm:p-10">
        <span class="flex items-center justify-center w-12 h-12 rounded-2xl bg-[var(--color-primary)] text-white">
          <ng-icon name="lucideHeartPulse" size="24" />
        </span>

        @if (!enviado()) {
          <h1 class="font-display text-2xl font-semibold m-0 text-[var(--color-ink)]">Recupera tu contraseña</h1>
          <p class="-mt-2 text-sm leading-relaxed text-[var(--color-ink-soft)] m-0">
            Ingresa el correo asociado a tu cuenta y te enviaremos las instrucciones para
            restablecer tu contraseña.
          </p>

          <form class="flex flex-col gap-4" [formGroup]="form" (ngSubmit)="enviar()">
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

            <button type="submit" class="px-4 py-3 rounded-xl border-none bg-[var(--color-primary)] text-white font-semibold text-sm cursor-pointer transition-colors hover:bg-[var(--color-primary-dark)]">
              Enviar instrucciones
            </button>
          </form>
        } @else {
          <h1 class="font-display text-2xl font-semibold m-0 text-[var(--color-ink)]">Revisa tu correo</h1>
          <p class="-mt-2 text-sm leading-relaxed text-[var(--color-ink-soft)] m-0">
            Si {{ form.value.correo }} está registrado en PulsoCare, te enviamos un enlace para
            restablecer tu contraseña.
          </p>
        }

        <a class="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-primary)] no-underline hover:underline" routerLink="/">
          <ng-icon name="lucideArrowLeft" size="16" />
          Volver al inicio de sesión
        </a>
      </div>
    </div>
  `,
})
export class RecuperarPassword {
  private fb = inject(FormBuilder);

  form = this.fb.group({
    correo: this.fb.control('', [Validators.required, Validators.email]),
  });

  enviado = signal(false);

  enviar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.enviado.set(true);
  }
}
