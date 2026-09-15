import { describe, expect, it } from 'vitest';
import type { DataISO, Dia, Hora, Perfil } from '../tipos';
import { sonoFomeCafe } from './sonoFomeCafe';

// ---------- fixtures ----------

type Noite = 'N' | 'C' | 'M'; // N = normal (7,67 h) · C = curta (4,67 h) · M = média (6,17 h: nem curta nem normal)
const HORAS: Record<Noite, [Hora, Hora]> = {
  N: ['23:00', '07:00'],
  C: ['01:00', '06:00'],
  M: ['23:30', '06:00'],
};

interface EspecDia {
  noite?: Noite;
  fome?: number;
  comiSemFome?: boolean;
  ultimoCafe?: Hora | null;
}

// Aritmética local de datas: testes de dominio/ não importam de dados/.
function diaSeguinte(d: DataISO): DataISO {
  const [ano, mes, dia] = d.split('-').map(Number);
  return new Date(Date.UTC(ano, mes - 1, dia + 1)).toISOString().slice(0, 10);
}

/** Gera dias consecutivos a partir de `inicio` e devolve MAIS RECENTE PRIMEIRO (como o Contexto). */
function gerar(inicio: DataISO, espec: EspecDia[]): Dia[] {
  const dias: Dia[] = [];
  let data = inicio;
  for (const e of espec) {
    const dia: Dia = { data, atualizadoEm: '2026-09-14T08:00:00.000Z' };
    if (e.noite) [dia.deitou, dia.levantou] = HORAS[e.noite];
    if (e.fome !== undefined) dia.fome = e.fome;
    if (e.comiSemFome !== undefined) dia.comiSemFome = e.comiSemFome;
    if ('ultimoCafe' in e) dia.ultimoCafe = e.ultimoCafe; // null é valor válido ("não tomou")
    dias.push(dia);
    data = diaSeguinte(data);
  }
  return dias.reverse();
}

function perfil(cafe: Perfil['cafe']): Perfil {
  return {
    peso: 80, altura: 175, idade: 40, sexo: 'H',
    levantar: '07:00', deitar: '23:00',
    cafe, alcool: 'nao', remedios: [], fuma: 'nao', examesQueTem: [],
    atualizadoEm: '2026-09-14T08:00:00.000Z',
  };
}

const PERFIS: Array<Perfil['cafe']> = ['nao', 'as-vezes', 'diario'];

// 7 dias: 5 normais, 2 curtas (índices 2 e 5). Fome após as curtas = fome dos índices 3 e 6.
const SETE: EspecDia[] = [
  { noite: 'N', fome: 5 }, { noite: 'N', fome: 5 }, { noite: 'C', fome: 5 }, { noite: 'N', fome: 8 },
  { noite: 'N', fome: 5 }, { noite: 'C', fome: 5 }, { noite: 'N', fome: 8 },
];

// 14 dias com café e "comi sem fome" registrados todos os dias.
const QUATORZE: EspecDia[] = [
  { noite: 'N', fome: 5, comiSemFome: false, ultimoCafe: null },
  { noite: 'N', fome: 5, comiSemFome: false, ultimoCafe: '16:00' },
  { noite: 'C', fome: 5, comiSemFome: false, ultimoCafe: null },
  { noite: 'N', fome: 7, comiSemFome: true, ultimoCafe: '17:00' },
  { noite: 'C', fome: 5, comiSemFome: false, ultimoCafe: null },
  { noite: 'M', fome: 7, comiSemFome: true, ultimoCafe: '16:00' },
  { noite: 'N', fome: 5, comiSemFome: false, ultimoCafe: null },
  { noite: 'C', fome: 5, comiSemFome: false, ultimoCafe: '15:00' },
  { noite: 'M', fome: 8, comiSemFome: true, ultimoCafe: null },
  { noite: 'N', fome: 5, comiSemFome: false, ultimoCafe: '16:00' },
  { noite: 'N', fome: 5, comiSemFome: true, ultimoCafe: null },
  { noite: 'C', fome: 5, comiSemFome: false, ultimoCafe: '16:00' },
  { noite: 'N', fome: 8, comiSemFome: false, ultimoCafe: null },
  { noite: 'N', fome: 5, comiSemFome: false, ultimoCafe: '16:00' },
];

/**
 * 28 dias. Café tarde (17:00) nos índices ímpares, café cedo (`cedo`) nos pares.
 * A noite registrada em i reflete o café de i−1: após café tarde a noite é M (6,17 h), após cedo é N (7,67 h).
 * Quatro noites curtas nos índices 5, 12, 19, 26; no dia seguinte a cada uma, fome 8 e comiSemFome true; nos demais fome 4.
 */
function vinteOito(cedo: Hora | null): EspecDia[] {
  const espec: EspecDia[] = [];
  for (let i = 0; i < 28; i++) {
    const cafeTarde = i % 2 === 1;
    const cafeOntemTarde = i > 0 && (i - 1) % 2 === 1;
    let noite: Noite = cafeOntemTarde ? 'M' : 'N';
    if ([5, 12, 19, 26].includes(i)) noite = 'C';
    const ontemCurta = i > 0 && espec[i - 1].noite === 'C';
    espec.push({
      noite,
      fome: noite === 'C' ? 5 : ontemCurta ? 8 : 4,
      comiSemFome: ontemCurta,
      ultimoCafe: cafeTarde ? '17:00' : cedo,
    });
  }
  return espec;
}

function frase(t: ReturnType<typeof sonoFomeCafe>, tipo: string) {
  if (!t.pronta) throw new Error('tendência não está pronta');
  return t.frases.find((f) => f.tipo === tipo);
}

// ---------- não pronta ----------

describe('sonoFomeCafe — pré-requisito', () => {
  it('com 6 check-ins e 3 normais não está pronta e faltam 2', () => {
    const dias = gerar('2026-08-01', [
      { noite: 'N', fome: 5 }, { noite: 'N', fome: 5 }, { noite: 'C', fome: 5 },
      { noite: 'C', fome: 8 }, { noite: 'C', fome: 5 }, { noite: 'N', fome: 5 },
    ]);
    const t = sonoFomeCafe(dias, perfil('diario'));
    expect(t.pronta).toBe(false);
    if (t.pronta) return;
    expect(t.faltam).toBe(2); // max(7 − 6, 5 − 3)
    expect(t.precisaDe).toEqual(['dia.deitou', 'dia.levantou', 'dia.fome']);
    expect(t.oQueVaiDizer).toContain('fome');
    expect(t.oQueVaiDizer).toContain('café');
  });

  it('com 7 check-ins mas só 4 normais não está pronta e falta 1', () => {
    const dias = gerar('2026-08-01', [
      { noite: 'N', fome: 5 }, { noite: 'N', fome: 5 }, { noite: 'M', fome: 5 }, { noite: 'N', fome: 8 },
      { noite: 'M', fome: 5 }, { noite: 'M', fome: 5 }, { noite: 'N', fome: 8 },
    ]);
    const t = sonoFomeCafe(dias, perfil('nao'));
    expect(t.pronta).toBe(false);
    if (t.pronta) return;
    expect(t.faltam).toBe(1);
    expect(t.oQueVaiDizer).not.toContain('café'); // perfil sem café não promete frase de café
  });

  it('dia sem fome não conta como check-in', () => {
    const dias = gerar('2026-08-01', [...SETE.slice(0, 6), { noite: 'N' }]);
    const t = sonoFomeCafe(dias, perfil('nao'));
    expect(t.pronta).toBe(false);
    if (t.pronta) return;
    expect(t.faltam).toBe(1);
  });

  it('dias vazios não estão prontos e faltam 7', () => {
    const t = sonoFomeCafe([], perfil('as-vezes'));
    expect(t).toMatchObject({ pronta: false, faltam: 7 });
  });
});

// ---------- pronta: sono → fome ----------

describe('sonoFomeCafe — sono → fome', () => {
  it.each(PERFIS)('7 dias, perfil %s: pronta, baseline 5, só "poucas noites curtas" (n = 2) e sem frase de café', (cafe) => {
    const t = sonoFomeCafe(gerar('2026-08-01', SETE), perfil(cafe));
    expect(t.pronta).toBe(true);
    if (!t.pronta) return;
    expect(t.baseline).toBe(5);
    expect(t.frases).toEqual([
      { tipo: 'sono-fome', texto: 'Ainda poucas noites curtas para comparar (n = 2).', n: 2 },
    ]);
  });

  it('usa a fome do dia SEGUINTE à noite curta (deslocamento D/D+1)', () => {
    // Noites curtas nos índices 2, 4, 6. No MESMO dia a fome é 3; no dia SEGUINTE é 9.
    // Com o deslocamento correto: média(9, 9, 9) − baseline. Baseline = mediana da fome
    // no dia seguinte às noites normais (índices 0, 1, 3, 5, 7 → fomes 5, 3, 3, 3, 5) = 3. Delta = +6,0.
    // Se a implementação usasse o mesmo dia, daria média(3, 3, 3) − mediana(5, 5, 9, 9, 9, 5) = −4,0.
    const dias = gerar('2026-08-01', [
      { noite: 'N', fome: 5 }, { noite: 'N', fome: 5 }, { noite: 'C', fome: 3 }, { noite: 'N', fome: 9 },
      { noite: 'C', fome: 3 }, { noite: 'N', fome: 9 }, { noite: 'C', fome: 3 }, { noite: 'N', fome: 9 },
      { noite: 'N', fome: 5 },
    ]);
    const t = sonoFomeCafe(dias, perfil('nao'));
    expect(t.pronta).toBe(true);
    if (!t.pronta) return;
    expect(t.baseline).toBe(3);
    expect(frase(t, 'sono-fome')).toEqual({
      tipo: 'sono-fome',
      texto: 'Nos dias após dormir menos de 6 h, sua fome ficou +6,0 acima do seu normal (n = 3).',
      n: 3,
    });
    expect(frase(t, 'sono-fome')?.texto).not.toContain('−4,0');
  });

  it('delta negativo usa sinal − e "abaixo"', () => {
    const dias = gerar('2026-08-01', [
      { noite: 'N', fome: 6 }, { noite: 'N', fome: 6 }, { noite: 'C', fome: 6 }, { noite: 'N', fome: 2 },
      { noite: 'C', fome: 6 }, { noite: 'N', fome: 2 }, { noite: 'C', fome: 6 }, { noite: 'N', fome: 2 },
      { noite: 'N', fome: 6 },
    ]);
    const t = sonoFomeCafe(dias, perfil('nao'));
    expect(t.pronta).toBe(true);
    if (!t.pronta) return;
    expect(t.baseline).toBe(6);
    expect(frase(t, 'sono-fome')?.texto).toBe(
      'Nos dias após dormir menos de 6 h, sua fome ficou −4,0 abaixo do seu normal (n = 3).',
    );
  });

  it('delta exatamente 0 diz "igual"', () => {
    const dias = gerar('2026-08-01', [
      { noite: 'N', fome: 6 }, { noite: 'N', fome: 6 }, { noite: 'C', fome: 6 }, { noite: 'N', fome: 6 },
      { noite: 'C', fome: 6 }, { noite: 'N', fome: 6 }, { noite: 'C', fome: 6 }, { noite: 'N', fome: 6 },
      { noite: 'N', fome: 6 },
    ]);
    const t = sonoFomeCafe(dias, perfil('nao'));
    expect(t.pronta).toBe(true);
    if (!t.pronta) return;
    expect(t.baseline).toBe(6);
    expect(frase(t, 'sono-fome')?.texto).toBe(
      'Nos dias após dormir menos de 6 h, sua fome ficou igual ao seu normal (n = 3).',
    );
  });

  it('14 dias: delta +2,5 com n = 4', () => {
    const t = sonoFomeCafe(gerar('2026-08-01', QUATORZE), perfil('nao'));
    expect(t.pronta).toBe(true);
    if (!t.pronta) return;
    expect(t.baseline).toBe(5);
    expect(frase(t, 'sono-fome')).toEqual({
      tipo: 'sono-fome',
      texto: 'Nos dias após dormir menos de 6 h, sua fome ficou +2,5 acima do seu normal (n = 4).',
      n: 4,
    });
  });
});

// ---------- pronta: sono → comer sem fome ----------

describe('sonoFomeCafe — sono → comer sem fome', () => {
  it('14 dias: 3 de 4 noites curtas vs 1 de 7 normais', () => {
    const t = sonoFomeCafe(gerar('2026-08-01', QUATORZE), perfil('nao'));
    expect(frase(t, 'sono-comer-sem-fome')).toEqual({
      tipo: 'sono-comer-sem-fome',
      texto: 'Comeu sem fome em 3 de 4 noites curtas vs 1 de 7 normais.',
      n: 4,
      nComparacao: 7,
    });
  });

  it('é omitida quando há menos de 3 noites curtas com o dado', () => {
    const espec = SETE.map((e) => ({ ...e, comiSemFome: true }));
    const t = sonoFomeCafe(gerar('2026-08-01', espec), perfil('nao'));
    expect(frase(t, 'sono-comer-sem-fome')).toBeUndefined();
  });

  it('28 dias: 4 de 4 noites curtas vs 0 de 12 normais', () => {
    const t = sonoFomeCafe(gerar('2026-08-01', vinteOito('13:00')), perfil('nao'));
    expect(frase(t, 'sono-comer-sem-fome')?.texto).toBe('Comeu sem fome em 4 de 4 noites curtas vs 0 de 12 normais.');
  });

  it('omite o "vs" quando nenhuma noite normal tem o dado (emNormais vazio)', () => {
    // Noites alternando C/N (índices ímpares curtas); comiSemFome só registrado no dia
    // seguinte a cada noite curta (índices pares > 0) — nenhuma noite normal tem o dado.
    const espec: EspecDia[] = [];
    for (let i = 0; i <= 10; i++) {
      const curta = i % 2 === 1;
      const diaAposCurta = i > 0 && i % 2 === 0;
      espec.push({ noite: curta ? 'C' : 'N', fome: 5, ...(diaAposCurta ? { comiSemFome: true } : {}) });
    }
    const t = sonoFomeCafe(gerar('2026-08-01', espec), perfil('nao'));
    expect(t.pronta).toBe(true);
    if (!t.pronta) return;
    expect(frase(t, 'sono-comer-sem-fome')).toEqual({
      tipo: 'sono-comer-sem-fome',
      texto: 'Comeu sem fome em 5 de 5 noites curtas.',
      n: 5,
      nComparacao: 0,
    });
  });
});

// ---------- pronta: café → sono ----------

describe('sonoFomeCafe — café → sono', () => {
  it.each([7, 14, 28] as const)('perfil "nao" nunca tem frase de café (%s dias)', (n) => {
    const espec = n === 7 ? SETE : n === 14 ? QUATORZE : vinteOito('13:00');
    const t = sonoFomeCafe(gerar('2026-08-01', espec), perfil('nao'));
    expect(t.pronta).toBe(true);
    expect(frase(t, 'cafe-sono')).toBeUndefined();
  });

  it('as-vezes, 14 dias: 11 min a menos (n = 6 com, 7 sem) — sono da noite registrada no dia seguinte ao café', () => {
    const t = sonoFomeCafe(gerar('2026-08-01', QUATORZE), perfil('as-vezes'));
    expect(frase(t, 'cafe-sono')).toEqual({
      tipo: 'cafe-sono',
      texto: 'Nas noites após café, dormiu 11 min a menos (n = 6 com, 7 sem).',
      n: 6,
      nComparacao: 7,
    });
  });

  it('diario, 14 dias: omitida porque todos os cafés são depois do corte (lado "antes" < 3)', () => {
    const t = sonoFomeCafe(gerar('2026-08-01', QUATORZE), perfil('diario'));
    expect(t.pronta).toBe(true);
    if (!t.pronta) return;
    expect(t.frases.map((f) => f.tipo)).toEqual(['sono-fome', 'sono-comer-sem-fome']);
  });

  it('diario, 28 dias: corte = deitar 23:00 − 9 h = 14:00; 78 min a menos (n = 13 vs 14)', () => {
    const t = sonoFomeCafe(gerar('2026-08-01', vinteOito('13:00')), perfil('diario'));
    expect(t.pronta).toBe(true);
    if (!t.pronta) return;
    expect(t.frases.map((f) => f.tipo)).toEqual(['sono-fome', 'sono-comer-sem-fome', 'cafe-sono']);
    expect(frase(t, 'cafe-sono')).toEqual({
      tipo: 'cafe-sono',
      texto: 'Nos dias com café depois das 14:00, dormiu 78 min a menos (n = 13 vs 14).',
      n: 13,
      nComparacao: 14,
    });
  });

  it('as-vezes, 28 dias com null nos dias sem café: 78 min a menos (n = 13 com, 14 sem)', () => {
    const t = sonoFomeCafe(gerar('2026-08-01', vinteOito(null)), perfil('as-vezes'));
    expect(frase(t, 'cafe-sono')?.texto).toBe('Nas noites após café, dormiu 78 min a menos (n = 13 com, 14 sem).');
  });

  it('as-vezes, 28 dias sem nenhum null: omitida (lado "sem" < 3)', () => {
    const t = sonoFomeCafe(gerar('2026-08-01', vinteOito('13:00')), perfil('as-vezes'));
    expect(frase(t, 'cafe-sono')).toBeUndefined();
  });

  it('diario: diferença ≤ 0 diz "não dormiu menos"', () => {
    // Café tarde nos ímpares → noite seguinte N (7,67 h); café cedo nos pares → noite seguinte M (6,17 h).
    const espec: EspecDia[] = [];
    for (let i = 0; i < 10; i++) {
      const ontemTarde = i > 0 && (i - 1) % 2 === 1;
      espec.push({ noite: i === 0 || ontemTarde ? 'N' : 'M', fome: 5, ultimoCafe: i % 2 === 1 ? '17:00' : '13:00' });
    }
    const t = sonoFomeCafe(gerar('2026-08-01', espec), perfil('diario'));
    expect(frase(t, 'cafe-sono')).toEqual({
      tipo: 'cafe-sono',
      texto: 'Nos dias com café depois das 14:00, não dormiu menos (n = 4 vs 5).',
      n: 4,
      nComparacao: 5,
    });
    // com o mesmo padrão, o perfil as-vezes (café cedo vira null) também diz "não dormiu menos"
    const t2 = sonoFomeCafe(
      gerar('2026-08-01', espec.map((e) => ({ ...e, ultimoCafe: e.ultimoCafe === '13:00' ? null : e.ultimoCafe }))),
      perfil('as-vezes'),
    );
    expect(frase(t2, 'cafe-sono')?.texto).toBe('Nas noites após café, não dormiu menos (n = 4 com, 5 sem).');
  });

  it('diario: corte normaliza quando deitar − 9 h passa da meia-noite (deitar 00:30 → 15:30)', () => {
    const p = { ...perfil('diario'), deitar: '00:30' };
    const espec = vinteOito('13:00').map((e) => ({ ...e, ultimoCafe: e.ultimoCafe === '17:00' ? '16:00' : '15:00' }));
    const t = sonoFomeCafe(gerar('2026-08-01', espec), p);
    expect(frase(t, 'cafe-sono')?.texto).toContain('depois das 15:30');
  });
});
