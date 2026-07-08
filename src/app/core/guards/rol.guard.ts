import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { MsalService } from '@azure/msal-angular';
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
      const cuenta = msal.instance.getActiveAccount();
      if (!cuenta) {
        return router.parseUrl('/'); // MsalGuard, que corre antes, ya gatilla el login.
      }
      await authStore.sincronizarConBackend(cuenta.idTokenClaims as any);
    }

    const rolActual = authStore.rolClave();
    return rolActual && rolesPermitidos.includes(rolActual) ? true : router.parseUrl('/');
  };
}
