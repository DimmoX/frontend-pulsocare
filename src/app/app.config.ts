import { ApplicationConfig, importProvidersFrom, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { routes } from './app.routes';
import { MsalModule, MsalInterceptor, MsalGuard, MsalService, MsalBroadcastService } from '@azure/msal-angular';
import { PublicClientApplication, InteractionType } from '@azure/msal-browser';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),

    {
      provide: HTTP_INTERCEPTORS,
      useClass: MsalInterceptor,
      multi: true
    },

    importProvidersFrom(
      MsalModule.forRoot(
        new PublicClientApplication ({
          auth: {
            clientId: '',
            authority: '',
            knownAuthorities: [''],
            redirectUri: 'http://localhost:4200'
          },
          cache: {
            cacheLocation: 'localStorage'
          }
        }),
        {
          interactionType: InteractionType.Redirect,
          authRequest: { scopes: ['openid', 'profile'] }
        },
        {
          interactionType: InteractionType.Redirect,
          protectedResourceMap: new Map([
            ['http://localhost:8080/api/', ['TU_CLIENT_ID_DE_AZURE']]
          ])
        }
      )
    ),
    MsalService,
    MsalGuard,
    MsalBroadcastService
  ]
};
