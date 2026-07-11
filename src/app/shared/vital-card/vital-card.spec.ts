import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VitalCard } from './vital-card';
import { LecturaDTO } from '../../core/models/consultas.dto';
import { UmbralDTO } from '../../core/models/umbral.dto';

describe('VitalCard', () => {
  let fixture: ComponentFixture<VitalCard>;
  let component: VitalCard;

  const lecturaBase: LecturaDTO = {
    idLectura: 1,
    idPaciente: 1,
    idSignoVital: 1,
    signoCodigo: 'FC',
    signoNombre: 'Frecuencia cardiaca',
    valorNum: 78,
    unidad: 'bpm',
    fechaMedicion: '2026-07-10T10:00:00',
    fechaRegistro: '2026-07-10T10:00:05',
    origen: 'KINESIS',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [VitalCard] }).compileComponents();
    fixture = TestBed.createComponent(VitalCard);
    component = fixture.componentInstance;
  });

  function conLectura(valorNum: number, umbral: UmbralDTO | null = null) {
    fixture.componentRef.setInput('lectura', { ...lecturaBase, valorNum });
    fixture.componentRef.setInput('umbral', umbral);
    fixture.detectChanges();
  }

  it('sin umbral: un valor dentro del catálogo local debe quedar en "ok"', () => {
    conLectura(78); // FC normal: 60-100
    expect(component.estado()).toBe('ok');
  });

  it('sin umbral: un valor cerca del borde debe quedar en "alerta"', () => {
    conLectura(96); // margen 8, límite superior 100 → alerta desde 92
    expect(component.estado()).toBe('alerta');
  });

  it('sin umbral: un valor fuera del rango debe quedar en "critico"', () => {
    conLectura(115);
    expect(component.estado()).toBe('critico');
  });

  it('con umbral: usa valorMin/valorMax y valorMinCritico/valorMaxCritico en vez del catálogo', () => {
    const umbral: UmbralDTO = {
      idUmbral: 1,
      idPaciente: 1,
      idSignoVital: 1,
      valorMin: 70,
      valorMax: 90,
      valorMinCritico: 50,
      valorMaxCritico: 120,
      vigente: 1,
      vigenteDesde: '2026-01-01T00:00:00',
      idDefinidoPor: 4,
    };

    conLectura(80, umbral);
    expect(component.estado()).toBe('ok');

    conLectura(95, umbral); // fuera de [70,90] pero dentro de [50,120]
    expect(component.estado()).toBe('alerta');

    conLectura(130, umbral); // fuera de valorMaxCritico
    expect(component.estado()).toBe('critico');
  });

  it('un signoCodigo desconocido no debe romper el componente (usa definición de respaldo)', () => {
    fixture.componentRef.setInput('lectura', { ...lecturaBase, signoCodigo: 'XYZ', valorNum: 10 });
    fixture.componentRef.setInput('umbral', null);
    fixture.detectChanges();
    expect(component.definicion().etiqueta).toBe('XYZ');
  });
});
