export interface UmbralDTO {
  idUmbral: number;
  idPaciente: number;
  idSignoVital: number;
  valorMin: number;
  valorMax: number;
  valorMinCritico: number;
  valorMaxCritico: number;
  vigente: number;
  vigenteDesde: string;
  idDefinidoPor: number | null;
}
