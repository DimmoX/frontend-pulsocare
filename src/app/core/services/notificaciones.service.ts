import { Injectable, signal } from '@angular/core';

export type TipoNotificacion = 'exito' | 'error' | 'info';

export interface Notificacion {
  id: number;
  tipo: TipoNotificacion;
  mensaje: string;
}

/** Cuánto queda un aviso en pantalla antes de retirarse solo. */
const DURACION_MS = 5000;

/**
 * Avisos breves en una esquina de la pantalla.
 *
 * Existe porque los errores de validación se mostraban dentro de la fila que los
 * originaba, y cuando la tabla es larga el usuario no llegaba a verlos: guardaba, no
 * pasaba nada aparente y no sabía por qué.
 */
@Injectable({ providedIn: 'root' })
export class NotificacionesService {
  private siguienteId = 0;

  readonly notificaciones = signal<Notificacion[]>([]);

  exito(mensaje: string) {
    this.mostrar('exito', mensaje);
  }

  error(mensaje: string) {
    this.mostrar('error', mensaje);
  }

  info(mensaje: string) {
    this.mostrar('info', mensaje);
  }

  cerrar(id: number) {
    this.notificaciones.update((lista) => lista.filter((n) => n.id !== id));
  }

  private mostrar(tipo: TipoNotificacion, mensaje: string) {
    const id = this.siguienteId++;
    this.notificaciones.update((lista) => [...lista, { id, tipo, mensaje }]);
    setTimeout(() => this.cerrar(id), DURACION_MS);
  }
}
