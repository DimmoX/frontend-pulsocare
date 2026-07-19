/** Nivel de riesgo de la escala NEWS2, tal como lo clasifica el backend. */
export type NivelRiesgoNews2 = 'BAJO' | 'MEDIO' | 'ALTO';

/** Puntaje de un signo individual dentro de la escala (0 a 3 puntos). */
export interface PuntajeSignoDTO {
  signoCodigo: string;
  valor: number;
  puntos: number;
}

/**
 * Escala de alerta temprana NEWS2 del paciente. Es una señal para que el equipo médico
 * revise, no un diagnóstico. El backend la calcula sobre los signos disponibles: si
 * falta alguno (por ejemplo, sin lecturas de temperatura), el total es un piso.
 */
export interface PuntajeNews2DTO {
  total: number;
  nivelRiesgo: NivelRiesgoNews2;
  banderaRoja: boolean;
  detalle: PuntajeSignoDTO[];
}

/** Parámetros que evalúa NEWS2 (la presión diastólica no forma parte de la escala). */
export const PARAMETROS_NEWS2 = 7;

/**
 * Puntaje máximo de la escala NEWS2, que evalúa 7 parámetros. Es un denominador fijo:
 * uno que cambiara según los signos disponibles en cada momento haría incomparables
 * dos lecturas del mismo paciente.
 */
export const MAXIMO_NEWS2 = 20;
