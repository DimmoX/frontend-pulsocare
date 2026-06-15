export type EstadoSigno = 'ok' | 'alerta' | 'critico';

export interface SignoVital {
  clave: string;
  etiqueta: string;
  valor: number;
  unidad: string;
  icono: string;
  rango: { min: number; max: number };
  margen: number; // distancia al límite que se considera "alerta"
}

export interface Paciente {
  id: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  edad: number;
  habitacion: string;
  diagnostico: string;
  familiar: string;
  ultimaActualizacion: string;
  signos: SignoVital[];
}

/**
 * Determina el estado clínico de un signo vital según sus rangos normales
 * y un margen de cercanía al límite.
 */
export function estadoSigno(signo: SignoVital): EstadoSigno {
  const { valor, rango, margen } = signo;
  if (valor < rango.min || valor > rango.max) return 'critico';
  if (valor <= rango.min + margen || valor >= rango.max - margen) return 'alerta';
  return 'ok';
}

/** Estado general de un paciente: el peor estado entre sus signos vitales. */
export function estadoPaciente(paciente: Paciente): EstadoSigno {
  const estados = paciente.signos.map(estadoSigno);
  if (estados.includes('critico')) return 'critico';
  if (estados.includes('alerta')) return 'alerta';
  return 'ok';
}

function signosBase(overrides: Partial<Record<string, number>> = {}): SignoVital[] {
  return [
    {
      clave: 'fc',
      etiqueta: 'Frecuencia cardíaca',
      valor: overrides['fc'] ?? 78,
      unidad: 'lpm',
      icono: 'lucideHeartPulse',
      rango: { min: 60, max: 100 },
      margen: 8,
    },
    {
      clave: 'spo2',
      etiqueta: 'Saturación de oxígeno',
      valor: overrides['spo2'] ?? 97,
      unidad: '%',
      icono: 'lucideDroplets',
      rango: { min: 92, max: 100 },
      margen: 2,
    },
    {
      clave: 'pas',
      etiqueta: 'Presión sistólica',
      valor: overrides['pas'] ?? 118,
      unidad: 'mmHg',
      icono: 'lucideActivity',
      rango: { min: 90, max: 140 },
      margen: 10,
    },
    {
      clave: 'pad',
      etiqueta: 'Presión diastólica',
      valor: overrides['pad'] ?? 76,
      unidad: 'mmHg',
      icono: 'lucideActivity',
      rango: { min: 60, max: 90 },
      margen: 6,
    },
    {
      clave: 'temp',
      etiqueta: 'Temperatura',
      valor: overrides['temp'] ?? 36.6,
      unidad: '°C',
      icono: 'lucideThermometer',
      rango: { min: 35.5, max: 37.5 },
      margen: 0.4,
    },
    {
      clave: 'fr',
      etiqueta: 'Frecuencia respiratoria',
      valor: overrides['fr'] ?? 16,
      unidad: 'rpm',
      icono: 'lucideWind',
      rango: { min: 12, max: 20 },
      margen: 2,
    },
  ];
}

export const PACIENTES: Paciente[] = [
  {
    id: 'p-001',
    nombre: 'Rosa',
    apellidoPaterno: 'Fuentealba',
    apellidoMaterno: 'Soto',
    edad: 78,
    habitacion: 'Domicilio · Ñuñoa',
    diagnostico: 'Insuficiencia cardíaca congestiva',
    familiar: 'Marcela Fuentealba (hija)',
    ultimaActualizacion: 'hace 12 segundos',
    signos: signosBase({ fc: 96, spo2: 93, pas: 138, pad: 88, temp: 37.1, fr: 19 }),
  },
  {
    id: 'p-002',
    nombre: 'Jorge',
    apellidoPaterno: 'Lillo',
    apellidoMaterno: 'Pizarro',
    edad: 65,
    habitacion: 'Domicilio · La Florida',
    diagnostico: 'EPOC moderado',
    familiar: 'Camila Lillo (nieta)',
    ultimaActualizacion: 'hace 40 segundos',
    signos: signosBase({ fc: 112, spo2: 88, pas: 152, pad: 95, temp: 38.2, fr: 24 }),
  },
  {
    id: 'p-003',
    nombre: 'Elena',
    apellidoPaterno: 'Vargas',
    apellidoMaterno: 'Muñoz',
    edad: 82,
    habitacion: 'Domicilio · Providencia',
    diagnostico: 'Postoperatorio de cadera',
    familiar: 'Pedro Vargas (hijo)',
    ultimaActualizacion: 'hace 5 segundos',
    signos: signosBase({ fc: 74, spo2: 98, pas: 122, pad: 78, temp: 36.4, fr: 15 }),
  },
  {
    id: 'p-004',
    nombre: 'Manuel',
    apellidoPaterno: 'Reyes',
    apellidoMaterno: 'Carrasco',
    edad: 71,
    habitacion: 'Domicilio · San Bernardo',
    diagnostico: 'Diabetes tipo 2 descompensada',
    familiar: 'Sofía Reyes (esposa)',
    ultimaActualizacion: 'hace 1 minuto',
    signos: signosBase({ fc: 88, spo2: 95, pas: 134, pad: 84, temp: 36.9, fr: 18 }),
  },
];

export function buscarPaciente(id: string): Paciente | undefined {
  return PACIENTES.find((p) => p.id === id);
}

export type Genero = 'Femenino' | 'Masculino' | 'Otro';
export type TipoUsuario = 'medico' | 'familiar';

export interface UsuarioStaff {
  id: string;
  nombreCompleto: string;
  correo: string;
  tipo: TipoUsuario;
  parentesco?: string;
  /** IDs de pacientes asignados. Un médico puede tener varios, un familiar solo uno. */
  pacientesAsignados: string[];
}

export interface PacienteRegistrado {
  id: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  edad: number;
  genero: Genero;
}

export const USUARIOS_STAFF: UsuarioStaff[] = [
  {
    id: 'u-001',
    nombreCompleto: 'Carlos Valverde Soto',
    correo: 'carlos.valverde@pulsocare.cl',
    tipo: 'medico',
    pacientesAsignados: ['p-001', 'p-002', 'p-003', 'p-004'],
  },
  {
    id: 'u-002',
    nombreCompleto: 'Marcela Fuentealba Soto',
    correo: 'marcela.fuentealba@pulsocare.cl',
    tipo: 'familiar',
    parentesco: 'Hijo/a',
    pacientesAsignados: ['p-001'],
  },
];

export const PACIENTES_REGISTRADOS: PacienteRegistrado[] = PACIENTES.map((p) => ({
  id: p.id,
  nombre: p.nombre,
  apellidoPaterno: p.apellidoPaterno,
  apellidoMaterno: p.apellidoMaterno,
  edad: p.edad,
  genero: 'Otro',
}));
