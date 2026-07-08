export interface UsuarioDTO {
  idUsuario: number;
  idRol: number;
  rol: string; // 'Medico' | 'Enfermero' | 'Familiar' | 'Administrador'
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string | null;
  correo: string;
  telefono: string | null;
  entraOid: string | null;
  idParentesco: number | null;
  estado: string;
}
