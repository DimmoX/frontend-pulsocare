import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { MsalBroadcastService, MsalService } from '@azure/msal-angular';
import { EventMessage, EventType, AuthenticationResult, AuthError, AccountInfo } from '@azure/msal-browser';
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
        next: (result) => {
          // Caso 1: volvimos de un login (result trae la cuenta)
          if (result?.account) {
            this.procesarSesion(result.account, result.idTokenClaims as Record<string, any>);
            return;
          }
          // Caso 2: ya habia sesion activa (recarga de pagina)
          const cuenta = this.authService.instance.getActiveAccount()
            ?? this.authService.instance.getAllAccounts()[0];
          if (cuenta) {
            this.procesarSesion(cuenta, cuenta.idTokenClaims as Record<string, any>);
          }
        },
        error: (error: any) => {
          if (error?.message?.includes('AADB2C90118')) {
            this.authService.loginRedirect({ authority: this.passwordResetAuthority, scopes: ['openid'] });
          }
        }
      });
    });
  }

  private async procesarSesion(account: AccountInfo, claims: Record<string, any>): Promise<void> {
    this.authService.instance.setActiveAccount(account);
    console.log('El puesto del usuario es: ', claims?.['jobTitle']);
    try {
      await this.authStore.sincronizarConBackend(claims);
      this.router.navigateByUrl(ROL_A_RUTA[this.authStore.rolClave() ?? 'FAMILIAR']);
    } catch (error) {
      console.error('No se pudo sincronizar: ', error);
      this.router.navigateByUrl(ROL_A_RUTA[rolDesdeJobTitle(claims?.['jobTitle'])]);
    }
  }
}
