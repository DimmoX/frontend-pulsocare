import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AlertaDTO, LecturaDTO } from '../models/consultas.dto';
import { UmbralDTO } from '../models/umbral.dto';

@Injectable({ providedIn: 'root' })
export class ConsultasService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  ultimas(idPaciente: number): Promise<LecturaDTO[]> {
    return firstValueFrom(this.http.get<LecturaDTO[]>(`${this.apiUrl}/pacientes/${idPaciente}/lecturas/ultimas`));
  }

  historico(idPaciente: number, idSignoVital: number, limite = 50): Promise<LecturaDTO[]> {
    return firstValueFrom(
      this.http.get<LecturaDTO[]>(`${this.apiUrl}/pacientes/${idPaciente}/lecturas`, {
        params: { idSignoVital, limite },
      })
    );
  }

  /**
   * Alertas recientes del paciente. El limite es obligatorio en la practica: sin el,
   * un paciente con meses de monitoreo devuelve decenas de miles de filas y la
   * llamada tarda minutos.
   */
  alertas(idPaciente: number, limite = 50): Promise<AlertaDTO[]> {
    return firstValueFrom(
      this.http.get<AlertaDTO[]>(`${this.apiUrl}/alertas`, { params: { idPaciente, limite } })
    );
  }

  reconocer(idAlerta: number, idUsuario: number): Promise<AlertaDTO> {
    return firstValueFrom(this.http.put<AlertaDTO>(`${this.apiUrl}/alertas/${idAlerta}/reconocer`, { idUsuario }));
  }

  umbrales(idPaciente: number): Promise<UmbralDTO[]> {
    return firstValueFrom(this.http.get<UmbralDTO[]>(`${this.apiUrl}/umbrales`, { params: { idPaciente } }));
  }
}
