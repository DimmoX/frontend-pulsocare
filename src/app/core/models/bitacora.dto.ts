/** Una fila de la bitácora de accesos, como la devuelve el backend (ya con nombres). */
export interface EventoBitacoraDTO {
  idBitacora: number;
  idUsuario: number;
  usuario: string;
  rol: string;
  idPaciente: number | null;
  paciente: string | null;
  accion: string;
  detalle: string | null;
  direccionIp: string | null;
  fechaEvento: string; // ISO en UTC
}
