import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { MsalBroadcastService, MsalService } from '@azure/msal-angular';
import { EventMessage, EventType, AuthenticationResult, AuthError } from '@azure/msal-browser';
import { filter } from 'rxjs';
import { AuthStore } from './core/services/auth.store';
import { ROL_A_RUTA, rolDesdeJobTitle } from './core/auth/roles.config';

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
    this.authService.initialize().subscribe(() => {
      this.authService.handleRedirectObservable().subscribe({
        next: () => {},
        error: (error: any) => {
          // Si el usuario hizo clic en "¿Olvidó su contraseña?"
          if (error?.message?.includes('AADB2C90118')) {
            this.authService.loginRedirect({
              authority: this.passwordResetAuthority,
              scopes: ['openid']
            });
          }
        }
      });

      this.msalBroadcastService.msalSubject$
        .pipe(
          filter((msg: EventMessage) => msg.eventType === EventType.LOGIN_SUCCESS)
        )
        .subscribe(async (result: EventMessage) => {
          const payload = result.payload as AuthenticationResult;
          this.authService.instance.setActiveAccount(payload.account);
          const claims = payload.idTokenClaims as Record<string, any>;

          const puesto = claims?.['jobTitle'] as string;
          console.log('El puesto del usuario es: ', puesto);

          try {
            await this.authStore.sincronizarConBackend(claims);
            this.router.navigateByUrl(ROL_A_RUTA[this.authStore.rolClave() ?? 'FAMILIAR']);
          } catch (error) {
            console.error('No se pudo sincronizar correctamente, error de token o de backend: ', error);
            this.router.navigateByUrl(ROL_A_RUTA[rolDesdeJobTitle(claims?.['jobTitle'])]);
          }
        })
    })
  }
}
