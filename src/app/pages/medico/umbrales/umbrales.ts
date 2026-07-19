import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideInfo, lucideRotateCcw, lucideTriangleAlert } from '@ng-icons/lucide';
import { AdminStore } from '../../admin/admin-store';
import { AuthStore } from '../../../core/services/auth.store';
import { ConsultasService } from '../../../core/services/consultas.service';
import { definicionSigno, SIGNOS_MONITOREADOS } from '../../../core/models/consultas.dto';
import { UmbralDTO } from '../../../core/models/umbral.dto';
import { Topbar } from '../../../shared/topbar/topbar';

/** Lo que se edita en pantalla para un signo. */
interface FilaUmbral {
  idSignoVital: number;
  codigo: string;
  etiqueta: string;
  /** null mientras el paciente use el rango por defecto. */
  idUmbral: number | null;
  min: number | null;
  max: number | null;
  minCritico: number | null;
  maxCritico: number | null;
  /** Rango poblacional, para mostrar de que se esta apartando el medico. */
  porDefecto: { min: number; max: number };
  guardando: boolean;
  error: string | null;
  guardado: boolean;
}

@Component({
  selector: 'app-umbrales',
  imports: [Topbar, FormsModule, NgIcon],
  viewProviders: [provideIcons({ lucideInfo, lucideRotateCcw, lucideTriangleAlert })],
  template: `
    @if (paciente(); as p) {
      <app-topbar
        titulo="Límites de alarma"
        [subtitulo]="p.nombre + ' ' + p.apellidoPaterno + ' ' + p.apellidoMaterno"
        [usuario]="nombreUsuario()"
        rol="Médico"
        [volverA]="'/medico/pacientes/' + p.idPaciente"
        (cerrarSesion)="cerrarSesion()"
      />

      <main class="max-w-6xl mx-auto p-7 flex flex-col gap-5">
        <div class="flex items-start gap-2.5 p-4 px-5 rounded-2xl bg-[var(--color-surface-sunken)] border border-[var(--color-border)] text-sm text-[var(--color-ink-soft)]">
          <ng-icon name="lucideInfo" size="18" class="mt-0.5 shrink-0" />
          <span>
            Los valores por defecto son rangos de referencia poblacionales y no aplican a
            todos los pacientes: alguien con EPOC vive con una saturación de 88–92, y
            alarmar bajo 95 solo genera avisos que nadie atiende. Ajustar estos límites
            cambia cuándo se genera una alerta,
            <strong class="text-[var(--color-ink)]">queda registrado en la bitácora a tu nombre</strong>
            y se aplica al monitoreo en el minuto siguiente.
          </span>
        </div>

        @if (cargando()) {
          <p class="text-sm text-[var(--color-ink-soft)]">Cargando límites…</p>
        } @else {
          <div class="overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
            <table class="w-full border-collapse text-sm min-w-3xl">
              <thead>
                <tr class="text-left text-xs uppercase tracking-wider text-[var(--color-ink-soft)] border-b border-[var(--color-border)]">
                  <th class="p-4 font-semibold">Signo vital</th>
                  <th class="p-4 font-semibold">Mín. normal</th>
                  <th class="p-4 font-semibold">Máx. normal</th>
                  <th class="p-4 font-semibold">Mín. crítico</th>
                  <th class="p-4 font-semibold">Máx. crítico</th>
                  <th class="p-4 font-semibold text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                @for (f of filas(); track f.idSignoVital) {
                  <tr class="border-b border-[var(--color-border)] last:border-0 align-top">
                    <td class="p-4">
                      <div class="font-semibold text-[var(--color-ink)]">{{ f.etiqueta }}</div>
                      <div class="text-xs text-[var(--color-ink-soft)] mt-0.5">
                        @if (f.idUmbral) {
                          Personalizado · por defecto {{ f.porDefecto.min }}–{{ f.porDefecto.max }}
                        } @else {
                          Usando el rango por defecto
                        }
                      </div>
                      @if (f.error) {
                        <div class="flex items-start gap-1 mt-1.5 text-xs text-[var(--color-status-critical)]">
                          <ng-icon name="lucideTriangleAlert" size="13" class="mt-0.5 shrink-0" />
                          <span>{{ f.error }}</span>
                        </div>
                      }
                      @if (f.guardado) {
                        <div class="mt-1.5 text-xs text-[var(--color-status-ok)]">Guardado.</div>
                      }
                    </td>
                    <td class="p-4"><input type="number" [(ngModel)]="f.min" [class]="claseInput" /></td>
                    <td class="p-4"><input type="number" [(ngModel)]="f.max" [class]="claseInput" /></td>
                    <td class="p-4"><input type="number" [(ngModel)]="f.minCritico" [class]="claseInput" /></td>
                    <td class="p-4"><input type="number" [(ngModel)]="f.maxCritico" [class]="claseInput" /></td>
                    <td class="p-4">
                      <div class="flex items-center justify-end gap-2">
                        @if (f.idUmbral) {
                          <button
                            type="button"
                            title="Volver al rango por defecto"
                            [disabled]="f.guardando"
                            (click)="restaurar(f)"
                            class="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl border border-[var(--color-border)] text-[var(--color-ink-soft)] text-xs cursor-pointer transition-colors hover:border-[var(--color-primary)]/40 disabled:opacity-50"
                          >
                            <ng-icon name="lucideRotateCcw" size="13" />
                          </button>
                        }
                        <button
                          type="button"
                          [disabled]="f.guardando"
                          (click)="guardar(f)"
                          class="px-3.5 py-2 rounded-xl bg-[var(--color-primary)] text-white font-semibold text-xs cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
                        >
                          {{ f.guardando ? 'Guardando…' : 'Guardar' }}
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <p class="m-0 text-xs text-[var(--color-ink-soft)] leading-relaxed">
            Deja un campo vacío para que ese límite use el valor por defecto. El rango
            crítico debe contener al normal: un valor no puede estar dentro de lo
            aceptable y ser crítico a la vez.
          </p>
        }
      </main>
    } @else if (cargando()) {
      <main class="max-w-6xl mx-auto p-7 flex items-center justify-center min-h-[60vh] text-[var(--color-ink-soft)]">
        <p>Cargando paciente…</p>
      </main>
    } @else {
      <main class="max-w-6xl mx-auto p-7 flex items-center justify-center min-h-[60vh] text-[var(--color-ink-soft)]">
        <p>No se encontró el paciente solicitado, o no está asignado a tu cuidado.</p>
      </main>
    }
  `,
})
export class Umbrales implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private adminStore = inject(AdminStore);
  private authStore = inject(AuthStore);
  private consultas = inject(ConsultasService);

  protected readonly claseInput =
    'w-24 px-2.5 py-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-ink)] text-sm';

  private idPacienteRuta = toSignal(this.route.paramMap.pipe(map((p) => Number(p.get('id')))), {
    initialValue: NaN,
  });

  cargando = signal(true);
  filas = signal<FilaUmbral[]>([]);

  private idUsuario = computed(() => this.authStore.usuario()?.idUsuario ?? null);

  nombreUsuario = computed(() => {
    const u = this.authStore.usuario();
    return u ? `Dr. ${u.nombre} ${u.apellidoPaterno}` : 'Médico';
  });

  paciente = computed(() => {
    const idUsuario = this.idUsuario();
    if (!idUsuario) return undefined;
    const pacientes = this.adminStore.pacientesPorUsuario()[idUsuario] ?? [];
    return pacientes.find((p) => p.idPaciente === this.idPacienteRuta());
  });

  async ngOnInit() {
    const idUsuario = this.idUsuario();
    if (idUsuario) {
      await this.adminStore.cargarPacientesDeUsuario(idUsuario);
    }
    const p = this.paciente();
    if (p) {
      await this.cargarUmbrales(p.idPaciente);
    }
    this.cargando.set(false);
  }

  private async cargarUmbrales(idPaciente: number) {
    let definidos: UmbralDTO[] = [];
    try {
      definidos = (await this.consultas.umbrales(idPaciente)).filter((u) => u.vigente === 1);
    } catch {
      // Sin umbrales propios la tabla igual sirve: se muestran los valores por defecto.
    }

    this.filas.set(
      SIGNOS_MONITOREADOS.map(({ id, codigo }) => {
        const definicion = definicionSigno(codigo);
        const propio = definidos.find((u) => u.idSignoVital === id);
        return {
          idSignoVital: id,
          codigo,
          etiqueta: definicion.etiqueta,
          idUmbral: propio?.idUmbral ?? null,
          min: propio?.valorMin ?? null,
          max: propio?.valorMax ?? null,
          minCritico: propio?.valorMinCritico ?? null,
          maxCritico: propio?.valorMaxCritico ?? null,
          porDefecto: definicion.rangoDefault,
          guardando: false,
          error: null,
          guardado: false,
        };
      })
    );
  }

  async guardar(fila: FilaUmbral) {
    const idUsuario = this.idUsuario();
    const p = this.paciente();
    if (!idUsuario || !p) return;

    this.marcar(fila, { guardando: true, error: null, guardado: false });
    const valores = {
      valorMin: this.numero(fila.min),
      valorMax: this.numero(fila.max),
      valorMinCritico: this.numero(fila.minCritico),
      valorMaxCritico: this.numero(fila.maxCritico),
      idDefinidoPor: idUsuario,
    };

    try {
      if (fila.idUmbral) {
        await this.consultas.actualizarUmbral(fila.idUmbral, valores);
      } else {
        const creado = await this.consultas.crearUmbral({
          idPaciente: p.idPaciente,
          idSignoVital: fila.idSignoVital,
          ...valores,
        });
        this.marcar(fila, { idUmbral: creado.idUmbral });
      }
      this.marcar(fila, { guardado: true });
    } catch (e: unknown) {
      this.marcar(fila, { error: this.mensajeDe(e) });
    } finally {
      this.marcar(fila, { guardando: false });
    }
  }

  async restaurar(fila: FilaUmbral) {
    const idUsuario = this.idUsuario();
    if (!idUsuario || !fila.idUmbral) return;

    this.marcar(fila, { guardando: true, error: null, guardado: false });
    try {
      await this.consultas.eliminarUmbral(fila.idUmbral, idUsuario);
      this.marcar(fila, {
        idUmbral: null,
        min: null,
        max: null,
        minCritico: null,
        maxCritico: null,
        guardado: true,
      });
    } catch (e: unknown) {
      this.marcar(fila, { error: this.mensajeDe(e) });
    } finally {
      this.marcar(fila, { guardando: false });
    }
  }

  /** Un campo vacio significa "usa el valor por defecto", no cero. */
  private numero(valor: number | null): number | null {
    return valor === null || Number.isNaN(valor) ? null : Number(valor);
  }

  /** El backend explica por que rechazo el rango; conviene mostrarle eso al medico. */
  private mensajeDe(e: unknown): string {
    const error = e as { error?: { message?: string }; message?: string };
    return error?.error?.message ?? error?.message ?? 'No se pudo guardar el límite.';
  }

  private marcar(fila: FilaUmbral, cambios: Partial<FilaUmbral>) {
    this.filas.update((filas) =>
      filas.map((f) => (f.idSignoVital === fila.idSignoVital ? { ...f, ...cambios } : f))
    );
    Object.assign(fila, cambios);
  }

  cerrarSesion() {
    this.router.navigateByUrl('/');
  }
}
