import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UsuarioDTO } from '../models/usuario.dto';
import { claveDesdeNombreRol, ROL_A_ID_ROL, RolClave, rolDesdeJobTitle } from '../auth/roles.config';

interface ClaimsEntraId {
  oid?: string;
  sub?: string;
  name?: string;
  emails?: string[];
  preferred_username?: string;
  jobTitle?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  /** null hasta que se complete el primer login de la sesión. */
  usuario = signal<UsuarioDTO | null>(null);
  rolClave = computed<RolClave | null>(() => claveDesdeNombreRol(this.usuario()?.rol));
  estaSincronizado = computed(() => this.usuario() !== null);

  /** Se llama una vez por sesión, justo después del LOGIN_SUCCESS de MSAL. */
  async sincronizarConBackend(claims: ClaimsEntraId): Promise<UsuarioDTO> {
    const rolClave = rolDesdeJobTitle(claims.jobTitle);

    const payload = {
      displayName: claims.name ?? 'Usuario PulsoCare',
      correo: claims.preferred_username ?? claims.emails?.[0] ?? '',
      // ms-auth exige "pass" (@NotBlank) aunque quien autentica de verdad es Entra ID;
      // se envía un valor aleatorio que nunca se usará para iniciar sesión por /api/auth/login.
      pass: crypto.randomUUID(),
      entraOid: claims.oid ?? claims.sub,
      idRol: ROL_A_ID_ROL[rolClave],
    };

    const usuario = await firstValueFrom(
      this.http.post<UsuarioDTO>(`${this.apiUrl}/auth/registro`, payload)
    );
    this.usuario.set(usuario);
    return usuario;
  }

  cerrarSesionLocal(): void {
    this.usuario.set(null);
  }
}
