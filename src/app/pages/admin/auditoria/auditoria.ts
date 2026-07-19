import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideRefreshCw, lucideScrollText } from '@ng-icons/lucide';
import { Topbar } from '../../../shared/topbar/topbar';
import { AdminTabs } from '../admin-tabs/admin-tabs';
import { AdminStore } from '../admin-store';
import { EventoBitacoraDTO } from '../../../core/models/bitacora.dto';
import { definicionSigno, SIGNOS_MONITOREADOS } from '../../../core/models/consultas.dto';

/** Etiqueta legible para cada acción registrada; si aparece una nueva, se muestra tal cual. */
const ACCION_TEXTO: Record<string, string> = {
  VER_HISTORICO: 'Histórico de signos vitales',
  VER_PACIENTE: 'Vio el paciente',
  CREAR_UMBRAL: 'Definió un límite de alarma',
  EDITAR_UMBRAL: 'Editó un límite de alarma',
  ELIMINAR_UMBRAL: 'Restauró un límite por defecto',
  LOGIN: 'Inició sesión',
};

/** id de PC_SIGNO_VITAL -> nombre legible, para traducir el detalle de la bitácora. */
const NOMBRE_POR_ID = new Map(
  SIGNOS_MONITOREADOS.map(({ id, codigo }) => [id, definicionSigno(codigo).etiqueta])
);

@Component({
  selector: 'app-auditoria',
  imports: [Topbar, AdminTabs, NgIcon],
  viewProviders: [provideIcons({ lucideScrollText, lucideRefreshCw })],
  template: `
    <app-topbar
      titulo="Historial de accesos"
      subtitulo="Registro de quién consultó la información clínica de cada paciente"
      usuario="Equipo de soporte"
      rol="Administrador"
      (cerrarSesion)="cerrarSesion()"
    />
    <app-admin-tabs />

    <main class="max-w-6xl mx-auto p-7">
      <section class="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-7">
        <div class="flex items-center justify-between flex-wrap gap-3 mb-5">
          <div class="flex items-center gap-2.5">
            <span class="flex items-center justify-center w-9 h-9 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary-dark)] shrink-0">
              <ng-icon name="lucideScrollText" size="16" />
            </span>
            <div>
              <h2 class="font-display text-base font-semibold m-0 text-[var(--color-ink)]">Últimos accesos</h2>
              <p class="m-0 text-xs text-[var(--color-ink-soft)]">
                @if (!cargando() && !error()) {
                  {{ eventos().length }} evento{{ eventos().length === 1 ? '' : 's' }} registrado{{ eventos().length === 1 ? '' : 's' }}
                }
              </p>
            </div>
          </div>
          <button
            type="button"
            (click)="recargar()"
            [disabled]="cargando()"
            class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--color-surface-sunken)] border border-[var(--color-border)] text-[var(--color-ink-soft)] font-semibold text-xs cursor-pointer transition-colors hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]/40 disabled:opacity-40"
          >
            <ng-icon name="lucideRefreshCw" size="14" />
            Actualizar
          </button>
        </div>

        @if (cargando()) {
          <p class="text-sm text-[var(--color-ink-soft)]">Cargando registro…</p>
        } @else if (error()) {
          <p class="text-sm text-[var(--color-status-critical)]">{{ error() }}</p>
        } @else if (eventos().length === 0) {
          <p class="text-sm text-[var(--color-ink-soft)]">Aún no hay accesos registrados.</p>
        } @else {
          <div class="overflow-x-auto rounded-2xl border border-[var(--color-border)]">
            <table class="w-full border-collapse text-sm">
              <thead>
                <tr class="border-b border-[var(--color-border)] bg-[var(--color-surface-sunken)]">
                  <th class="text-left font-display text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)] px-5 py-3">Fecha y hora</th>
                  <th class="text-left font-display text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)] px-5 py-3">Usuario</th>
                  <th class="text-left font-display text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)] px-5 py-3">Acción</th>
                  <th class="text-left font-display text-xs font-bold uppercase tracking-wider text-[var(--color-ink-soft)] px-5 py-3">Paciente</th>
                </tr>
              </thead>
              <tbody>
                @for (e of eventos(); track e.idBitacora) {
                  <tr class="border-b border-[var(--color-border)] last:border-b-0">
                    <td class="px-5 py-3 font-mono text-xs text-[var(--color-ink-soft)] whitespace-nowrap">{{ fecha(e.fechaEvento) }}</td>
                    <td class="px-5 py-3">
                      <span class="text-[var(--color-ink)]">{{ e.usuario }}</span>
                      <span class="text-xs text-[var(--color-ink-soft)]"> · {{ e.rol }}</span>
                    </td>
                    <td class="px-5 py-3 text-[var(--color-ink)]">
                      <div>{{ accionTexto(e.accion) }}</div>
                      @if (detalleLegible(e.detalle); as d) {
                        <div class="mt-0.5 text-xs text-[var(--color-ink-soft)]">{{ d }}</div>
                      }
                    </td>
                    <td class="px-5 py-3 text-[var(--color-ink)]">{{ e.paciente ?? '—' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </section>
    </main>
  `,
})
export class Auditoria implements OnInit {
  private router = inject(Router);
  private store = inject(AdminStore);

  cargando = signal(true);
  error = signal<string | null>(null);
  eventos = signal<EventoBitacoraDTO[]>([]);

  ngOnInit() {
    void this.recargar();
  }

  async recargar() {
    this.cargando.set(true);
    this.error.set(null);
    try {
      this.eventos.set(await this.store.cargarBitacora());
    } catch {
      this.error.set('No se pudo cargar el registro de accesos. Intenta nuevamente.');
      this.eventos.set([]);
    } finally {
      this.cargando.set(false);
    }
  }

  accionTexto(accion: string): string {
    return ACCION_TEXTO[accion] ?? accion;
  }

  /**
   * El detalle que guarda el backend identifica el signo por su id ("Signo 1: ..."),
   * que no le dice nada a quien audita. Aquí se traduce al nombre; si aparece un id
   * desconocido se deja tal cual, porque en una bitácora es preferible mostrar el
   * registro crudo antes que ocultarlo.
   */
  detalleLegible(detalle: string | null): string {
    if (!detalle) return '';
    return detalle.replace(
      /Signo (\d+)/g,
      (original, id) => NOMBRE_POR_ID.get(Number(id)) ?? original
    );
  }

  /** La base guarda en UTC ("...Z"); se muestra en la hora local del administrador. */
  fecha(iso: string): string {
    const d = new Date(`${iso}Z`);
    const p = (n: number) => String(n).padStart(2, '0');
    return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ` +
           `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  }

  cerrarSesion() {
    this.router.navigateByUrl('/');
  }
}
