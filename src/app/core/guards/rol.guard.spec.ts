import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { MsalService } from '@azure/msal-angular';
import { rolGuard } from './rol.guard';
import { AuthStore } from '../services/auth.store';

describe('rolGuard', () => {
  let authStoreMock: { estaSincronizado: () => boolean; rolClave: () => any; sincronizarConBackend: any };
  let msalMock: { instance: { getActiveAccount: () => any } };

  function configurar(overrides: Partial<typeof authStoreMock> = {}) {
    authStoreMock = {
      estaSincronizado: () => true,
      rolClave: () => 'MEDICO',
      sincronizarConBackend: vi.fn(),
      ...overrides,
    };
    msalMock = { instance: { getActiveAccount: () => null } };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthStore, useValue: authStoreMock },
        { provide: MsalService, useValue: msalMock },
      ],
    });
  }

  it('permite el acceso si el rol sincronizado está en la lista de permitidos', async () => {
    configurar({ rolClave: () => 'MEDICO' });
    const resultado = await TestBed.runInInjectionContext(() => rolGuard(['MEDICO'])({} as any, {} as any));
    expect(resultado).toBe(true);
  });

  it('redirige (no da acceso) si el rol sincronizado no está permitido', async () => {
    configurar({ rolClave: () => 'FAMILIAR' });
    const resultado = await TestBed.runInInjectionContext(() =>
      rolGuard(['MEDICO', 'ADMIN'])({} as any, {} as any)
    );
    expect(resultado).not.toBe(true);
  });

  it('redirige si no hay sesión sincronizada ni cuenta MSAL activa en caché', async () => {
    configurar({ estaSincronizado: () => false });
    const resultado = await TestBed.runInInjectionContext(() => rolGuard(['ADMIN'])({} as any, {} as any));
    expect(resultado).not.toBe(true);
    expect(authStoreMock.sincronizarConBackend).not.toHaveBeenCalled();
  });

  it('si hay cuenta MSAL en caché pero no sincronizada, sincroniza antes de decidir', async () => {
    configurar({ estaSincronizado: () => false, rolClave: () => 'ADMIN' });
    msalMock.instance.getActiveAccount = () => ({ idTokenClaims: { jobTitle: 'Administrador' } });

    const resultado = await TestBed.runInInjectionContext(() => rolGuard(['ADMIN'])({} as any, {} as any));

    expect(authStoreMock.sincronizarConBackend).toHaveBeenCalledTimes(1);
    expect(resultado).toBe(true);
  });
});
