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
            clientId: 'bbc1023b-e89e-4fd1-925c-141f8d7d148c',
            authority: 'https://pulsocareduoc.b2clogin.com/pulsocareduoc.onmicrosoft.com/B2C_1_SIGN_IN',
            knownAuthorities: ['pulsocareduoc.b2clogin.com'],
            redirectUri: 'https://main.d3kr9b0z736ylh.amplifyapp.com'
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
            ['https://c7ja6bpsz3.execute-api.us-east-1.amazonaws.com/api', ['bbc1023b-e89e-4fd1-925c-141f8d7d148c']]
          ])
        }
      )
    ),
    MsalService,
    MsalGuard,
    MsalBroadcastService
  ]
};
