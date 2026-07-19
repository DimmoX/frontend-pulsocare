import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideBedSingle, lucideHistory, lucideSlidersHorizontal } from '@ng-icons/lucide';
import { AdminStore } from '../../admin/admin-store';
import { AuthStore } from '../../../core/services/auth.store';
import { estaDadoDeAlta, PacienteDTO } from '../../../core/models/paciente.dto';
import { Topbar } from '../../../shared/topbar/topbar';
import { VitalsBoard } from '../../../shared/vitals-board/vitals-board';
import { News2Panel } from '../../../shared/news2-panel/news2-panel';

@Component({
  selector: 'app-paciente-detalle',
  imports: [Topbar, VitalsBoard, NgIcon, News2Panel],
  viewProviders: [provideIcons({ lucideHistory, lucideBedSingle, lucideSlidersHorizontal })],
  template: `
    @if (paciente(); as p) {
      <app-topbar
        titulo="Signos vitales"
        [subtitulo]="p.nombre + ' ' + p.apellidoPaterno + ' ' + p.apellidoMaterno"
        [usuario]="nombreUsuario()"
        rol="Médico"
        volverA="/medico/pacientes"
        (cerrarSesion)="cerrarSesion()"
      />

      <main class="max-w-6xl mx-auto p-7 flex flex-col gap-5">
        @if (estaDeAlta(p)) {
          <div class="flex items-center gap-2.5 p-4 px-5 rounded-2xl bg-[var(--color-surface-sunken)] border border-[var(--color-border)] text-sm text-[var(--color-ink-soft)]">
            <ng-icon name="lucideBedSingle" size="18" />
            <span>
              <strong class="text-[var(--color-ink)]">Sin monitoreo activo.</strong>
              Este paciente fue dado de alta; las lecturas de abajo son las últimas
              registradas y no se están actualizando.
            </span>
          </div>
        }

        <!-- El acceso al historico y la escala NEWS2 se proyectan dentro del tablero
             de signos vitales para que queden junto a los datos que explican. Van aqui
             y no dentro de vitals-board porque ese componente lo comparte la vista del
             familiar, que no accede al historico ni al puntaje de riesgo. -->
        <app-vitals-board [paciente]="p">
          <app-news2-panel escala [idPaciente]="p.idPaciente" />
          <button
            acciones
            type="button"
            (click)="verHistorico(p.idPaciente)"
            class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--color-surface-sunken)] border border-[var(--color-border)] text-[var(--color-primary)] font-semibold text-xs cursor-pointer transition-colors hover:border-[var(--color-primary)]/40 whitespace-nowrap"
          >
            <ng-icon name="lucideHistory" size="14" />
            Ver histórico de lecturas
          </button>
          <button
            acciones
            type="button"
            (click)="configurarUmbrales(p.idPaciente)"
            class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--color-surface-sunken)] border border-[var(--color-border)] text-[var(--color-primary)] font-semibold text-xs cursor-pointer transition-colors hover:border-[var(--color-primary)]/40 whitespace-nowrap"
          >
            <ng-icon name="lucideSlidersHorizontal" size="14" />
            Límites de alarma
          </button>
        </app-vitals-board>
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

  estaDeAlta(p: PacienteDTO): boolean {
    return estaDadoDeAlta(p);
  }

  verHistorico(idPaciente: number) {
    this.router.navigateByUrl(`/medico/pacientes/${idPaciente}/historico`);
  }

  configurarUmbrales(idPaciente: number) {
    this.router.navigateByUrl(`/medico/pacientes/${idPaciente}/umbrales`);
  }

  cerrarSesion() {
    this.router.navigateByUrl('/');
  }
}
