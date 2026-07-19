import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { MsalBroadcastService, MsalService } from '@azure/msal-angular';
import { EventMessage, EventType, AuthenticationResult, AccountInfo } from '@azure/msal-browser';
import { filter } from 'rxjs';
import { AuthStore } from './core/services/auth.store';
import { ROL_A_RUTA, rolDesdeJobTitle } from './core/auth/roles.config';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  private msalBroadcastService = inject(MsalBroadcastService);
  private authService = inject(MsalService);
  private authStore = inject(AuthStore);
  private router = inject(Router);

  private passwordResetAuthority = 'https://pulsocareduoc.b2clogin.com/pulsocareduoc.onmicrosoft.com/B2C_1_PASS_RESET';

  ngOnInit(): void {

    this.msalBroadcastService.msalSubject$
    .pipe(filter((msg: EventMessage) => msg.eventType === EventType.LOGIN_SUCCESS))
    .subscribe((result) => {
      const payload = result.payload as AuthenticationResult;
      this.procesarSesion(payload.account as AccountInfo, payload.idTokenClaims as Record<string, any>, true);
    });

    this.authService.initialize().subscribe(() => {
      // navigateToLoginRequestUrl: al cerrar sesion, B2C devuelve a la app con un
      // ?state= pegado en la URL. Con el default (true), MSAL guarda esa URL
      // contaminada como "login request url" y, tras autenticar, navega de vuelta a
      // ella y reprocesa ese state viejo -> ClientAuthError: state_mismatch, y ya no
      // se puede volver a entrar. Aqui no hace falta que MSAL navegue: procesarSesion
      // decide el destino segun el rol (ROL_A_RUTA).
      this.authService.handleRedirectObservable({ navigateToLoginRequestUrl: false }).subscribe({
        next: (result) => {

          if (result?.account) {
            // Caso 1: acaba de volver de Azure B2C -> sí navegamos a su rol.
            this.procesarSesion(result.account, result.idTokenClaims as Record<string, any>, true);
            return;
          }

          const cuenta =
            this.authService.instance.getActiveAccount() ?? this.authService.instance.getAllAccounts()[0];

          if (cuenta) {
            // Caso 2: solo sincronizamos AuthStore; NO navegamos para no sacar
            // al usuario de la ruta que estaba pidiendo (ej. un deep link).
            this.procesarSesion(cuenta, cuenta.idTokenClaims as Record<string, any>, false);
          } else {
          }
        },
        error: (error: any) => {
          if (error?.message?.includes('AADB2C90118')) {
            this.authService.loginRedirect({ authority: this.passwordResetAuthority, scopes: ['openid'] });
          }
        },
      });
    });
  }

  private async procesarSesion(account: AccountInfo, claims: Record<string, any>, navegar: boolean): Promise<void> {
    this.authService.instance.setActiveAccount(account);


    try {
      const usuario = await this.authStore.sincronizarConBackend(claims);

      if (navegar) {
        this.router.navigateByUrl(ROL_A_RUTA[this.authStore.rolClave() ?? 'FAMILIAR']);
      }
    } catch (error) {
      // Antes se navegaba igual, deduciendo el rol del token. Eso dejaba el acceso
      // dependiendo por completo de que TODAS las rutas tuvieran rolGuard: si a una
      // le faltara, una cuenta desactivada entraria. Ahora se cierra la sesion y se
      // explica el motivo, que ademas es lo unico honesto que puede verse en pantalla.
      this.authStore.cerrarSesionLocal();
      this.authStore.motivoRechazo.set(this.motivoDe(error));
      if (navegar) {
        this.router.navigateByUrl('/');
      }
    }
  }

  /** 403 es la cuenta dada de baja; cualquier otro fallo es un problema del servicio. */
  private motivoDe(error: unknown): string {
    const estado = (error as { status?: number })?.status;
    if (estado === 403) {
      return 'Tu cuenta está desactivada. Comunícate con el administrador de la plataforma.';
    }
    return 'No se pudo validar tu sesión. Inténtalo de nuevo en unos minutos.';
  }
}
