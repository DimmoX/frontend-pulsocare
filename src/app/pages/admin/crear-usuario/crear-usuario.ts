import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideCheck,
  lucideLink,
  lucideStethoscope,
  lucideUserPlus,
  lucideUsersRound,
} from '@ng-icons/lucide';
import { TipoUsuario, UsuarioStaff } from '../../../data/mock-data';
import { Topbar } from '../../../shared/topbar/topbar';
import { AdminStore } from '../admin-store';
import { AdminTabs } from '../admin-tabs/admin-tabs';

const PARENTESCOS = ['Hijo/a', 'Esposo/a', 'Nieto/a', 'Hermano/a', 'Cuidador/a', 'Otro'];

@Component({
  selector: 'app-crear-usuario',
  imports: [ReactiveFormsModule, NgIcon, Topbar, AdminTabs],
  viewProviders: [
    provideIcons({ lucideUserPlus, lucideStethoscope, lucideUsersRound, lucideCheck, lucideLink }),
  ],
  template: `
    <app-topbar
      titulo="Crear usuario"
      subtitulo="Registra médicos y familiares con acceso a PulsoCare"
      usuario="Equipo de soporte"
      rol="Administrador"
      (cerrarSesion)="cerrarSesion()"
    />
    <app-admin-tabs />

    <main class="max-w-6xl mx-auto p-7 grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6">
      <section class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-7">
        <div class="flex flex-col gap-2.5 mb-6">
          <span class="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-soft)]">Tipo de usuario</span>
          <div class="flex gap-3">
            <button
              type="button"
              class="inline-flex items-center gap-2 px-4.5 py-2.5 rounded-xl border text-sm font-semibold cursor-pointer transition-all"
              [class]="tipo() === 'medico'
                ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary-dark)]'
                : 'border-[var(--color-border)] bg-[var(--color-surface-sunken)] text-[var(--color-ink-soft)]'"
              (click)="seleccionarTipo('medico')"
            >
              <ng-icon name="lucideStethoscope" size="18" />
              Médico
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-2 px-4.5 py-2.5 rounded-xl border text-sm font-semibold cursor-pointer transition-all"
              [class]="tipo() === 'familiar'
                ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary-dark)]'
                : 'border-[var(--color-border)] bg-[var(--color-surface-sunken)] text-[var(--color-ink-soft)]'"
              (click)="seleccionarTipo('familiar')"
            >
              <ng-icon name="lucideUsersRound" size="18" />
              Familiar del paciente
            </button>
          </div>
        </div>

        <form [formGroup]="form" (ngSubmit)="guardar()">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4.5">
            <label class="flex flex-col gap-1.5">
              <span class="text-sm font-semibold text-[var(--color-ink)]">Nombre</span>
              <input class="px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] text-sm text-[var(--color-ink)] bg-[var(--color-surface)] font-body focus:outline-none focus:border-[var(--color-primary)]" type="text" formControlName="nombre" placeholder="Daniel" />
              @if (mostrarError('nombre')) {
                <span class="text-xs text-[var(--color-status-critical)]">Este campo es obligatorio.</span>
              }
            </label>

            <label class="flex flex-col gap-1.5">
              <span class="text-sm font-semibold text-[var(--color-ink)]">Apellido paterno</span>
              <input class="px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] text-sm text-[var(--color-ink)] bg-[var(--color-surface)] font-body focus:outline-none focus:border-[var(--color-primary)]" type="text" formControlName="apellidoPaterno" placeholder="San Juan" />
              @if (mostrarError('apellidoPaterno')) {
                <span class="text-xs text-[var(--color-status-critical)]">Este campo es obligatorio.</span>
              }
            </label>

            <label class="flex flex-col gap-1.5">
              <span class="text-sm font-semibold text-[var(--color-ink)]">Apellido materno</span>
              <input class="px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] text-sm text-[var(--color-ink)] bg-[var(--color-surface)] font-body focus:outline-none focus:border-[var(--color-primary)]" type="text" formControlName="apellidoMaterno" placeholder="Pérez" />
              @if (mostrarError('apellidoMaterno')) {
                <span class="text-xs text-[var(--color-status-critical)]">Este campo es obligatorio.</span>
              }
            </label>

            <label class="flex flex-col gap-1.5">
              <span class="text-sm font-semibold text-[var(--color-ink)]">Fecha de nacimiento</span>
              <input class="px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] text-sm text-[var(--color-ink)] bg-[var(--color-surface)] font-body focus:outline-none focus:border-[var(--color-primary)]" type="date" formControlName="fechaNacimiento" />
              @if (mostrarError('fechaNacimiento')) {
                <span class="text-xs text-[var(--color-status-critical)]">Este campo es obligatorio.</span>
              }
            </label>

            @if (tipo() === 'familiar') {
              <label class="flex flex-col gap-1.5 sm:col-span-2">
                <span class="text-sm font-semibold text-[var(--color-ink)]">Parentesco con el paciente</span>
                <select class="px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] text-sm text-[var(--color-ink)] bg-[var(--color-surface)] font-body focus:outline-none focus:border-[var(--color-primary)]" formControlName="parentesco">
                  <option value="" disabled>Selecciona una opción</option>
                  @for (opcion of parentescos; track opcion) {
                    <option [value]="opcion">{{ opcion }}</option>
                  }
                </select>
                @if (mostrarError('parentesco')) {
                  <span class="text-xs text-[var(--color-status-critical)]">Selecciona el parentesco.</span>
                }
              </label>
            }

            <label class="flex flex-col gap-1.5 sm:col-span-2">
              <span class="text-sm font-semibold text-[var(--color-ink)]">Correo electrónico</span>
              <input class="px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] text-sm text-[var(--color-ink)] bg-[var(--color-surface)] font-body focus:outline-none focus:border-[var(--color-primary)]" type="email" formControlName="correo" placeholder="usuario@pulsocare.cl" />
              @if (mostrarError('correo')) {
                <span class="text-xs text-[var(--color-status-critical)]">Ingresa un correo válido.</span>
              }
            </label>

            <label class="flex flex-col gap-1.5 sm:col-span-2">
              <span class="text-sm font-semibold text-[var(--color-ink)]">Contraseña temporal</span>
              <input class="px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] text-sm text-[var(--color-ink)] bg-[var(--color-surface)] font-body focus:outline-none focus:border-[var(--color-primary)]" type="password" formControlName="contrasena" placeholder="Mínimo 8 caracteres" />
              @if (mostrarError('contrasena')) {
                <span class="text-xs text-[var(--color-status-critical)]">Debe tener al menos 8 caracteres.</span>
              }
            </label>
          </div>

          <div class="flex justify-end gap-3 mt-6">
            <button type="button" class="px-4.5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-ink-soft)] text-sm font-semibold cursor-pointer" (click)="form.reset({ parentesco: '' })">
              Limpiar formulario
            </button>
            <button type="submit" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border-none bg-[var(--color-primary)] text-white text-sm font-semibold cursor-pointer transition-colors hover:bg-[var(--color-primary-dark)]">
              <ng-icon name="lucideUserPlus" size="18" />
              Crear usuario
            </button>
          </div>

          @if (mensajeExito()) {
            <p class="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-status-ok)]">
              <ng-icon name="lucideCheck" size="16" />
              {{ mensajeExito() }}
            </p>
          }
        </form>
      </section>

      <section class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-7">
        <h2 class="font-display text-base font-semibold m-0 mb-4 text-[var(--color-ink)]">Médicos y familiares registrados</h2>

        @if (usuarios().length === 0) {
          <p class="text-sm text-[var(--color-ink-soft)]">Aún no se han creado usuarios.</p>
        } @else {
          <ul class="flex flex-col gap-3 list-none m-0 p-0">
            @for (u of usuarios(); track u.id) {
              <li class="border border-[var(--color-border)] rounded-2xl p-4">
                <div class="flex items-center gap-3">
                  <span
                    class="flex items-center justify-center w-9 h-9 rounded-xl shrink-0"
                    [class]="u.tipo === 'medico'
                      ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary-dark)]'
                      : 'bg-[var(--color-pulse-soft)] text-[var(--color-pulse)]'"
                  >
                    <ng-icon [name]="u.tipo === 'medico' ? 'lucideStethoscope' : 'lucideUsersRound'" size="16" />
                  </span>
                  <div class="flex flex-col gap-0.5 min-w-0">
                    <span class="font-semibold text-sm text-[var(--color-ink)] truncate">{{ u.nombreCompleto }}</span>
                    <span class="text-xs text-[var(--color-ink-soft)] truncate">
                      {{ u.correo }} · {{ u.tipo === 'medico' ? 'Médico' : 'Familiar · ' + u.parentesco }}
                    </span>
                  </div>
                </div>

                <div class="mt-3 pt-3 border-t border-[var(--color-border)]">
                  <p class="m-0 mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-ink-soft)] uppercase tracking-wide">
                    <ng-icon name="lucideLink" size="13" />
                    {{ u.tipo === 'medico' ? 'Pacientes asignados' : 'Paciente asignado' }}
                  </p>

                  @if (u.tipo === 'medico') {
                    <div class="flex flex-wrap gap-1.5">
                      @for (p of pacientes(); track p.id) {
                        <button
                          type="button"
                          class="px-2.5 py-1.5 rounded-full border text-xs font-semibold cursor-pointer transition-all"
                          [class]="u.pacientesAsignados.includes(p.id)
                            ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary-dark)]'
                            : 'border-[var(--color-border)] bg-[var(--color-surface-sunken)] text-[var(--color-ink-soft)]'"
                          (click)="alternarMedico(u, p.id)"
                        >
                          {{ p.nombre }} {{ p.apellidoPaterno }}
                        </button>
                      }
                    </div>
                  } @else {
                    <select
                      class="w-full px-3 py-2 rounded-xl border border-[var(--color-border)] text-sm text-[var(--color-ink)] bg-[var(--color-surface)] font-body focus:outline-none focus:border-[var(--color-primary)]"
                      [value]="u.pacientesAsignados.length > 0 ? u.pacientesAsignados[0] : ''"
                      (change)="asignarFamiliar(u, $event)"
                    >
                      <option value="">Sin paciente asignado</option>
                      @for (p of pacientes(); track p.id) {
                        <option [value]="p.id">{{ p.nombre }} {{ p.apellidoPaterno }} {{ p.apellidoMaterno }}</option>
                      }
                    </select>
                  }
                </div>
              </li>
            }
          </ul>
        }
      </section>
    </main>
  `,
})
export class CrearUsuario {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private store = inject(AdminStore);

  protected readonly parentescos = PARENTESCOS;

  tipo = signal<TipoUsuario>('medico');
  mensajeExito = signal('');

  usuarios = this.store.usuarios;
  pacientes = this.store.pacientes;

  form = this.fb.group({
    nombre: this.fb.control('', Validators.required),
    apellidoPaterno: this.fb.control('', Validators.required),
    apellidoMaterno: this.fb.control('', Validators.required),
    fechaNacimiento: this.fb.control('', Validators.required),
    parentesco: this.fb.control(''),
    correo: this.fb.control('', [Validators.required, Validators.email]),
    contrasena: this.fb.control('', [Validators.required, Validators.minLength(8)]),
  });

  seleccionarTipo(tipo: TipoUsuario) {
    this.tipo.set(tipo);
    const parentesco = this.form.controls.parentesco;
    if (tipo === 'familiar') {
      parentesco.setValidators(Validators.required);
    } else {
      parentesco.clearValidators();
      parentesco.setValue('');
    }
    parentesco.updateValueAndValidity();
  }

  mostrarError(control: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[control];
    return c.touched && c.invalid;
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.value;
    this.store.crearUsuario({
      nombre: v.nombre!,
      apellidoPaterno: v.apellidoPaterno!,
      apellidoMaterno: v.apellidoMaterno!,
      tipo: this.tipo(),
      parentesco: this.tipo() === 'familiar' ? v.parentesco! : undefined,
      correo: v.correo!,
    });

    this.mensajeExito.set(
      `Se creó el usuario de ${this.tipo() === 'medico' ? 'médico' : 'familiar'} correctamente.`
    );
    this.form.reset({ parentesco: '' });
  }

  alternarMedico(usuario: UsuarioStaff, pacienteId: string) {
    this.store.alternarAsignacionMedico(usuario.id, pacienteId);
  }

  asignarFamiliar(usuario: UsuarioStaff, evento: Event) {
    const valor = (evento.target as HTMLSelectElement).value;
    this.store.asignarPacienteAFamiliar(usuario.id, valor || null);
  }

  cerrarSesion() {
    this.router.navigateByUrl('/');
  }
}
