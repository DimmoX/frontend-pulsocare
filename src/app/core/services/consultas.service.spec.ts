import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ConsultasService } from './consultas.service';
import { environment } from '../../../environments/environment';

describe('ConsultasService', () => {
  let service: ConsultasService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ConsultasService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('ultimas() debe pedir GET /pacientes/{id}/lecturas/ultimas', async () => {
    const promesa = service.ultimas(5);
    const req = httpMock.expectOne(`${environment.apiUrl}/pacientes/5/lecturas/ultimas`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
    await expect(promesa).resolves.toEqual([]);
  });

  it('historico() debe incluir idSignoVital y limite como query params', async () => {
    const promesa = service.historico(5, 1, 20);
    const req = httpMock.expectOne(
      (r) =>
        r.url === `${environment.apiUrl}/pacientes/5/lecturas` &&
        r.params.get('idSignoVital') === '1' &&
        r.params.get('limite') === '20'
    );
    expect(req.request.method).toBe('GET');
    req.flush([]);
    await promesa;
  });

  it('alertas() debe pedir GET /alertas?idPaciente=', async () => {
    const promesa = service.alertas(5);
    const req = httpMock.expectOne(
      (r) => r.url === `${environment.apiUrl}/alertas` && r.params.get('idPaciente') === '5'
    );
    req.flush([]);
    await promesa;
  });

  it('reconocer() debe hacer PUT /alertas/{id}/reconocer con el idUsuario', async () => {
    const promesa = service.reconocer(9, 3);
    const req = httpMock.expectOne(`${environment.apiUrl}/alertas/9/reconocer`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ idUsuario: 3 });
    req.flush({});
    await promesa;
  });

  it('umbrales() debe pedir GET /umbrales?idPaciente=', async () => {
    const promesa = service.umbrales(5);
    const req = httpMock.expectOne(
      (r) => r.url === `${environment.apiUrl}/umbrales` && r.params.get('idPaciente') === '5'
    );
    req.flush([]);
    await promesa;
  });

  it('debe propagar el error si la petición de alertas falla (500)', async () => {
    const promesa = service.alertas(5);
    const req = httpMock.expectOne((r) => r.url === `${environment.apiUrl}/alertas`);
    req.flush('error', { status: 500, statusText: 'Server Error' });
    await expect(promesa).rejects.toBeTruthy();
  });
});
