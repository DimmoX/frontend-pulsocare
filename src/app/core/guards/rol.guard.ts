import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { MsalService } from '@azure/msal-angular';
import { firstValueFrom } from 'rxjs';
import { AuthStore } from '../services/auth.store';
import { RolClave } from '../auth/roles.config';

export function rolGuard(rolesPermitidos: RolClave[]): CanActivateFn {
  return async () => {
    const authStore = inject(AuthStore);
    const msal = inject(MsalService);
    const router = inject(Router);

    // Caso normal: ya se sincronizó justo después del login en app.ts.
    if (!authStore.estaSincronizado()) {
      // Caso borde: recarga de página con sesión MSAL en caché pero sin sincronizar aún.
      // Este guard corre antes que el ngOnInit de app.ts, asi que MSAL todavia no
      // esta inicializado y no ha leido su cache: sin este initialize(), preguntar por
      // la cuenta devuelve null y se expulsa al usuario en cada recarga.
      await firstValueFrom(msal.initialize());

      // Tras una recarga nadie llamo aun a setActiveAccount(), asi que la cuenta
      // cacheada solo aparece en getAllAccounts(). Mismo criterio que usa app.ts.
      const cuenta = msal.instance.getActiveAccount() ?? msal.instance.getAllAccounts()[0];
      if (!cuenta) {
        return router.parseUrl('/'); // MsalGuard, que corre antes, ya gatilla el login.
      }
      msal.instance.setActiveAccount(cuenta);
      try {
        await authStore.sincronizarConBackend(cuenta.idTokenClaims as any);
      } catch (error) {
        // Mismo criterio que app.ts: si el backend rechaza la cuenta, se explica el
        // motivo en el inicio en vez de devolver al usuario en silencio.
        const estado = (error as { status?: number })?.status;
        authStore.motivoRechazo.set(
          estado === 403
            ? 'Tu cuenta está desactivada. Comunícate con el administrador de la plataforma.'
            : 'No se pudo validar tu sesión. Inténtalo de nuevo en unos minutos.'
        );
        return router.parseUrl('/');
      }
    }

    const rolActual = authStore.rolClave();
    return rolActual && rolesPermitidos.includes(rolActual) ? true : router.parseUrl('/');
  };
}
