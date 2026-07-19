import { Routes } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';
import { rolGuard } from './core/guards/rol.guard';
import { Login } from './pages/login/login';
import { RecuperarPassword } from './pages/recuperar-password/recuperar-password';
import { CrearUsuario } from './pages/admin/crear-usuario/crear-usuario';
import { CrearPaciente } from './pages/admin/crear-paciente/crear-paciente';
import { Auditoria } from './pages/admin/auditoria/auditoria';
import { SignosVitalesFamiliar } from './pages/familiar/signos-vitales/signos-vitales';
import { Pacientes } from './pages/medico/pacientes/pacientes';
import { PacienteDetalle } from './pages/medico/paciente-detalle/paciente-detalle';
import { Historico } from './pages/medico/historico/historico';
import { Umbrales } from './pages/medico/umbrales/umbrales';

export const routes: Routes = [
  { path: '', component: Login },
  { path: 'recuperar-password', component: RecuperarPassword },
  {
    path: 'admin',
    canActivate: [MsalGuard, rolGuard(['ADMIN'])],
    children: [
      { path: '', redirectTo: 'usuarios', pathMatch: 'full' },
      { path: 'usuarios', component: CrearUsuario },
      { path: 'pacientes', component: CrearPaciente },
      { path: 'auditoria', component: Auditoria }
    ]
  },
  {
    path: 'medico',
    canActivate: [MsalGuard, rolGuard(['MEDICO'])],
    children: [
      { path: '', redirectTo: 'pacientes', pathMatch: 'full' },
      { path: 'pacientes', component: Pacientes },
      { path: 'pacientes/:id', component: PacienteDetalle },
      { path: 'pacientes/:id/historico', component: Historico },
      { path: 'pacientes/:id/umbrales', component: Umbrales }
    ]
  },
  {
    path: 'familiar',
    canActivate: [MsalGuard, rolGuard(['FAMILIAR'])],
    children: [
      { path: '', redirectTo: 'signos-vitales', pathMatch: 'full' },
      { path: 'signos-vitales', component: SignosVitalesFamiliar }
    ]
  },
  { path: '**', redirectTo: '' },
];
