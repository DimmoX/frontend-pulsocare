import { Component, inject, signal, OnInit } from '@angular/core';
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
import { Topbar } from '../../../shared/topbar/topbar';
import { AdminStore } from '../admin-store';
import { AdminTabs } from '../admin-tabs/admin-tabs';
import { PARENTESCOS, claveDesdeNombreRol } from '../../../core/auth/roles.config';
import { UsuarioDTO } from '../../../core/models/usuario.dto';
import { PacienteDTO } from '../../../core/models/paciente.dto';

type TipoUsuarioFormulario = 'medico' | 'familiar';

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

    <main class="max-w-6xl mx-auto p-7 grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6 items-start">
      <section class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-7 lg:sticky lg:top-7 lg:h-[600px]">
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

            <label class="flex flex-col gap-1.5 sm:col-span-2">
              <span class="text-sm font-semibold text-[var(--color-ink)]">Correo electrónico</span>
              <input class="px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] text-sm text-[var(--color-ink)] bg-[var(--color-surface)] font-body focus:outline-none focus:border-[var(--color-primary)]" type="email" formControlName="correo" placeholder="usuario@pulsocare.cl" />
              @if (mostrarError('correo')) {
                <span class="text-xs text-[var(--color-status-critical)]">Ingresa un correo válido.</span>
              }
            </label>

            @if (tipo() === 'familiar') {
              <label class="flex flex-col gap-1.5 sm:col-span-2">
                <span class="text-sm font-semibold text-[var(--color-ink)]">Parentesco con el paciente</span>
                <select class="px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] text-sm text-[var(--color-ink)] bg-[var(--color-surface)] font-body focus:outline-none focus:border-[var(--color-primary)]" formControlName="idParentesco">
                  <option [ngValue]="null" disabled>Selecciona una opción</option>
                  @for (p of parentescos; track p.id) {
                    <option [ngValue]="p.id">{{ p.nombre }}</option>
                  }
                </select>
                @if (mostrarError('idParentesco')) {
                  <span class="text-xs text-[var(--color-status-critical)]">Selecciona el parentesco.</span>
                }
              </label>
            }
          </div>

          <div class="flex justify-end gap-3 mt-6">
            <button type="button" class="px-4.5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-ink-soft)] text-sm font-semibold cursor-pointer" (click)="form.reset({ idParentesco: null })">
              Limpiar formulario
            </button>
            <button type="submit" [disabled]="estaCargando()" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border-none bg-[var(--color-primary)] text-white text-sm font-semibold cursor-pointer transition-colors hover:bg-[var(--color-primary-dark)] disabled:opacity-60 disabled:cursor-not-allowed">
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

      <section class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-7 lg:h-[600px] overflow-y-auto">
        <h2 class="font-display text-base font-semibold m-0 mb-4 text-[var(--color-ink)]">Médicos y familiares registrados</h2>

        @if (errorAsignacion()) {
          <p class="mb-3 text-xs font-semibold text-[var(--color-status-critical)]">{{ errorAsignacion() }}</p>
        }

        @if (usuarios().length === 0) {
          <p class="text-sm text-[var(--color-ink-soft)]">Aún no se han creado usuarios.</p>
        } @else {
          <ul class="flex flex-col gap-3 list-none m-0 p-0">
            @for (u of usuarios(); track u.idUsuario) {
              <li class="border border-[var(--color-border)] rounded-2xl p-4">
                <div class="flex items-center gap-3">
                  <span
                    class="flex items-center justify-center w-9 h-9 rounded-xl shrink-0"
                    [class]="esMedico(u)
                      ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary-dark)]'
                      : 'bg-[var(--color-pulse-soft)] text-[var(--color-pulse)]'"
                  >
                    <ng-icon [name]="esMedico(u) ? 'lucideStethoscope' : 'lucideUsersRound'" size="16" />
                  </span>
                  <div class="flex flex-col gap-0.5 min-w-0 flex-1">
                    <span class="font-semibold text-sm text-[var(--color-ink)] truncate">{{ u.nombre }} {{ u.apellidoPaterno }}</span>
                    <span class="text-xs text-[var(--color-ink-soft)] truncate">{{ u.correo }} · {{ u.rol }}</span>
                  </div>

                  @if (estaInactivo(u)) {
                    <span class="shrink-0 font-display text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-full bg-[var(--color-surface-sunken)] text-[var(--color-ink-soft)]">
                      Inactivo
                    </span>
                  }

                  <button
                    type="button"
                    (click)="alternarEstado(u)"
                    [disabled]="cambiando() === u.idUsuario"
                    [class]="estaInactivo(u)
                      ? 'shrink-0 text-xs font-semibold cursor-pointer bg-transparent border-none px-1 text-[var(--color-primary)] disabled:opacity-40'
                      : 'shrink-0 text-xs font-semibold cursor-pointer bg-transparent border-none px-1 text-[var(--color-status-critical)] disabled:opacity-40'"
                  >
                    {{ estaInactivo(u) ? 'Habilitar' : 'Desactivar' }}
                  </button>
                </div>

                <!-- Solo el equipo de cuidado tiene pacientes a cargo. Un paciente o un
                     administrador no cuidan a nadie: mismo criterio que esRolCuidador()
                     en el backend, que decide quien recibe las alertas. -->
                @if (esCuidador(u)) {
                <div class="mt-3 pt-3 border-t border-[var(--color-border)]">
                  <p class="m-0 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-ink-soft)] uppercase tracking-wide">
                    <ng-icon name="lucideLink" size="13" />
                    Pacientes a cargo
                  </p>

                  @if (pacientesAsignados(u.idUsuario).length === 0) {
                    <p class="mt-1 text-xs text-[var(--color-ink-soft)]">Sin pacientes asignados.</p>
                  } @else {
                    <ul class="mt-2 flex flex-col gap-1.5 list-none m-0 p-0">
                      @for (p of pacientesAsignados(u.idUsuario); track p.idPaciente) {
                        <li class="flex items-center justify-between gap-2 text-xs">
                          <span class="text-[var(--color-ink)]">{{ p.nombre }} {{ p.apellidoPaterno }}</span>
                          <button
                            type="button"
                            class="text-[var(--color-status-critical)] font-semibold cursor-pointer bg-transparent border-none px-1"
                            (click)="quitar(u.idUsuario, p.idPaciente)"
                          >
                            Quitar
                          </button>
                        </li>
                      }
                    </ul>
                  }

                  <!-- A un usuario inactivo no se le asignan pacientes nuevos (no puede
                       entrar ni recibir alertas), pero su lista de arriba SI se muestra
                       con el boton Quitar: el admin necesita reasignar a esos pacientes
                       a otro cuidador. -->
                  @if (estaInactivo(u)) {
                    @if (pacientesAsignados(u.idUsuario).length > 0) {
                      <p class="mt-2 text-xs text-[var(--color-ink-soft)]">
                        Usuario inactivo: no recibe pacientes nuevos. Reasigna los de arriba a otro cuidador.
                      </p>
                    }
                  } @else if (pacientesDisponibles(u.idUsuario).length > 0) {
                    <div class="mt-2.5 flex gap-2">
                      <select #selNuevoPaciente class="flex-1 px-2.5 py-1.5 rounded-lg border border-[var(--color-border)] text-xs bg-[var(--color-surface)] text-[var(--color-ink)]">
                        @for (p of pacientesDisponibles(u.idUsuario); track p.idPaciente) {
                          <option [value]="p.idPaciente">{{ p.nombre }} {{ p.apellidoPaterno }}</option>
                        }
                      </select>
                      <button
                        type="button"
                        class="px-3 py-1.5 rounded-lg border-none bg-[var(--color-primary)] text-white text-xs font-semibold cursor-pointer"
                        (click)="asignar(u.idUsuario, selNuevoPaciente.value)"
                      >
                        Asignar
                      </button>
                    </div>
                  } @else if (pacientes().length === 0) {
                    <p class="mt-2 text-xs text-[var(--color-ink-soft)]">Aún no hay pacientes registrados para asignar.</p>
                  }
                </div>
                }
              </li>
            }
          </ul>
        }
      </section>
    </main>
  `,
})
export class CrearUsuario implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private store = inject(AdminStore);

  protected readonly parentescos = PARENTESCOS;

  tipo = signal<TipoUsuarioFormulario>('medico');
  mensajeExito = signal('');
  estaCargando = signal(false);
  passwordTemporal = signal('');

  /** Id del usuario cuyo estado se esta cambiando: evita doble clic mientras responde. */
  cambiando = signal<number | null>(null);
  errorAsignacion = signal<string | null>(null);

  usuarios = this.store.usuarios;
  pacientes = this.store.pacientes;

  form = this.fb.group({
    nombre: this.fb.control('', Validators.required),
    apellidoPaterno: this.fb.control('', Validators.required),
    correo: this.fb.control('', [Validators.required, Validators.email]),
    idParentesco: this.fb.control<number | null>(null),
  });

  ngOnInit() {
    this.store.cargarUsuarios();
    this.store.cargarPacientes();
  }

  esMedico(u: UsuarioDTO): boolean {
    return claveDesdeNombreRol(u.rol) === 'MEDICO';
  }

  /**
   * Roles que forman el equipo de cuidado: medico, enfermero y familiar. Un paciente o
   * un administrador no tienen pacientes a cargo. Espeja esRolCuidador() de ms-auth,
   * que usa el mismo criterio para decidir a quien se le envian las alertas.
   */
  esCuidador(u: UsuarioDTO): boolean {
    const clave = claveDesdeNombreRol(u.rol);
    return clave === 'MEDICO' || clave === 'FAMILIAR';
  }

  estaInactivo(u: UsuarioDTO): boolean {
    return u.estado === 'INACTIVO';
  }

  /**
   * Da de baja o habilita. Se confirma antes porque tiene consecuencias inmediatas:
   * el usuario deja de poder entrar y de recibir alertas de sus pacientes.
   */
  async alternarEstado(u: UsuarioDTO) {
    const desactivar = !this.estaInactivo(u);
    const quien = `${u.nombre} ${u.apellidoPaterno} (${u.correo})`;
    const aviso = desactivar
      ? `¿Desactivar a ${quien}?\n\nNo podrá iniciar sesión ni recibirá alertas de sus pacientes. ` +
        `Sus datos y su historial se conservan, y puedes rehabilitarlo cuando quieras.`
      : `¿Habilitar a ${quien}?\n\nVolverá a poder iniciar sesión y a recibir alertas.`;
    if (!confirm(aviso)) return;

    this.cambiando.set(u.idUsuario);
    try {
      await this.store.cambiarEstadoUsuario(u.idUsuario, desactivar ? 'INACTIVO' : 'ACTIVO');
    } catch {
      alert('No se pudo cambiar el estado del usuario. Intenta nuevamente.');
    } finally {
      this.cambiando.set(null);
    }
  }

  pacientesAsignados(idUsuario: number): PacienteDTO[] {
    return this.store.pacientesPorUsuario()[idUsuario] ?? [];
  }

  pacientesDisponibles(idUsuario: number): PacienteDTO[] {
    const asignadosIds = new Set(this.pacientesAsignados(idUsuario).map((p) => p.idPaciente));
    return this.pacientes().filter((p) => !asignadosIds.has(p.idPaciente));
  }

  async asignar(idUsuario: number, idPacienteTexto: string) {
    const idPaciente = Number(idPacienteTexto);
    if (!idPaciente) return;

    this.errorAsignacion.set(null);
    try {
      await this.store.asignarPaciente(idPaciente, idUsuario);
    } catch (error) {
      this.errorAsignacion.set(this.mensajeDeError(error));
    }
  }

  async quitar(idUsuario: number, idPaciente: number) {
    this.errorAsignacion.set(null);
    try {
      await this.store.quitarAsignacion(idPaciente, idUsuario);
    } catch (error) {
      this.errorAsignacion.set(this.mensajeDeError(error));
    }
  }

  private mensajeDeError(error: unknown): string {
    const status = (error as { status?: number })?.status;
    if (status === 409) return 'Ese paciente ya estaba asignado a este usuario.';
    if (status === 404) return 'No se encontró el paciente o la asignación indicada.';
    return 'No se pudo completar la operación. Intenta nuevamente.';
  }

  seleccionarTipo(tipo: TipoUsuarioFormulario) {
    this.tipo.set(tipo);
    const idParentesco = this.form.controls.idParentesco;
    if (tipo === 'familiar') {
      idParentesco.setValidators(Validators.required);
    } else {
      idParentesco.clearValidators();
      idParentesco.setValue(null);
    }
    idParentesco.updateValueAndValidity();
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
      const { passwordTemporal } = await this.store.crearUsuario({
        nombreCompleto: `${v.nombre} ${v.apellidoPaterno}`,
        correo: v.correo!,
        tipo: this.tipo() === 'medico' ? 'MEDICO' : 'FAMILIAR',
        idParentesco: this.tipo() === 'familiar' ? v.idParentesco ?? undefined : undefined,
      });

      this.passwordTemporal.set(passwordTemporal);

      this.mensajeExito.set(
        `Se creó el usuario de ${this.tipo() === 'medico' ? 'médico' : 'familiar'} correctamente. Su contraseña temporal es: ${passwordTemporal}`
      );
      this.form.reset({ idParentesco: null });
    } catch (error) {
      console.error('Error al crear el usuario:', error);
    } finally {
      this.estaCargando.set(false);
    }
  }

  cerrarSesion() {
    this.router.navigateByUrl('/');
  }
}
