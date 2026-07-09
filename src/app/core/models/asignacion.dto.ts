export interface CuidadorDTO {
  idAsignacion: number;
  idUsuario: number;
  nombre: string;
  apellidoPaterno: string;
  correo: string;
  rol: string; // 'Medico' | 'Enfermero' | 'Familiar' | 'Administrador'
  fechaInicio: string; // ISO date
}

export interface AsignacionDTO {
  idAsignacion: number;
  idUsuario: number;
  idPaciente: number;
  fechaInicio: string;
  fechaFin: string | null;
  activo: number;
}
