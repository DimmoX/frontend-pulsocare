import { ApplicationConfig, importProvidersFrom, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { MsalModule, MsalGuard, MsalService, MsalBroadcastService } from '@azure/msal-angular';
import { tokenInterceptor } from './core/auth/token.interceptor';
import { PublicClientApplication, InteractionType } from '@azure/msal-browser';
import { environment } from '../environments/environment';

/**
 * Identificador de la aplicacion registrada en Azure AD B2C.
 */
const CLIENT_ID = 'bbc1023b-e89e-4fd1-925c-141f8d7d148c';

/**
 * Scope de la API expuesta en B2C.
 *
 * Antes aqui iba el CLIENT_ID como scope. En Azure AD normal ese atajo devuelve un
 * token para uno mismo, pero en B2C NO: MSAL se quedaba sin access token y las
 * llamadas salian sin cabecera Authorization. Como el gateway no validaba nada, el
 * problema pasaba inadvertido; ahora que exige token, hace falta el scope real de la
 * API declarada en "Exponer una API".
 */
export const SCOPE_API = 'https://pulsocareduoc.onmicrosoft.com/pulsocare-api/acceso.total';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([tokenInterceptor])),


    importProvidersFrom(
      MsalModule.forRoot(
        new PublicClientApplication ({
          auth: {
            clientId: CLIENT_ID,
            authority: 'https://pulsocareduoc.b2clogin.com/pulsocareduoc.onmicrosoft.com/B2C_1_SIGN_IN',
            knownAuthorities: ['pulsocareduoc.b2clogin.com'],
            // El registro de B2C tiene habilitadas la URL de Amplify y la de
            // localhost:4200; se envia la del origen desde el que se abrio la app.
            redirectUri: `${window.location.origin}/`,
            postLogoutRedirectUri: `${window.location.origin}/`
          },
          cache: {
            cacheLocation: 'localStorage'
          }
        }),
        {
          interactionType: InteractionType.Redirect,
          // Se pide el scope de la API ya en el login, para que MSAL guarde el access
          // token de entrada y no tenga que ir a buscarlo en la primera llamada.
          authRequest: { scopes: ['openid', 'profile', SCOPE_API] }
        },
        {
          interactionType: InteractionType.Redirect,
          protectedResourceMap: new Map([
            [`${environment.apiUrl}/`, [SCOPE_API]]
          ])
        }
      )
    ),
    MsalService,
    MsalGuard,
    MsalBroadcastService
  ]
};

