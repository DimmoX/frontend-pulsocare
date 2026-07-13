export type RolClave = 'ADMIN' | 'MEDICO' | 'FAMILIAR' | 'PACIENTE';

function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
}

// jobTitle configurado en Entra ID -> rol interno de la app.
const JOB_TITLE_A_ROL: Record<string, RolClave> = {
  administrador: 'ADMIN',
  medico: 'MEDICO',
  familiar: 'FAMILIAR',
  paciente: 'PACIENTE'
};

export function rolDesdeJobTitle(jobTitle?: string | null): RolClave {
  if (!jobTitle) return 'FAMILIAR';
  return JOB_TITLE_A_ROL[normalizar(jobTitle)] ?? 'FAMILIAR';
}

// PC_ROL.NOMBRE (tal como lo devuelve ms-auth) -> rol interno de la app.
const NOMBRE_ROL_A_CLAVE: Record<string, RolClave> = {
  medico: 'MEDICO',
  enfermero: 'MEDICO', // no tiene ruta propia hoy; se homologa a Médico
  familiar: 'FAMILIAR',
  administrador: 'ADMIN',
  paciente: 'PACIENTE'
};

export function claveDesdeNombreRol(nombreRol?: string | null): RolClave | null {
  if (!nombreRol) return null;
  return NOMBRE_ROL_A_CLAVE[normalizar(nombreRol)] ?? null;
}

// rol interno -> ID_ROL real de PC_ROL (confirmar con: SELECT ID_ROL, NOMBRE FROM PC_ROL;)
export const ROL_A_ID_ROL: Record<RolClave, number> = {
  MEDICO: 1,
  FAMILIAR: 3,
  ADMIN: 4,
  PACIENTE: 5
};

export const ROL_A_RUTA: Record<RolClave, string> = {
  ADMIN: '/admin/usuarios',
  MEDICO: '/medico/pacientes',
  FAMILIAR: '/familiar/signos-vitales',
  PACIENTE: '/paciente/historial'
};

// Catálogo real de PC_PARENTESCO (reemplaza los valores inventados de crear-usuario.ts).
export const PARENTESCOS: { id: number; nombre: string }[] = [
  { id: 1, nombre: 'Hijo/a' },
  { id: 2, nombre: 'Conyuge' },
  { id: 3, nombre: 'Hermano/a' },
  { id: 4, nombre: 'Padre/Madre' },
  { id: 5, nombre: 'Otro' },
];
