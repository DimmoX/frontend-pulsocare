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
  FC: { etiqueta: 'Frecuencia cardíaca', icono: 'lucideHeartPulse', rangoDefault: { min: 60, max: 100 }, margenDefault: 8 },
  SPO2: { etiqueta: 'Saturación de oxígeno', icono: 'lucideDroplets', rangoDefault: { min: 92, max: 100 }, margenDefault: 2 },
  PAS: { etiqueta: 'Presión sistólica', icono: 'lucideActivity', rangoDefault: { min: 90, max: 140 }, margenDefault: 10 },
  PAD: { etiqueta: 'Presión diastólica', icono: 'lucideActivity', rangoDefault: { min: 60, max: 90 }, margenDefault: 6 },
  TEMP: { etiqueta: 'Temperatura', icono: 'lucideThermometer', rangoDefault: { min: 35.5, max: 37.5 }, margenDefault: 0.4 },
  FR: { etiqueta: 'Frecuencia respiratoria', icono: 'lucideWind', rangoDefault: { min: 12, max: 20 }, margenDefault: 2 },
  GCS: {
    etiqueta: 'Nivel de conciencia',
    icono: 'lucideBrain',
    rangoDefault: { min: 15, max: 15 },
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

export function definicionSigno(signoCodigo: string): DefinicionSigno {
  return (
    CATALOGO_SIGNOS[signoCodigo] ?? {
      etiqueta: signoCodigo,
      icono: 'lucideActivity',
      rangoDefault: { min: 0, max: 0 },
      margenDefault: 0,
    }
  );
}
