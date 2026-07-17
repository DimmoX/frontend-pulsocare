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
    // --- DEBUG 1: ¿qué apiUrl quedó realmente compilada en este build? ---
    console.log('[DEBUG] apiUrl configurada:', environment.apiUrl);
    console.log('[DEBUG] production flag:', environment.production);

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
          // --- DEBUG 2: ¿MSAL procesó un redirect recién, o no hay nada pendiente? ---
          console.log('[DEBUG] resultado de handleRedirectObservable:', result);

          if (result?.account) {
            // Caso 1: acaba de volver de Azure B2C -> sí navegamos a su rol.
            this.procesarSesion(result.account, result.idTokenClaims as Record<string, any>, true);
            return;
          }

          const cuenta =
            this.authService.instance.getActiveAccount() ?? this.authService.instance.getAllAccounts()[0];

          if (cuenta) {
            // --- DEBUG 3: sesión ya existente en caché (recarga de página) ---
            console.log('[DEBUG] sesión en caché encontrada:', cuenta.username);
            // Caso 2: solo sincronizamos AuthStore; NO navegamos para no sacar
            // al usuario de la ruta que estaba pidiendo (ej. un deep link).
            this.procesarSesion(cuenta, cuenta.idTokenClaims as Record<string, any>, false);
          } else {
            console.log('[DEBUG] no hay cuenta activa ni en caché: usuario no autenticado.');
          }
        },
        error: (error: any) => {
          // --- DEBUG 4: cualquier error de MSAL al procesar el redirect ---
          console.error('[DEBUG] Error en handleRedirectObservable:', error);
          if (error?.message?.includes('AADB2C90118')) {
            this.authService.loginRedirect({ authority: this.passwordResetAuthority, scopes: ['openid'] });
          }
        },
      });
    });
  }

  private async procesarSesion(account: AccountInfo, claims: Record<string, any>, navegar: boolean): Promise<void> {
    this.authService.instance.setActiveAccount(account);

    // --- DEBUG 5: qué trae el token de Entra ID ---
    console.log('[DEBUG] jobTitle recibido:', claims?.['jobTitle']);
    console.log('[DEBUG] claims completos:', claims);

    try {
      const usuario = await this.authStore.sincronizarConBackend(claims);
      // --- DEBUG 6: qué devolvió ms-auth al sincronizar ---
      console.log('[DEBUG] usuario sincronizado con ms-auth:', usuario);

      if (navegar) {
        this.router.navigateByUrl(ROL_A_RUTA[this.authStore.rolClave() ?? 'FAMILIAR']);
      }
    } catch (error) {
      // --- DEBUG 7: el error exacto si falla la llamada al backend ---
      console.error('[DEBUG] Falló la sincronización con el backend:', error);
      if (navegar) {
        this.router.navigateByUrl(ROL_A_RUTA[rolDesdeJobTitle(claims?.['jobTitle'])]);
      }
    }
  }
}
