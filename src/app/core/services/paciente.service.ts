import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { PacienteDTO } from '../models/paciente.dto';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PacienteService {
  private http = inject(HttpClient);

  // Apunta a http://localhost:8080/api/pacientes
  private apiUrl = `${environment.apiUrl}/pacientes`;

  crearPaciente(paciente: PacienteDTO): Observable<PacienteDTO> {
    // Hace la petición POST al backend de Spring Boot
    return this.http.post<PacienteDTO>(this.apiUrl, paciente);
  }

  // Preparando el terreno para cuando necesites listar los pacientes
  obtenerPacientes(): Observable<PacienteDTO[]> {
    return this.http.get<PacienteDTO[]>(this.apiUrl);
  }
}
