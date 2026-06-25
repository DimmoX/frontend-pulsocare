import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  Genero,
  PacienteRegistrado,
  TipoUsuario,
  UsuarioStaff,
} from '../../data/mock-data';
export interface NuevoUsuarioInput {
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  tipo: TipoUsuario;
  parentesco?: string;
  correo: string;
}

export interface NuevoPacienteInput {
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  edad: number;
  genero: Genero;
}

@Injectable({ providedIn: 'root' })
export class AdminStore {
  private http = inject(HttpClient)
  private apiUrl = 'http://localhost:8080/api';

  usuarios = signal<UsuarioStaff[]>([]);
  pacientes = signal<PacienteRegistrado[]>([]);

  // ========================================================
  // MÉTODOS DE CARGA INICIAL (GET)
  // ========================================================

  async cargarUsuarios(): Promise<void> {
    try {
      const data = await firstValueFrom(this.http.get<UsuarioStaff[]>(`${this.apiUrl}/admin/usuarios`));
      this.usuarios.set(data)
    } catch (error) {
      console.error('Error al cargar pacientes: ', error);
    }
  }

  async cargarPacientes(): Promise<void> {
    try {
      const data = await firstValueFrom(this.http.get<PacienteRegistrado[]>(`${this.apiUrl}/admin/pacientes`));
      this.pacientes.set(data)
    } catch (error) {
      console.error('Error al cargar usuarios: ', error);
    }
  }

  // ========================================================
  // MÉTODOS DE CREACIÓN (POST)
  // ========================================================

  async crearUsuario(input: NuevoUsuarioInput): Promise<void> {
    try {
      const nuevoUsuario = await firstValueFrom(
        this.http.post<UsuarioStaff>(`${this.apiUrl}/admin/usuario`, input)
      );
      this.usuarios.update((lista) => [nuevoUsuario, ...lista]);
    } catch (error) {
      console.error('Error al crear usuario en Spring Boot: ', error);
      throw error;
    }
  }

  async crearPaciente(input: NuevoPacienteInput): Promise<void> {
    try {
      const nuevoPaciente = await firstValueFrom(
        this.http.post<PacienteRegistrado>(`${this.apiUrl}/admin/pacientes`, input)
      );
      this.pacientes.update((lista) => [nuevoPaciente, ...lista]);
    } catch (error) {
      console.error('Error al crear paciente en Spring Boot: ', error);
      throw error;
    }
  }

  // ========================================================
  // MÉTODOS DE ASIGNACIÓN (POST / PUT)
  // ========================================================

  /** Asigna o desasigna un paciente a un médico (permite varios pacientes por médico). */
  async alternarAsignacionMedico(usuarioId: string, pacienteId: string): Promise<void> {
    const usuarioActualizado = await firstValueFrom(
      this.http.post<UsuarioStaff>(`${this.apiUrl}/admin/usuarios/${usuarioId}/pacientes/${pacienteId}/alternar`, {})
    );

    this.usuarios.update((lista) =>
      lista.map((u) => (u.id === usuarioId ? usuarioActualizado : u))
    );
  }

  /** Asigna un único paciente a un familiar (reemplaza la asignación previa). */
  async asignarPacienteAFamiliar(usuarioId: string, pacienteId: string | null): Promise<void> {
    const payload = { pacienteId: pacienteId };

    const usuarioActualizado = await firstValueFrom(
      this.http.put<UsuarioStaff>(`${this.apiUrl}/admin/usuarios/${usuarioId}/paciente`, payload)
    );

    this.usuarios.update((lista) =>
      lista.map((u) => (u.id === usuarioId ? usuarioActualizado : u))
    );
  }
}
