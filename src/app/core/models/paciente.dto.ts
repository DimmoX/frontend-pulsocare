/**
 * ID_ESTADO_PACIENTE del catalogo PC_ESTADO_PACIENTE. Los codigos se siembran en orden
 * (ESTABLE=1, OBSERVACION=2, CRITICO=3, ALTA=4), asi que estos ids son estables. Un
 * paciente en ALTA dejo de monitorearse: el replayer no lo reproduce y el medico ve
 * "Sin monitoreo activo".
 */
export const ID_ESTADO_ALTA = 4;

export function estaDadoDeAlta(p: { idEstadoPaciente: number | null }): boolean {
  return p.idEstadoPaciente === ID_ESTADO_ALTA;
}

export interface PacienteDTO {
  idPaciente: number;
  subjectId: number | null;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string | null;
  fechaNacimiento: string; // ISO 'YYYY-MM-DD'
  sexo: 'M' | 'F' | null;
  idComuna: number | null;
  idModalidad: number | null;
  idEstadoPaciente: number | null;
}

export interface CrearPacienteInput {
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  fechaNacimiento: string;
  sexo: 'M' | 'F';
  idModalidad: number;
  idEstadoPaciente: number;
}

export function edadDesdeFechaNacimiento(fechaNacimiento: string): number {
  const nacimiento = new Date(fechaNacimiento);
  const hoy = new Date();
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const aunNoCumpleEsteAnio =
    hoy.getMonth() < nacimiento.getMonth() ||
    (hoy.getMonth() === nacimiento.getMonth() && hoy.getDate() < nacimiento.getDate());
  if (aunNoCumpleEsteAnio) edad--;
  return edad;
}

export function generoDesdeSexo(sexo: string | null): string {
  return sexo === 'M' ? 'Masculino' : sexo === 'F' ? 'Femenino' : 'No indicado';
}
