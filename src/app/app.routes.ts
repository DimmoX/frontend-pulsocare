import { Routes } from '@angular/router';
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

  { path: 'admin', redirectTo: 'admin/usuarios', pathMatch: 'full' },
  { path: 'admin/usuarios', component: CrearUsuario },
  { path: 'admin/usuarios/nuevo', redirectTo: 'admin/usuarios', pathMatch: 'full' },
  { path: 'admin/pacientes', component: CrearPaciente },

  { path: 'familiar/signos-vitales', component: SignosVitalesFamiliar },

  { path: 'medico/pacientes', component: Pacientes },
  { path: 'medico/pacientes/:id', component: PacienteDetalle },

  { path: '**', redirectTo: '' },
];
