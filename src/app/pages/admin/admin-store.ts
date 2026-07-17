import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ROL_A_ID_ROL, RolClave } from '../../core/auth/roles.config';
import { UsuarioDTO } from '../../core/models/usuario.dto';
import { CrearPacienteInput, PacienteDTO } from '../../core/models/paciente.dto';
import { CuidadorDTO } from '../../core/models/asignacion.dto';
import { EventoBitacoraDTO } from '../../core/models/bitacora.dto';

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

  pacientesPorUsuario = signal<Record<number, PacienteDTO[]>>({});

  // ========================================================
  // MÉTODOS DE CARGA INICIAL (GET)
  // ========================================================

  async cargarUsuarios(): Promise<void> {
    try {
      const data = await firstValueFrom(this.http.get<UsuarioDTO[]>(`${this.apiUrl}/auth/usuarios`));
      this.usuarios.set(data)
      await Promise.all(data.map((u) => this.cargarPacientesDeUsuario(u.idUsuario)));
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

  async cargarPacientesDeUsuario(idUsuario: number): Promise<void> {
    try {
      const data = await firstValueFrom(
        this.http.get<PacienteDTO[]>(`${this.apiUrl}/usuarios/${idUsuario}/pacientes`)
      );
      this.pacientesPorUsuario.update((mapa) => ({ ...mapa, [idUsuario]: data }));
    } catch (error) {
      console.error(`Error al cargar los pacientes del usuario ${idUsuario}: `, error);
    }
  }

  // ========================================================
  // MÉTODOS DE CREACIÓN (POST)
  // ========================================================

  async crearUsuario(input: NuevoUsuarioInput): Promise<{ usuario: UsuarioDTO; passwordTemporal: string }> {
    try {
      const passwordTemporal = crypto.randomUUID();
      const payload = {
        displayName: input.nombreCompleto,
        correo: input.correo,
        pass: passwordTemporal,
        idRol: ROL_A_ID_ROL[input.tipo],
        idParentesco: input.tipo == 'FAMILIAR' ? input.idParentesco : undefined
      }
      const nuevoUsuario = await firstValueFrom(
        this.http.post<UsuarioDTO>(`${this.apiUrl}/auth/registro`, payload)
      );
      this.usuarios.update((lista) => [nuevoUsuario, ...lista]);
      return { usuario: nuevoUsuario, passwordTemporal };
    } catch (error) {
      console.error('Error al crear usuario en Spring Boot: ', error);
      throw error;
    }
  }

  async crearPaciente(input: CrearPacienteInput): Promise<void> {
    try {
      const nuevoPaciente = await firstValueFrom(
        this.http.post<PacienteDTO>(`${this.apiUrl}/pacientes`, input)
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

  async asignarPaciente(idPaciente: number, idUsuario: number): Promise<void> {
    await firstValueFrom(
      this.http.post(`${this.apiUrl}/pacientes/${idPaciente}/asignaciones`, { idUsuario })
    );
    await this.cargarPacientesDeUsuario(idUsuario);
  }

  async quitarAsignacion(idPaciente: number, idUsuario: number): Promise<void> {
    await firstValueFrom(
      this.http.delete(`${this.apiUrl}/pacientes/${idPaciente}/asignaciones/${idUsuario}`)
    );
    await this.cargarPacientesDeUsuario(idUsuario);
  }

  /**
   * Da de baja o rehabilita a un usuario. No se borra: siete claves foraneas apuntan a
   * PC_USUARIO, y en salud no se elimina el rastro de quien reconocio una alerta. Al
   * quedar INACTIVO deja de poder entrar y de recibir notificaciones.
   */
  async cambiarEstadoUsuario(idUsuario: number, estado: 'ACTIVO' | 'INACTIVO'): Promise<void> {
    await firstValueFrom(
      this.http.put<UsuarioDTO>(`${this.apiUrl}/auth/usuarios/${idUsuario}/estado`, { estado })
    );
    await this.cargarUsuarios();
  }

  /**
   * Da de alta a un paciente (ALTA) o lo reactiva (ESTABLE). No se borra: el DELETE
   * fallaria por las FKs y en salud no se elimina la historia clinica. Un paciente de
   * alta deja de monitorearse (el replayer no lo reproduce) pero su historial se conserva.
   */
  async cambiarEstadoPaciente(idPaciente: number, codigo: 'ALTA' | 'ESTABLE'): Promise<void> {
    await firstValueFrom(
      this.http.put<PacienteDTO>(`${this.apiUrl}/pacientes/${idPaciente}/estado`, { codigo })
    );
    await this.cargarPacientes();
  }

  /** Últimos accesos registrados en la bitácora, para el panel de auditoría del admin. */
  async cargarBitacora(limite = 200): Promise<EventoBitacoraDTO[]> {
    return firstValueFrom(
      this.http.get<EventoBitacoraDTO[]>(`${this.apiUrl}/bitacora`, { params: { limite } })
    );
  }

  async cargarCuidadoresDePaciente(idPaciente: number): Promise<CuidadorDTO[]> {
    return firstValueFrom(
      this.http.get<CuidadorDTO[]>(`${this.apiUrl}/pacientes/${idPaciente}/asignaciones`)
    );
  }
}
