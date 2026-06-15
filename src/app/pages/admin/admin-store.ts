import { Injectable, signal } from '@angular/core';
import {
  Genero,
  PACIENTES_REGISTRADOS,
  PacienteRegistrado,
  TipoUsuario,
  USUARIOS_STAFF,
  UsuarioStaff,
} from '../../data/mock-data';

let contadorUsuarios = USUARIOS_STAFF.length;
let contadorPacientes = PACIENTES_REGISTRADOS.length;

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
  usuarios = signal<UsuarioStaff[]>([...USUARIOS_STAFF]);
  pacientes = signal<PacienteRegistrado[]>([...PACIENTES_REGISTRADOS]);

  crearUsuario(input: NuevoUsuarioInput): UsuarioStaff {
    contadorUsuarios += 1;
    const nuevo: UsuarioStaff = {
      id: `u-${String(contadorUsuarios).padStart(3, '0')}`,
      nombreCompleto: `${input.nombre} ${input.apellidoPaterno} ${input.apellidoMaterno}`,
      correo: input.correo,
      tipo: input.tipo,
      parentesco: input.tipo === 'familiar' ? input.parentesco : undefined,
      pacientesAsignados: [],
    };
    this.usuarios.update((lista) => [nuevo, ...lista]);
    return nuevo;
  }

  crearPaciente(input: NuevoPacienteInput): PacienteRegistrado {
    contadorPacientes += 1;
    const nuevo: PacienteRegistrado = {
      id: `p-${String(contadorPacientes).padStart(3, '0')}`,
      nombre: input.nombre,
      apellidoPaterno: input.apellidoPaterno,
      apellidoMaterno: input.apellidoMaterno,
      edad: input.edad,
      genero: input.genero,
    };
    this.pacientes.update((lista) => [nuevo, ...lista]);
    return nuevo;
  }

  /** Asigna o desasigna un paciente a un médico (permite varios pacientes por médico). */
  alternarAsignacionMedico(usuarioId: string, pacienteId: string) {
    this.usuarios.update((lista) =>
      lista.map((u) => {
        if (u.id !== usuarioId) return u;
        const yaAsignado = u.pacientesAsignados.includes(pacienteId);
        return {
          ...u,
          pacientesAsignados: yaAsignado
            ? u.pacientesAsignados.filter((id: string) => id !== pacienteId)
            : [...u.pacientesAsignados, pacienteId],
        };
      })
    );
  }

  /** Asigna un único paciente a un familiar (reemplaza la asignación previa). */
  asignarPacienteAFamiliar(usuarioId: string, pacienteId: string | null) {
    this.usuarios.update((lista) =>
      lista.map((u) =>
        u.id === usuarioId ? { ...u, pacientesAsignados: pacienteId ? [pacienteId] : [] } : u
      )
    );
  }
}
