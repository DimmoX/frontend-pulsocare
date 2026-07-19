import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { MsalService } from '@azure/msal-angular';
import { from, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Adjunta el token de Azure AD B2C a las llamadas al backend.
 *
 * Se usa el ID token y no un access token porque B2C no emite este ultimo: aunque la
 * API esta expuesta con el ambito acceso.total y el permiso concedido, al pertenecer
 * al MISMO registro que la aplicacion cliente, B2C descarta ese ambito en silencio y
 * responde solo con "openid offline_access" (verificado canjeando un codigo a mano
 * contra el endpoint de token de B2C).
 *
 * La validacion en el gateway es igual de estricta: el ID token viene firmado en
 * RS256, se comprueba contra el JWKS de B2C, y su "aud" es el clientId y su "iss" el
 * tenant, que es exactamente lo que el resource server exige. Si en el futuro la API
 * se registra como una aplicacion aparte en B2C, esto se reemplaza por el
 * MsalInterceptor y el gateway no cambia.
 */
export const tokenInterceptor: HttpInterceptorFn = (peticion, siguiente) => {
  const msal = inject(MsalService);

  // Solo al backend propio: mandar el token a otro host seria filtrar la credencial
  // del usuario a un tercero.
  if (!peticion.url.startsWith(environment.apiUrl)) {
    return siguiente(peticion);
  }

  const cuenta = msal.instance.getActiveAccount() ?? msal.instance.getAllAccounts()[0];
  if (!cuenta) {
    // Sin sesion la peticion sale sin cabecera y el gateway respondera 401. Decide el
    // backend, no el navegador.
    return siguiente(peticion);
  }

  const conToken = (token?: string) =>
    token ? peticion.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : peticion;

  // acquireTokenSilent renueva el token si esta por vencer; la propiedad idToken de la
  // cuenta es solo el respaldo, porque MSAL no siempre la rellena al restaurar cache.
  return from(
    msal.instance
      .acquireTokenSilent({ scopes: ['openid', 'profile'], account: cuenta })
      .then((r) => r.idToken || cuenta.idToken)
      .catch(() => cuenta.idToken)
  ).pipe(switchMap((token) => siguiente(conToken(token))));
};
