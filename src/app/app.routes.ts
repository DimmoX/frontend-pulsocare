import { Routes } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';
import { Login } from './pages/login/login';
import { RecuperarPassword } from './pages/recuperar-password/recuperar-password';
import { CrearUsuario } from './pages/admin/crear-usuario/crear-usuario';
import { CrearPaciente } from './pages/admin/crear-paciente/crear-paciente';
import { SignosVitalesFamiliar } from './pages/familiar/signos-vitales/signos-vitales';
import { Pacientes } from './pages/medico/pacientes/pacientes';
import { PacienteDetalle } from './pages/medico/paciente-detalle/paciente-detalle';

export const routes: Routes = [
  { path: '', component: Login },
  { path: 'recuperar-password', component: RecuperarPassword },
  {
    path: 'admin',
    canActivate: [MsalGuard],
    children: [
      { path: '', redirectTo: 'usuarios', pathMatch: 'full' },
      { path: 'usuarios', component: CrearUsuario },
      {path: 'pacientes', component: CrearPaciente }
    ]
  },
  {
    path: 'medico',
    canActivate: [MsalGuard],
    children: [
      { path: '', redirectTo: 'pacientes', pathMatch: 'full' },
      { path: 'pacientes', component: Pacientes },
      { path: 'pacientes/:id', component: PacienteDetalle }
    ]
  },
  {
    path: 'familiar',
    canActivate: [MsalGuard],
    children: [
      { path: '', redirectTo: 'signos-vitales', pathMatch: 'full' },
      { path: 'signos-vitales', component: SignosVitalesFamiliar }
    ]
  },
  { path: '**', redirectTo: '' },
];
