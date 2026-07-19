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
  /**
   * Contraseña temporal de B2C. Solo viene poblada en la respuesta de creación de un
   * usuario, para que el administrador pueda entregársela; en cualquier otra consulta
   * es null.
   */
  passwordTemporal?: string | null;
}
