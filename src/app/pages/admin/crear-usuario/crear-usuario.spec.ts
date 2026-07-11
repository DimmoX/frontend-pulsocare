import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MsalService } from '@azure/msal-angular';
import { signal } from '@angular/core';
import { CrearUsuario } from './crear-usuario';
import { AdminStore } from '../admin-store';
import { UsuarioDTO } from '../../../core/models/usuario.dto';
import { PacienteDTO } from '../../../core/models/paciente.dto';

describe('CrearUsuario', () => {
  let fixture: ComponentFixture<CrearUsuario>;
  let component: CrearUsuario;
  let adminStoreMock: any;

  const pacientesDeEjemplo: PacienteDTO[] = [
    {
      idPaciente: 1, subjectId: 1, nombre: 'Rosa', apellidoPaterno: 'Fuentealba',
      apellidoMaterno: 'Soto', fechaNacimiento: '1948-02-10', sexo: 'F',
      idComuna: null, idModalidad: 1, idEstadoPaciente: 1,
    },
    {
      idPaciente: 2, subjectId: 2, nombre: 'Jorge', apellidoPaterno: 'Lillo',
      apellidoMaterno: 'Pizarro', fechaNacimiento: '1961-05-03', sexo: 'M',
      idComuna: null, idModalidad: 1, idEstadoPaciente: 1,
    },
  ];

  const usuarioDeEjemplo: UsuarioDTO = {
    idUsuario: 10, idRol: 1, rol: 'Medico', nombre: 'Carlos', apellidoPaterno: 'Valverde',
    apellidoMaterno: null, correo: 'carlos.valverde@pulsocare.cl', telefono: null,
    entraOid: null, idParentesco: null, estado: 'ACTIVO',
  };

  beforeEach(async () => {
    adminStoreMock = {
      usuarios: signal<UsuarioDTO[]>([usuarioDeEjemplo]),
      pacientes: signal<PacienteDTO[]>(pacientesDeEjemplo),
      pacientesPorUsuario: signal<Record<number, PacienteDTO[]>>({ 10: [] }),
      cargarUsuarios: vi.fn().mockResolvedValue(undefined),
      cargarPacientes: vi.fn().mockResolvedValue(undefined),
      crearUsuario: vi.fn().mockResolvedValue(undefined),
      asignarPaciente: vi.fn().mockResolvedValue(undefined),
      quitarAsignacion: vi.fn().mockResolvedValue(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [CrearUsuario],
      providers: [
        { provide: AdminStore, useValue: adminStoreMock },
        provideRouter([]), // RouterLink de <app-admin-tabs> necesita Router + ActivatedRoute reales
        { provide: MsalService, useValue: { instance: {}, logoutRedirect: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CrearUsuario);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // --- 1.1 Renderizado y estructura ---
  it('debe crearse y cargar usuarios y pacientes al iniciar', () => {
    expect(component).toBeTruthy();
    expect(adminStoreMock.cargarUsuarios).toHaveBeenCalled();
    expect(adminStoreMock.cargarPacientes).toHaveBeenCalled();
  });

  it('debe renderizar los campos nombre, apellido paterno y correo, y el botón "Crear usuario"', () => {
    const html: HTMLElement = fixture.nativeElement;
    expect(html.querySelector('input[formControlName="nombre"]')).toBeTruthy();
    expect(html.querySelector('input[formControlName="apellidoPaterno"]')).toBeTruthy();
    expect(html.querySelector('input[formControlName="correo"]')).toBeTruthy();
    expect(html.textContent).toContain('Crear usuario');
  });

  it('el campo de parentesco solo debe aparecer cuando el tipo es "familiar"', () => {
    const html: HTMLElement = fixture.nativeElement;
    expect(html.querySelector('select[formControlName="idParentesco"]')).toBeFalsy();

    component.seleccionarTipo('familiar');
    fixture.detectChanges();
    expect(html.querySelector('select[formControlName="idParentesco"]')).toBeTruthy();
  });

  // --- 1.2 Validaciones ---
  it('debe marcar el correo como inválido si el formato no es un email', () => {
    component.form.controls.correo.setValue('no-es-un-correo');
    component.form.controls.correo.markAsTouched();
    expect(component.mostrarError('correo')).toBe(true);
  });

  it('el error debe desaparecer al corregir el campo', () => {
    component.form.controls.nombre.markAsTouched();
    expect(component.mostrarError('nombre')).toBe(true);

    component.form.controls.nombre.setValue('Rosa');
    expect(component.mostrarError('nombre')).toBe(false);
  });

  it('seleccionar tipo "familiar" debe volver obligatorio el parentesco', () => {
    component.seleccionarTipo('familiar');
    expect(component.form.controls.idParentesco.invalid).toBe(true);

    component.form.controls.idParentesco.setValue(1);
    expect(component.form.controls.idParentesco.valid).toBe(true);
  });

  // --- 1.3 Interacción y envío ---
  it('guardar() con formulario inválido no debe llamar a AdminStore y debe marcar todo como touched', async () => {
    await component.guardar();
    expect(adminStoreMock.crearUsuario).not.toHaveBeenCalled();
    expect(component.form.controls.nombre.touched).toBe(true);
  });

  it('guardar() con datos válidos (médico) debe llamar a crearUsuario con el payload correcto', async () => {
    component.form.setValue({ nombre: 'Daniel', apellidoPaterno: 'San Juan', correo: 'daniel@pulsocare.cl', idParentesco: null });

    await component.guardar();

    expect(adminStoreMock.crearUsuario).toHaveBeenCalledWith({
      nombreCompleto: 'Daniel San Juan',
      correo: 'daniel@pulsocare.cl',
      tipo: 'MEDICO',
      idParentesco: undefined,
    });
  });

  it('guardar() con tipo "familiar" debe incluir el idParentesco elegido', async () => {
    component.seleccionarTipo('familiar');
    component.form.setValue({ nombre: 'Marcela', apellidoPaterno: 'Fuentealba', correo: 'marcela@pulsocare.cl', idParentesco: 1 });

    await component.guardar();

    expect(adminStoreMock.crearUsuario).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: 'FAMILIAR', idParentesco: 1 })
    );
  });

  it('debe mostrar el mensaje de éxito y limpiar el formulario tras crear el usuario', async () => {
    component.form.setValue({ nombre: 'Daniel', apellidoPaterno: 'San Juan', correo: 'daniel@pulsocare.cl', idParentesco: null });
    await component.guardar();

    expect(component.mensajeExito()).toContain('correctamente');
    expect(component.form.controls.nombre.value).toBeNull();
  });

  it('estaCargando debe volver a false incluso si AdminStore lanza un error', async () => {
    adminStoreMock.crearUsuario.mockRejectedValue({ status: 500 });
    component.form.setValue({ nombre: 'Daniel', apellidoPaterno: 'San Juan', correo: 'daniel@pulsocare.cl', idParentesco: null });

    await component.guardar();

    expect(component.estaCargando()).toBe(false);
    expect(component.mensajeExito()).toBe('');
  });

  // --- Asignación de pacientes ---
  it('pacientesDisponibles debe excluir los pacientes ya asignados a ese usuario', () => {
    adminStoreMock.pacientesPorUsuario.set({ 10: [pacientesDeEjemplo[0]] });
    const disponibles = component.pacientesDisponibles(10);
    expect(disponibles).toEqual([pacientesDeEjemplo[1]]);
  });

  it('asignar() debe convertir el id a número y llamar a AdminStore', async () => {
    await component.asignar(10, '2');
    expect(adminStoreMock.asignarPaciente).toHaveBeenCalledWith(2, 10);
  });

  it('asignar() no debe llamar al store si no se eligió un paciente válido', async () => {
    await component.asignar(10, '');
    expect(adminStoreMock.asignarPaciente).not.toHaveBeenCalled();
  });

  it('quitar() debe llamar a AdminStore con idPaciente e idUsuario', async () => {
    await component.quitar(10, 1);
    expect(adminStoreMock.quitarAsignacion).toHaveBeenCalledWith(1, 10);
  });

  it('debe mostrar un mensaje legible si la asignación devuelve 409 (ya asignado)', async () => {
    adminStoreMock.asignarPaciente.mockRejectedValue({ status: 409 });
    await component.asignar(10, '1');
    expect(component.errorAsignacion()).toContain('ya estaba asignado');
  });
});
