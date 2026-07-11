import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthStore } from './auth.store';
import { environment } from '../../../environments/environment';

describe('AuthStore', () => {
  let store: AuthStore;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    store = TestBed.inject(AuthStore);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('usuario() debe empezar en null y estaSincronizado() en false', () => {
    expect(store.usuario()).toBeNull();
    expect(store.estaSincronizado()).toBe(false);
  });

  it('sincronizarConBackend debe llamar a POST /auth/registro con el payload correcto y guardar el resultado', async () => {
    const promesa = store.sincronizarConBackend({
      oid: 'oid-123',
      name: 'Rosa Fuentealba',
      preferred_username: 'rosa@pulsocare.cl',
      jobTitle: 'Familiar',
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/registro`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(
      expect.objectContaining({
        displayName: 'Rosa Fuentealba',
        correo: 'rosa@pulsocare.cl',
        entraOid: 'oid-123',
        idRol: 3, // FAMILIAR
      })
    );
    // La contraseña sintética debe existir pero no puede ser vacía ni ser un valor fijo.
    expect(typeof req.request.body.pass).toBe('string');
    expect(req.request.body.pass.length).toBeGreaterThan(10);

    const usuarioSimulado = {
      idUsuario: 7,
      idRol: 3,
      rol: 'Familiar',
      nombre: 'Rosa',
      apellidoPaterno: 'Fuentealba',
      apellidoMaterno: null,
      correo: 'rosa@pulsocare.cl',
      telefono: null,
      entraOid: 'oid-123',
      idParentesco: null,
      estado: 'ACTIVO',
    };
    req.flush(usuarioSimulado);

    const usuario = await promesa;
    expect(usuario).toEqual(usuarioSimulado);
    expect(store.usuario()).toEqual(usuarioSimulado);
    expect(store.estaSincronizado()).toBe(true);
    expect(store.rolClave()).toBe('FAMILIAR');
  });

  it('debe usar FAMILIAR por defecto si el token no trae jobTitle', async () => {
    const promesa = store.sincronizarConBackend({ name: 'Sin Rol' });
    const req = httpMock.expectOne(`${environment.apiUrl}/auth/registro`);
    expect(req.request.body.idRol).toBe(3);
    req.flush({ idUsuario: 1, idRol: 3, rol: 'Familiar' } as any);
    await promesa;
  });

  it('debe propagar el error si ms-auth responde con un conflicto (409)', async () => {
    const promesa = store.sincronizarConBackend({ name: 'Error', jobTitle: 'Medico' });
    const req = httpMock.expectOne(`${environment.apiUrl}/auth/registro`);
    req.flush('correo ya registrado', { status: 409, statusText: 'Conflict' });

    await expect(promesa).rejects.toBeTruthy();
    expect(store.usuario()).toBeNull();
  });

  it('cerrarSesionLocal debe limpiar el usuario sincronizado', async () => {
    const promesa = store.sincronizarConBackend({ name: 'X', jobTitle: 'Administrador' });
    httpMock.expectOne(`${environment.apiUrl}/auth/registro`).flush({ idUsuario: 1, rol: 'Administrador' } as any);
    await promesa;
    expect(store.usuario()).not.toBeNull();

    store.cerrarSesionLocal();
    expect(store.usuario()).toBeNull();
  });
});
