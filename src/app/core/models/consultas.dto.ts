import { UmbralDTO } from './umbral.dto';
export type EstadoSigno = 'ok' | 'alerta' | 'critico';

export interface LecturaDTO {
  idLectura: number;
  idPaciente: number;
  idSignoVital: number;
  signoCodigo: string; // 'FC' | 'SPO2' | 'PAS' | 'PAD' | 'TEMP' | 'FR'
  signoNombre: string;
  valorNum: number;
  unidad: string;
  fechaMedicion: string;
  fechaRegistro: string;
  origen: string;
}

export interface AlertaDTO {
  idAlerta: number;
  idLectura: number;
  idPaciente: number;
  idSignoVital: number;
  signoCodigo: string;
  idNivelAlerta: number;
  nivelCodigo: string; // 'AMARILLO' | 'ROJO'
  idEstadoAlerta: number;
  estadoCodigo: string; // 'GENERADA' | 'NOTIFICADA' | 'RECONOCIDA' | 'RESUELTA'
  valorRegistrado: number;
  umbralViolado: string;
  fechaGeneracion: string;
  idReconocidaPor: number | null;
  fechaReconocimiento: string | null;
}

interface DefinicionSigno {
  etiqueta: string;
  icono: string;
  rangoDefault: { min: number; max: number };
  /**
   * Límites críticos por defecto. Son los que aplica la Lambda al clasificar, así que
   * deben coincidir con su tabla SIGNOS: si aquí dijeran otra cosa, la pantalla
   * mostraría un rango y el sistema alarmaría con otro.
   */
  criticoDefault: { min: number; max: number };
  margenDefault: number;
  /**
   * Los tres campos siguientes son para los signos CATEGORICOS (conciencia, oxigeno):
   * no son magnitudes continuas, asi que la heuristica de rangos les asigna estados
   * equivocados y mostrarlos como numero crudo no dice nada. Un signo continuo no los
   * define y se comporta como siempre.
   */
  formatoValor?: (v: number) => { valor: string; unidad: string };
  textoRango?: string;
  estadoDe?: (v: number) => EstadoSigno;
}

const CATALOGO_SIGNOS: Record<string, DefinicionSigno> = {
  FC: {
    etiqueta: 'Frecuencia cardíaca', icono: 'lucideHeartPulse',
    rangoDefault: { min: 60, max: 100 }, criticoDefault: { min: 40, max: 130 }, margenDefault: 8,
  },
  SPO2: {
    etiqueta: 'Saturación de oxígeno', icono: 'lucideDroplets',
    rangoDefault: { min: 95, max: 100 }, criticoDefault: { min: 90, max: 100 }, margenDefault: 2,
  },
  PAS: {
    etiqueta: 'Presión sistólica', icono: 'lucideActivity',
    rangoDefault: { min: 90, max: 120 }, criticoDefault: { min: 70, max: 180 }, margenDefault: 10,
  },
  PAD: {
    etiqueta: 'Presión diastólica', icono: 'lucideActivity',
    rangoDefault: { min: 60, max: 80 }, criticoDefault: { min: 40, max: 110 }, margenDefault: 6,
  },
  TEMP: {
    etiqueta: 'Temperatura', icono: 'lucideThermometer',
    rangoDefault: { min: 36.0, max: 37.5 }, criticoDefault: { min: 35.0, max: 39.0 }, margenDefault: 0.4,
  },
  FR: {
    etiqueta: 'Frecuencia respiratoria', icono: 'lucideWind',
    rangoDefault: { min: 12, max: 20 }, criticoDefault: { min: 8, max: 30 }, margenDefault: 2,
  },
  GCS: {
    etiqueta: 'Nivel de conciencia',
    icono: 'lucideBrain',
    rangoDefault: { min: 15, max: 15 },
    criticoDefault: { min: 13, max: 15 },
    margenDefault: 0,
    // Glasgow 3 a 15. NEWS2 solo distingue "alerta" (15) de "no alerta", pero en la
    // tarjeta si vale graduar: el medico necesita ver si es una somnolencia leve o
    // un paciente que no responde.
    formatoValor: (v) => ({ valor: String(v), unidad: '/ 15' }),
    textoRango: 'Rango normal: 15 de 15 (alerta)',
    estadoDe: (v) => (v >= 15 ? 'ok' : v >= 13 ? 'alerta' : 'critico'),
  },
  O2SUP: {
    etiqueta: 'Oxígeno suplementario',
    icono: 'lucideWind',
    rangoDefault: { min: 0, max: 0 },
    criticoDefault: { min: 0, max: 1 },
    margenDefault: 0,
    formatoValor: (v) => ({ valor: v > 0 ? 'Sí' : 'No', unidad: '' }),
    // "Rango normal:" no es decorativo aqui: sin ese prefijo, la linea se lee como
    // una descripcion del paciente y contradice el valor de arriba.
    textoRango: 'Rango normal: sin oxígeno',
    // Necesitar oxigeno no es una urgencia por si solo, pero nunca es "normal":
    // por eso atencion y no critico.
    estadoDe: (v) => (v > 0 ? 'alerta' : 'ok'),
  },
};

/**
 * Signos monitoreados, con el id que tienen en PC_SIGNO_VITAL. Vive aqui y no en cada
 * vista porque el filtro del historico y la configuracion de umbrales necesitan el
 * mismo mapeo, y tenerlo duplicado ya dejo fuera a GCS y O2SUP de uno de los dos.
 */
export const SIGNOS_MONITOREADOS: { id: number; codigo: string }[] = [
  { id: 1, codigo: 'FC' },
  { id: 2, codigo: 'SPO2' },
  { id: 3, codigo: 'PAS' },
  { id: 4, codigo: 'PAD' },
  { id: 5, codigo: 'TEMP' },
  { id: 6, codigo: 'FR' },
  { id: 21, codigo: 'GCS' },
  { id: 22, codigo: 'O2SUP' },
];

export function definicionSigno(signoCodigo: string): DefinicionSigno {
  return (
    CATALOGO_SIGNOS[signoCodigo] ?? {
      etiqueta: signoCodigo,
      icono: 'lucideActivity',
      rangoDefault: { min: 0, max: 0 },
      criticoDefault: { min: 0, max: 0 },
      margenDefault: 0,
    }
  );
}

/**
 * Combina el umbral del paciente con los valores por defecto del signo.
 *
 * Cada limite se resuelve por separado, igual que hace la Lambda: un umbral al que le
 * falte alguno no debe dejar ese limite en null, porque en JavaScript `96 > null` es
 * true y la lectura se marcaba como critica sin motivo.
 */
export function limitesEfectivos(signoCodigo: string, umbral: UmbralDTO | null) {
  const d = definicionSigno(signoCodigo);
  return {
    min: umbral?.valorMin ?? d.rangoDefault.min,
    max: umbral?.valorMax ?? d.rangoDefault.max,
    minCritico: umbral?.valorMinCritico ?? d.criticoDefault.min,
    maxCritico: umbral?.valorMaxCritico ?? d.criticoDefault.max,
  };
}
