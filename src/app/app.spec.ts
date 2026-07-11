import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { MsalBroadcastService, MsalService } from '@azure/msal-angular';
import { EventType } from '@azure/msal-browser';
import { Subject } from 'rxjs';
import { App } from './app';
import { AuthStore } from './core/services/auth.store';

describe('App', () => {
  let msalBroadcastMock: { msalSubject$: Subject<any> };
  let msalServiceMock: any;
  let authStoreMock: any;

  beforeEach(async () => {
    msalBroadcastMock = { msalSubject$: new Subject() };
    msalServiceMock = {
      initialize: vi.fn().mockReturnValue({ subscribe: (fn: any) => fn() }),
      handleRedirectObservable: vi.fn().mockReturnValue({ subscribe: (observer: any) => observer.next?.(null) }),
      instance: { setActiveAccount: vi.fn() },
      loginRedirect: vi.fn(),
    };
    authStoreMock = {
      sincronizarConBackend: vi.fn().mockResolvedValue({ rol: 'Familiar' }),
      rolClave: () => 'FAMILIAR',
    };

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        { provide: MsalBroadcastService, useValue: msalBroadcastMock },
        { provide: MsalService, useValue: msalServiceMock },
        { provide: AuthStore, useValue: authStoreMock },
      ],
    }).compileComponents();
  });

  it('debe crearse correctamente', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('debe renderizar el router-outlet', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('router-outlet')).toBeTruthy();
  });

  it('tras un LOGIN_SUCCESS, debe sincronizar con el backend y navegar según el rol devuelto', async () => {
    const router = TestBed.inject(Router);
    const navegarSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    msalBroadcastMock.msalSubject$.next({
      eventType: EventType.LOGIN_SUCCESS,
      payload: { account: { username: 'rosa@pulsocare.cl' }, idTokenClaims: { jobTitle: 'Familiar', name: 'Rosa' } },
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(authStoreMock.sincronizarConBackend).toHaveBeenCalled();
    expect(navegarSpy).toHaveBeenCalledWith('/familiar/signos-vitales');
  });

  it('si ms-auth falla al sincronizar, debe navegar igual usando el rol del token como respaldo', async () => {
    authStoreMock.sincronizarConBackend.mockRejectedValue(new Error('backend caído'));

    const router = TestBed.inject(Router);
    const navegarSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    msalBroadcastMock.msalSubject$.next({
      eventType: EventType.LOGIN_SUCCESS,
      payload: { account: {}, idTokenClaims: { jobTitle: 'Medico', name: 'Dr. X' } },
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(navegarSpy).toHaveBeenCalledWith('/medico/pacientes');
  });
});
