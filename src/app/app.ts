import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { MsalBroadcastService, MsalService } from '@azure/msal-angular';
import { EventMessage, EventType, AuthenticationResult, AuthError } from '@azure/msal-browser';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  private msalBroadcastService = inject(MsalBroadcastService);
  private authService = inject(MsalService);
  private router = inject(Router);

  private passwordResetAuthority = 'https://pulsocareduoc.b2clogin.com/pulsocareduoc.onmicrosoft.com/B2C_1_PASS_RESET';

  ngOnInit(): void {
    this.authService.initialize().subscribe(() => {

      this.authService.handleRedirectObservable().subscribe({
        next: () => {},
        error: (error: any) => {
          // Si el usuario hizo clic en "¿Olvidó su contraseña?"
          if (error && error.message && error.message.includes('AADB2C90118')) {
            console.log('Atrapado click de reseteo. Redirigiendo al flujo...');

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
        .subscribe((result: EventMessage) => {
          const payload = result.payload as AuthenticationResult;

          console.log('Token de Acceso: ' ,payload.accessToken);
          console.log('ID Token (Claims): ', payload.idTokenClaims)

          this.authService.instance.setActiveAccount(payload.account);

          const claims = payload.idTokenClaims as Record<string, any>;

          const puesto = claims?.['jobTitle'] as string;
          console.log('El puesto del usuario es: ', puesto);

          if (puesto === 'Administrador') {
            this.router.navigateByUrl('/admin/usuarios');
          } else if (puesto === 'Médico') {
            this.router.navigateByUrl('/medico/pacientes');
          } else {
            this.router.navigateByUrl('/familiar/signos-vitales');
          }
        })
    })
  }
}
