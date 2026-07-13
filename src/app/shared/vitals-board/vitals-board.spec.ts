import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VitalsBoard } from './vitals-board';
import { ConsultasService } from '../../core/services/consultas.service';
import { PacienteDTO } from '../../core/models/paciente.dto';
import { AlertaDTO, LecturaDTO } from '../../core/models/consultas.dto';

describe('VitalsBoard', () => {
  let fixture: ComponentFixture<VitalsBoard>;
  let component: VitalsBoard;
  let consultasMock: {
    ultimas: ReturnType<typeof vi.fn>;
    alertas: ReturnType<typeof vi.fn>;
    umbrales: ReturnType<typeof vi.fn>;
  };

  const paciente: PacienteDTO = {
    idPaciente: 1,
    subjectId: 1,
    nombre: 'Rosa',
    apellidoPaterno: 'Fuentealba',
    apellidoMaterno: 'Soto',
    fechaNacimiento: '1948-02-10',
    sexo: 'F',
    idComuna: null,
    idModalidad: 1,
    idEstadoPaciente: 1,
  };

  const lecturas: LecturaDTO[] = [
    {
      idLectura: 1,
      idPaciente: 1,
      idSignoVital: 1,
      signoCodigo: 'FC',
      signoNombre: 'FC',
      valorNum: 78,
      unidad: 'bpm',
      fechaMedicion: '',
      fechaRegistro: '',
      origen: '',
    },
  ];

  // Vacía la cola de microtareas bajo el control de los fake timers: es lo único
  // que demostró ser confiable para dejar que el Promise.all() de cargarTodo()
  // termine antes de revisar el estado del componente.
  async function esperarCarga() {
    await vi.advanceTimersByTimeAsync(0);
  }

  beforeEach(async () => {
    vi.useFakeTimers();

    consultasMock = {
      ultimas: vi.fn().mockResolvedValue(lecturas),
      alertas: vi.fn().mockResolvedValue([]),
      umbrales: vi.fn().mockResolvedValue([]),
    };

    await TestBed.configureTestingModule({
      imports: [VitalsBoard],
      providers: [{ provide: ConsultasService, useValue: consultasMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(VitalsBoard);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('paciente', paciente);
    fixture.detectChanges();
    await esperarCarga();
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    vi.useRealTimers();
  });

  it('debe pedir las últimas lecturas, alertas y umbrales del paciente al iniciar', () => {
    expect(consultasMock.ultimas).toHaveBeenCalledWith(1);
    expect(consultasMock.alertas).toHaveBeenCalledWith(1);
    expect(consultasMock.umbrales).toHaveBeenCalledWith(1);
  });

  it('debe mostrar las lecturas recibidas y ocultar el estado de carga', () => {
    expect(component.cargando()).toBe(false);
    expect(component.lecturas()).toEqual(lecturas);
  });

  it('si el backend no devuelve lecturas, debe mostrarse el mensaje de "sin lecturas"', async () => {
    consultasMock.ultimas.mockResolvedValue([]);

    const otraFixture = TestBed.createComponent(VitalsBoard);
    otraFixture.componentRef.setInput('paciente', { ...paciente, idPaciente: 2 });
    otraFixture.detectChanges();
    await esperarCarga();
    otraFixture.detectChanges();

    expect(otraFixture.nativeElement.textContent).toContain('Aún no hay lecturas registradas');
    otraFixture.destroy();
  });

  it('debe refrescar automáticamente después del intervalo de polling (8 s)', async () => {
    consultasMock.ultimas.mockClear();
    await vi.advanceTimersByTimeAsync(8000);
    expect(consultasMock.ultimas).toHaveBeenCalled();
  });

  it('debe marcar estado "critico" si alguna lectura supera el umbral crítico', async () => {
    consultasMock.ultimas.mockResolvedValue([
      { ...lecturas[0], idPaciente: 3, valorNum: 130 },
    ]);

    const otraFixture = TestBed.createComponent(VitalsBoard);
    otraFixture.componentRef.setInput('paciente', { ...paciente, idPaciente: 3 });
    otraFixture.detectChanges();
    await esperarCarga();
    otraFixture.detectChanges();

    expect(otraFixture.componentInstance.estado()).toBe('critico');
    otraFixture.destroy();
  });
});
