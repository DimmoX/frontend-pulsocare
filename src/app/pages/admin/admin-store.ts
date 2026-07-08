import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ROL_A_ID_ROL, RolClave } from '../../core/auth/roles.config';
import { UsuarioDTO } from '../../core/models/usuario.dto';

export interface NuevoUsuarioInput {
  nombreCompleto: string;
  correo: string;
  tipo: Extract<RolClave, 'MEDICO' | 'FAMILIAR'>;
  idParentesco?: number;
}

@Injectable({ providedIn: 'root' })
export class AdminStore {
  private http = inject(HttpClient)
  private apiUrl = environment.apiUrl;

  usuarios = signal<UsuarioDTO[]>([]);
  pacientes = signal<any[]>([]);

  // ========================================================
  // MÉTODOS DE CARGA INICIAL (GET)
  // ========================================================

  async cargarUsuarios(): Promise<void> {
    try {
      const data = await firstValueFrom(this.http.get<UsuarioDTO[]>(`${this.apiUrl}/auth/usuarios`));
      this.usuarios.set(data)
    } catch (error) {
      console.error('Error al cargar usuarios: ', error);
    }
  }

  async cargarPacientes(): Promise<void> {
    try {
      const data = await firstValueFrom(this.http.get<any[]>(`${this.apiUrl}/pacientes`));
      this.pacientes.set(data)
    } catch (error) {
      console.error('Error al cargar pacientes: ', error);
    }
  }

  // ========================================================
  // MÉTODOS DE CREACIÓN (POST)
  // ========================================================

  async crearUsuario(input: NuevoUsuarioInput): Promise<void> {
    try {
      const payload = {
        displayName: input.nombreCompleto,
        correo: input.correo,
        pass: crypto.randomUUID(),
        idRol: ROL_A_ID_ROL[input.tipo],
        idParentesco: input.tipo == 'FAMILIAR' ? input.idParentesco : undefined
      }
      const nuevoUsuario = await firstValueFrom(
        this.http.post<UsuarioDTO>(`${this.apiUrl}/auth/registro`, payload)
      );
      this.usuarios.update((lista) => [nuevoUsuario, ...lista]);
    } catch (error) {
      console.error('Error al crear usuario en Spring Boot: ', error);
      throw error;
    }
  }

  async crearPaciente(input: any): Promise<void> {
    try {
      const nuevoPaciente = await firstValueFrom(
        this.http.post<any>(`${this.apiUrl}/pacientes`, input)
      );
      this.pacientes.update((lista) => [nuevoPaciente, ...lista]);
    } catch (error) {
      console.error('Error al crear paciente en Spring Boot: ', error);
      throw error;
    }
  }

  // ========================================================
  // MÉTODOS DE ASIGNACIÓN (POST / PUT) [PENDIENTE DE IMPLEMENTAR EN BACKEND]
  // ========================================================

  async alternarAsignacionMedico(): Promise<never> {
    throw new Error('Falta implementar en el backend: POST /api/pacientes/{id}/asignaciones');
  }

  async asignarPacienteAFamiliar(): Promise<never> {
    throw new Error('Falta implementar en el backend: PUT /api/pacientes/{id}/asignaciones');
  }
}
