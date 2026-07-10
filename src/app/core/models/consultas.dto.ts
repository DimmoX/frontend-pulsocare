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
}

const CATALOGO_SIGNOS: Record<string, DefinicionSigno> = {
  FC: { etiqueta: 'Frecuencia cardíaca', icono: 'lucideHeartPulse', rangoDefault: { min: 60, max: 100 }, margenDefault: 8 },
  SPO2: { etiqueta: 'Saturación de oxígeno', icono: 'lucideDroplets', rangoDefault: { min: 92, max: 100 }, margenDefault: 2 },
  PAS: { etiqueta: 'Presión sistólica', icono: 'lucideActivity', rangoDefault: { min: 90, max: 140 }, margenDefault: 10 },
  PAD: { etiqueta: 'Presión diastólica', icono: 'lucideActivity', rangoDefault: { min: 60, max: 90 }, margenDefault: 6 },
  TEMP: { etiqueta: 'Temperatura', icono: 'lucideThermometer', rangoDefault: { min: 35.5, max: 37.5 }, margenDefault: 0.4 },
  FR: { etiqueta: 'Frecuencia respiratoria', icono: 'lucideWind', rangoDefault: { min: 12, max: 20 }, margenDefault: 2 },
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
