import { describe, expect, it } from 'vitest';
import { hojeISO, mesISO, ontem, segundaDaSemana, semanaAnteriorISO, semanaISO, somarDias } from './datas';
import { semanaISO as semanaISODominio } from '@/dominio/metas/_util';

describe('hojeISO', () => {
  it('usa a data local, não UTC', () => {
    expect(hojeISO(new Date(2026, 8, 14, 23, 30))).toBe('2026-09-14');
    expect(hojeISO(new Date(2026, 0, 1, 0, 5))).toBe('2026-01-01');
  });
});

describe('somarDias / ontem', () => {
  it('atravessa mês, ano e fevereiro bissexto', () => {
    expect(somarDias('2026-03-01', -1)).toBe('2026-02-28');
    expect(somarDias('2024-02-28', 1)).toBe('2024-02-29');
    expect(somarDias('2026-12-31', 1)).toBe('2027-01-01');
    expect(somarDias('2026-09-14', -27)).toBe('2026-08-18');
    expect(somarDias('2026-09-14', 0)).toBe('2026-09-14');
    expect(ontem('2026-01-01')).toBe('2025-12-31');
  });
});

describe('mesISO', () => {
  it('recorta ano e mês', () => {
    expect(mesISO('2026-09-14')).toBe('2026-09');
  });
});

describe('semanaISO (ISO 8601, segunda como início)', () => {
  it('semana comum: segunda a domingo', () => {
    expect(semanaISO('2026-09-14')).toBe('2026-W38'); // segunda
    expect(semanaISO('2026-09-20')).toBe('2026-W38'); // domingo
    expect(semanaISO('2026-09-13')).toBe('2026-W37'); // domingo anterior
    expect(semanaISO('2026-09-21')).toBe('2026-W39');
  });

  it('virada de ano: 2026 tem 53 semanas (1º de janeiro foi quinta)', () => {
    expect(semanaISO('2026-12-31')).toBe('2026-W53'); // quinta
    expect(semanaISO('2027-01-01')).toBe('2026-W53'); // sexta, ainda na W53 de 2026
    expect(semanaISO('2027-01-03')).toBe('2026-W53'); // domingo
    expect(semanaISO('2027-01-04')).toBe('2027-W01'); // segunda
  });

  it('início de ano que pertence à W01 do ano seguinte', () => {
    expect(semanaISO('2025-12-29')).toBe('2026-W01'); // segunda
    expect(semanaISO('2026-01-01')).toBe('2026-W01');
    expect(semanaISO('2025-12-28')).toBe('2025-W52'); // domingo
    expect(semanaISO('2024-12-30')).toBe('2025-W01');
    expect(semanaISO('2021-01-03')).toBe('2020-W53');
  });
});

describe('concordância com o domínio (plano 02 tem cópia própria de semanaISO em metas/_util.ts; somarDias já é o mesmo reexport)', () => {
  it('semanaISO do domínio dá o mesmo resultado nas datas de borda', () => {
    for (const d of ['2026-09-14', '2026-09-20', '2026-12-31', '2027-01-01', '2027-01-04', '2025-12-29', '2025-12-28', '2024-12-30', '2021-01-03']) {
      expect(semanaISODominio(d)).toBe(semanaISO(d));
    }
  });
});

describe('segundaDaSemana', () => {
  it('é a inversa de semanaISO para a segunda-feira', () => {
    expect(segundaDaSemana('2026-W38')).toBe('2026-09-14');
    expect(segundaDaSemana('2026-W53')).toBe('2026-12-28');
    expect(segundaDaSemana('2027-W01')).toBe('2027-01-04');
    expect(segundaDaSemana('2026-W01')).toBe('2025-12-29');
    expect(segundaDaSemana('2025-W01')).toBe('2024-12-30');
    for (const d of ['2026-09-14', '2026-12-31', '2027-01-01', '2025-12-29']) {
      const segunda = segundaDaSemana(semanaISO(d));
      expect(semanaISO(segunda)).toBe(semanaISO(d));
      expect(segunda <= d).toBe(true);
      expect(somarDias(segunda, 6) >= d).toBe(true);
    }
  });
});

describe('semanaAnteriorISO (fix wave: revisão de segunda olha para a semana anterior)', () => {
  it('é sempre a semana ISO anterior à de hoje, mesmo virando ano', () => {
    expect(semanaAnteriorISO('2026-09-17')).toBe('2026-W37'); // hoje está na W38
    expect(semanaAnteriorISO('2026-09-14')).toBe('2026-W37'); // segunda da W38 ainda olha pra trás
    expect(semanaAnteriorISO('2027-01-04')).toBe('2026-W53'); // segunda da W01/2027 → última semana de 2026
  });
});
