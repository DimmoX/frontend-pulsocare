import { Component, inject } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCircleCheck, lucideInfo, lucideTriangleAlert, lucideX } from '@ng-icons/lucide';
import { NotificacionesService, TipoNotificacion } from '../../core/services/notificaciones.service';

const ESTILO: Record<TipoNotificacion, { icono: string; clases: string }> = {
  exito: {
    icono: 'lucideCircleCheck',
    clases: 'bg-[var(--color-status-ok-soft)] border-[var(--color-status-ok)]/40 text-[var(--color-status-ok)]',
  },
  error: {
    icono: 'lucideTriangleAlert',
    clases: 'bg-[var(--color-status-critical-soft)] border-[var(--color-status-critical)]/40 text-[var(--color-status-critical)]',
  },
  info: {
    icono: 'lucideInfo',
    clases: 'bg-[var(--color-surface-sunken)] border-[var(--color-border)] text-[var(--color-ink-soft)]',
  },
};

/**
 * Avisos flotantes arriba a la derecha. Se monta una sola vez en la raíz de la app.
 *
 * El contenedor no captura clics (pointer-events-none) para no tapar la interfaz que
 * hay debajo; solo cada tarjeta los recibe, de modo que se puedan cerrar a mano.
 */
@Component({
  selector: 'app-notificaciones',
  imports: [NgIcon],
  viewProviders: [provideIcons({ lucideCircleCheck, lucideTriangleAlert, lucideInfo, lucideX })],
  template: `
    <div class="fixed top-5 right-5 z-50 flex flex-col gap-2.5 pointer-events-none max-w-sm">
      @for (n of servicio.notificaciones(); track n.id) {
        <div
          role="alert"
          class="pointer-events-auto flex items-start gap-2.5 p-3.5 px-4 rounded-xl border shadow-lg text-sm animacion-entrada"
          [class]="estilo(n.tipo).clases"
        >
          <ng-icon [name]="estilo(n.tipo).icono" size="17" class="mt-0.5 shrink-0" />
          <span class="flex-1">{{ n.mensaje }}</span>
          <button
            type="button"
            (click)="servicio.cerrar(n.id)"
            aria-label="Cerrar aviso"
            class="shrink-0 opacity-60 hover:opacity-100 cursor-pointer bg-transparent border-none p-0 text-inherit"
          >
            <ng-icon name="lucideX" size="15" />
          </button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .animacion-entrada {
        animation: entrar 0.18s ease-out;
      }
      @keyframes entrar {
        from {
          opacity: 0;
          transform: translateX(1rem);
        }
      }
      /* Quien pidió menos movimiento no debería recibir un elemento que se desliza. */
      @media (prefers-reduced-motion: reduce) {
        .animacion-entrada {
          animation: none;
        }
      }
    `,
  ],
})
export class Notificaciones {
  protected servicio = inject(NotificacionesService);

  estilo(tipo: TipoNotificacion) {
    return ESTILO[tipo];
  }
}
