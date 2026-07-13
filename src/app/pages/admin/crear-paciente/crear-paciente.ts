import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheck, lucideHeartHandshake, lucideUserRound } from '@ng-icons/lucide';
import { Topbar } from '../../../shared/topbar/topbar';
import { AdminStore } from '../admin-store';
import { AdminTabs } from '../admin-tabs/admin-tabs';
import { edadDesdeFechaNacimiento, generoDesdeSexo, PacienteDTO } from '../../../core/models/paciente.dto';

const SEXOS: { valor: 'M' | 'F'; etiqueta: string }[] = [
  { valor: 'M', etiqueta: 'Masculino' },
  { valor: 'F', etiqueta: 'Femenino' },
];

@Component({
  selector: 'app-crear-paciente',
  imports: [ReactiveFormsModule, NgIcon, Topbar, AdminTabs],
  viewProviders: [provideIcons({ lucideUserRound, lucideHeartHandshake, lucideCheck })],
  template: `
    <app-topbar
      titulo="Crear paciente"
      subtitulo="Registra los datos personales del paciente en PulsoCare"
      usuario="Equipo de soporte"
      rol="Administrador"
      (cerrarSesion)="cerrarSesion()"
    />
    <app-admin-tabs />

    <main class="max-w-6xl mx-auto p-7 grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6 items-start">
      <section class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-7 lg:sticky lg:top-7 lg:h-[600px]">
        <div class="flex items-center gap-3 mb-6">
          <span class="flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary-dark)]">
            <ng-icon name="lucideUserRound" size="20" />
          </span>
          <div>
            <h2 class="font-display text-base font-semibold m-0 text-[var(--color-ink)]">Datos personales del paciente</h2>
            <p class="m-0 text-sm text-[var(--color-ink-soft)]">Estos datos se usarán para identificar al paciente en el sistema.</p>
          </div>
        </div>

        <form [formGroup]="form" (ngSubmit)="guardar()">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4.5">
            <label class="flex flex-col gap-1.5 sm:col-span-2">
              <span class="text-sm font-semibold text-[var(--color-ink)]">Nombre</span>
              <input class="px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] text-sm text-[var(--color-ink)] bg-[var(--color-surface)] font-body focus:outline-none focus:border-[var(--color-primary)]" type="text" formControlName="nombre" placeholder="Rosa" />
              @if (mostrarError('nombre')) {
                <span class="text-xs text-[var(--color-status-critical)]">Este campo es obligatorio.</span>
              }
            </label>

            <label class="flex flex-col gap-1.5">
              <span class="text-sm font-semibold text-[var(--color-ink)]">Apellido paterno</span>
              <input class="px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] text-sm text-[var(--color-ink)] bg-[var(--color-surface)] font-body focus:outline-none focus:border-[var(--color-primary)]" type="text" formControlName="apellidoPaterno" placeholder="Fuentealba" />
              @if (mostrarError('apellidoPaterno')) {
                <span class="text-xs text-[var(--color-status-critical)]">Este campo es obligatorio.</span>
              }
            </label>

            <label class="flex flex-col gap-1.5">
              <span class="text-sm font-semibold text-[var(--color-ink)]">Apellido materno</span>
              <input class="px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] text-sm text-[var(--color-ink)] bg-[var(--color-surface)] font-body focus:outline-none focus:border-[var(--color-primary)]" type="text" formControlName="apellidoMaterno" placeholder="Soto" />
              @if (mostrarError('apellidoMaterno')) {
                <span class="text-xs text-[var(--color-status-critical)]">Este campo es obligatorio.</span>
              }
            </label>

            <label class="flex flex-col gap-1.5">
              <span class="text-sm font-semibold text-[var(--color-ink)]">Fecha de nacimiento</span>
              <input class="px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] text-sm text-[var(--color-ink)] bg-[var(--color-surface)] font-body focus:outline-none focus:border-[var(--color-primary)]" type="date" formControlName="fechaNacimiento" />
              @if (mostrarError('fechaNacimiento')) {
                <span class="text-xs text-[var(--color-status-critical)]">Selecciona la fecha de nacimiento.</span>
              }
            </label>

            <label class="flex flex-col gap-1.5">
              <span class="text-sm font-semibold text-[var(--color-ink)]">Sexo</span>
              <select class="px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] text-sm text-[var(--color-ink)] bg-[var(--color-surface)] font-body focus:outline-none focus:border-[var(--color-primary)]" formControlName="sexo">
                <option value="" disabled>Selecciona una opción</option>
                @for (s of sexos; track s.valor) {
                  <option [value]="s.valor">{{ s.etiqueta }}</option>
                }
              </select>
              @if (mostrarError('sexo')) {
                <span class="text-xs text-[var(--color-status-critical)]">Selecciona el sexo.</span>
              }
            </label>
          </div>

          <div class="flex justify-end gap-3 mt-6">
            <button type="button" class="px-4.5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-ink-soft)] text-sm font-semibold cursor-pointer" (click)="form.reset({ sexo: '', idModalidad: 1, idEstadoPaciente: 1 })">
              Limpiar formulario
            </button>
            <button type="submit" [disabled]="estaCargando()" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border-none bg-[var(--color-primary)] text-white text-sm font-semibold cursor-pointer transition-colors hover:bg-[var(--color-primary-dark)] disabled:opacity-60 disabled:cursor-not-allowed">
              <ng-icon name="lucideUserRound" size="18" />
              Crear paciente
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

      <section class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-7 lg:h-[600px] overflow-y-auto">
        <h2 class="font-display text-base font-semibold m-0 mb-4 text-[var(--color-ink)]">Pacientes registrados</h2>

        @if (pacientes().length === 0) {
          <p class="text-sm text-[var(--color-ink-soft)]">Aún no se han registrado pacientes.</p>
        } @else {
          <ul class="flex flex-col gap-3 list-none m-0 p-0">
            @for (p of pacientes(); track p.idPaciente) {
              <li class="flex items-center gap-3 border border-[var(--color-border)] rounded-2xl p-4">
                <span class="flex items-center justify-center w-9 h-9 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary-dark)] shrink-0">
                  <ng-icon name="lucideHeartHandshake" size="16" />
                </span>
                <div class="flex flex-col gap-0.5 min-w-0">
                  <span class="font-semibold text-sm text-[var(--color-ink)] truncate">
                    {{ p.nombre }} {{ p.apellidoPaterno }} {{ p.apellidoMaterno }}
                  </span>
                  <span class="text-xs text-[var(--color-ink-soft)]">{{ edad(p) }} años · {{ genero(p) }}</span>
                </div>
              </li>
            }
          </ul>
        }

        <p class="mt-4 text-xs text-[var(--color-ink-soft)] leading-relaxed">
          Para asignar médicos o un familiar a estos pacientes, ve a la pestaña
          <strong>Médicos y familiares</strong>.
        </p>
      </section>
    </main>
  `,
})
export class CrearPaciente implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private store = inject(AdminStore);

  protected readonly sexos = SEXOS;

  mensajeExito = signal('');
  estaCargando = signal(false);
  pacientes = this.store.pacientes;

  form = this.fb.group({
    nombre: this.fb.control('', Validators.required),
    apellidoPaterno: this.fb.control('', Validators.required),
    apellidoMaterno: this.fb.control('', Validators.required),
    fechaNacimiento: this.fb.control('', Validators.required),
    sexo: this.fb.control<'M' | 'F' | ''>('', Validators.required),
    idModalidad: this.fb.control<number | null>(1),
    idEstadoPaciente: this.fb.control<number | null>(1),
  });

  ngOnInit() {
    this.store.cargarPacientes();
  }

  edad(p: PacienteDTO): number {
    return edadDesdeFechaNacimiento(p.fechaNacimiento);
  }

  genero(p: PacienteDTO): string {
    return generoDesdeSexo(p.sexo);
  }

  mostrarError(control: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[control];
    return c.touched && c.invalid;
  }

  async guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.value;
    this.estaCargando.set(true);
    try {
      await this.store.crearPaciente({
        nombre: v.nombre!,
        apellidoPaterno: v.apellidoPaterno!,
        apellidoMaterno: v.apellidoMaterno!,
        fechaNacimiento: v.fechaNacimiento!,
        sexo: v.sexo as 'M' | 'F',
        idModalidad: v.idModalidad!,
        idEstadoPaciente: v.idEstadoPaciente!,
      });
      this.mensajeExito.set('Se creó el paciente correctamente.');
      this.form.reset({ sexo: '', idModalidad: 1, idEstadoPaciente: 1 });
    } catch (error) {
      console.error('Error al crear paciente:', error);
    } finally {
      this.estaCargando.set(false);
    }
  }

  cerrarSesion() {
    this.router.navigateByUrl('/');
  }
}
