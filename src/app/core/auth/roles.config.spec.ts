import {
  ROL_A_ID_ROL,
  ROL_A_RUTA,
  PARENTESCOS,
  rolDesdeJobTitle,
  claveDesdeNombreRol,
} from './roles.config';

describe('roles.config', () => {
  describe('rolDesdeJobTitle', () => {
    it('debe mapear "Administrador" a ADMIN', () => {
      expect(rolDesdeJobTitle('Administrador')).toBe('ADMIN');
    });

    it('debe mapear "Médico" (con tilde) a MEDICO', () => {
      expect(rolDesdeJobTitle('Médico')).toBe('MEDICO');
    });

    it('debe ignorar mayúsculas/minúsculas y espacios extra', () => {
      expect(rolDesdeJobTitle('  MEDICO  ')).toBe('MEDICO');
      expect(rolDesdeJobTitle('medico')).toBe('MEDICO');
    });

    it('debe mapear "Familiar" a FAMILIAR', () => {
      expect(rolDesdeJobTitle('Familiar')).toBe('FAMILIAR');
    });

    it('debe usar FAMILIAR como respaldo si el jobTitle es nulo, vacío o desconocido', () => {
      expect(rolDesdeJobTitle(null)).toBe('FAMILIAR');
      expect(rolDesdeJobTitle(undefined)).toBe('FAMILIAR');
      expect(rolDesdeJobTitle('')).toBe('FAMILIAR');
      expect(rolDesdeJobTitle('Recepcionista')).toBe('FAMILIAR');
    });
  });

  describe('claveDesdeNombreRol', () => {
    it('debe mapear los 4 nombres reales de PC_ROL', () => {
      expect(claveDesdeNombreRol('Medico')).toBe('MEDICO');
      expect(claveDesdeNombreRol('Enfermero')).toBe('MEDICO');
      expect(claveDesdeNombreRol('Familiar')).toBe('FAMILIAR');
      expect(claveDesdeNombreRol('Administrador')).toBe('ADMIN');
    });

    it('debe devolver null si no hay nombre de rol o no se reconoce', () => {
      expect(claveDesdeNombreRol(null)).toBeNull();
      expect(claveDesdeNombreRol(undefined)).toBeNull();
      expect(claveDesdeNombreRol('Rol inexistente')).toBeNull();
    });
  });

  describe('catálogos', () => {
    it('ROL_A_ID_ROL debe tener un ID numérico por cada rol asignable', () => {
      expect(ROL_A_ID_ROL.MEDICO).toBe(1);
      expect(ROL_A_ID_ROL.FAMILIAR).toBe(3);
      expect(ROL_A_ID_ROL.ADMIN).toBe(4);
    });

    it('ROL_A_RUTA debe tener una ruta base por cada rol', () => {
      expect(ROL_A_RUTA.ADMIN).toBe('/admin/usuarios');
      expect(ROL_A_RUTA.MEDICO).toBe('/medico/pacientes');
      expect(ROL_A_RUTA.FAMILIAR).toBe('/familiar/signos-vitales');
    });

    it('PARENTESCOS debe reflejar el catálogo real de PC_PARENTESCO (5 filas)', () => {
      expect(PARENTESCOS).toHaveLength(5);
      expect(PARENTESCOS.map((p) => p.nombre)).toEqual([
        'Hijo/a',
        'Conyuge',
        'Hermano/a',
        'Padre/Madre',
        'Otro',
      ]);
    });
  });
});
