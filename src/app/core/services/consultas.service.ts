import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AlertaDTO, LecturaDTO } from '../models/consultas.dto';
import { UmbralDTO } from '../models/umbral.dto';
import { PuntajeNews2DTO } from '../models/news2.dto';

/** Una pagina de lecturas y el total de filas que cumplen los filtros. */
export interface PaginaLecturas {
  lecturas: LecturaDTO[];
  total: number;
}

@Injectable({ providedIn: 'root' })
export class ConsultasService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  ultimas(idPaciente: number): Promise<LecturaDTO[]> {
    return firstValueFrom(this.http.get<LecturaDTO[]>(`${this.apiUrl}/pacientes/${idPaciente}/lecturas/ultimas`));
  }

  /**
   * Una pagina del historico de lecturas. La base pagina y ordena (un dia de
   * monitoreo son miles de lecturas, traerlas todas no es opcion), asi que aqui solo
   * se pide la ventana. Las fechas van en ISO sin zona (2026-07-17T03:24:00).
   */
  async historico(
    idPaciente: number,
    filtros: {
      idSignoVital?: number;
      desde?: string;
      hasta?: string;
      limite?: number;
      offset?: number;
      orden?: string;
      ascendente?: boolean;
    } = {}
  ): Promise<PaginaLecturas> {
    let params = new HttpParams()
      .set('limite', filtros.limite ?? 50)
      .set('offset', filtros.offset ?? 0);
    if (filtros.idSignoVital) params = params.set('idSignoVital', filtros.idSignoVital);
    if (filtros.desde) params = params.set('desde', filtros.desde);
    if (filtros.hasta) params = params.set('hasta', filtros.hasta);
    if (filtros.orden) params = params.set('orden', filtros.orden);
    if (filtros.ascendente !== undefined) params = params.set('ascendente', filtros.ascendente);

    // El total viene en la cabecera X-Total-Count (el gateway la expone por CORS):
    // es la unica forma de saber cuantas paginas hay sin traerse todas las filas.
    const resp = await firstValueFrom(
      this.http.get<LecturaDTO[]>(`${this.apiUrl}/pacientes/${idPaciente}/lecturas`, {
        params,
        observe: 'response',
      })
    );
    return {
      lecturas: resp.body ?? [],
      total: Number(resp.headers.get('X-Total-Count') ?? resp.body?.length ?? 0),
    };
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

  /**
   * Define o ajusta los limites de alarma de un signo para un paciente.
   *
   * idDefinidoPor no es opcional: el backend lo exige porque cada cambio queda en la
   * bitacora, y un ajuste de alarma sin responsable identificado no es auditable.
   */
  crearUmbral(umbral: {
    idPaciente: number;
    idSignoVital: number;
    valorMin: number | null;
    valorMax: number | null;
    valorMinCritico: number | null;
    valorMaxCritico: number | null;
    idDefinidoPor: number;
  }): Promise<UmbralDTO> {
    return firstValueFrom(this.http.post<UmbralDTO>(`${this.apiUrl}/umbrales`, umbral));
  }

  actualizarUmbral(
    idUmbral: number,
    cambios: {
      valorMin: number | null;
      valorMax: number | null;
      valorMinCritico: number | null;
      valorMaxCritico: number | null;
      idDefinidoPor: number;
    }
  ): Promise<UmbralDTO> {
    return firstValueFrom(this.http.put<UmbralDTO>(`${this.apiUrl}/umbrales/${idUmbral}`, cambios));
  }

  /** Baja logica: el signo vuelve a su rango por defecto. */
  eliminarUmbral(idUmbral: number, idUsuario: number): Promise<void> {
    return firstValueFrom(
      this.http.delete<void>(`${this.apiUrl}/umbrales/${idUmbral}`, { params: { idUsuario } })
    );
  }

  /**
   * Escala de alerta temprana NEWS2 del paciente, calculada en el backend a partir de
   * sus últimas lecturas. Es una señal de apoyo para el médico, no un diagnóstico.
   */
  news2(idPaciente: number): Promise<PuntajeNews2DTO> {
    return firstValueFrom(
      this.http.get<PuntajeNews2DTO>(`${this.apiUrl}/pacientes/${idPaciente}/news2`)
    );
  }

  /**
   * Deja constancia en la bitácora de que un usuario accedió a un dato clínico. Es
   * auditoría best-effort: si el registro falla, no debe interrumpir lo que el médico
   * está haciendo, así que quien la llame la trata como fire-and-forget.
   */
  registrarAcceso(idUsuario: number, idPaciente: number, accion: string, detalle?: string): Promise<void> {
    return firstValueFrom(
      this.http.post<void>(`${this.apiUrl}/bitacora`, { idUsuario, idPaciente, accion, detalle })
    );
  }
}
