import { describe, expect, it } from 'vitest';
import { CAMPOS, CAMPOS_SOBRE_ONTEM, campo, camposDe, validar } from './campos';
import type { CampoId } from './campos';
import { catalogo } from './catalogo';
import type { Dia, Exame, Mes, Perfil, Semana } from './tipos';

const perfilBase: Perfil = {
  peso: 90,
  altura: 175,
  idade: 45,
  sexo: 'H',
  levantar: '06:30',
  deitar: '23:30',
  cafe: 'diario',
  alcool: 'nao',
  remedios: [],
  fuma: 'nao',
  examesQueTem: [],
  atualizadoEm: '2026-09-14T08:00:00.000Z',
};

// Lista do check-in da manhã (spec §5, tela Hoje, nível 1).
const CHECK_IN: CampoId[] = [
  'dia.deitou',
  'dia.levantou',
  'dia.comoAcordei',
  'dia.fome',
  'dia.comiSemFome',
  'dia.ultimoCafe',
  'dia.jantarFim',
  'dia.passos',
  'dia.moveu',
];

// Registros com todas as chaves de cada tabela: o tsc reclama se uma chave nova
// entrar em tipos.ts e não for listada aqui; o teste reclama se não estiver em CAMPOS.
const CHAVES_DIA: Record<Exclude<keyof Dia, 'data' | 'fonte' | 'atualizadoEm'>, true> = {
  deitou: true, levantou: true, comoAcordei: true, fome: true, comiSemFome: true, ultimoCafe: true,
  jantarFim: true, passos: true, moveu: true, primeiraRefeicao: true, maiorBloco: true, minPosJantar: true,
  copos: true, proteinaG: true, fibraG: true, refeicoesCozinhadas: true, bebidaDoce: true, alcoolDoses: true,
  levantadas: true, peso: true, fcRepouso: true, notas: true,
};
const CHAVES_SEMANA: Record<Exclude<keyof Semana, 'semana' | 'atualizadoEm'>, true> = {
  cintura: true, sessoesTiros: true, sessoesForca: true, minAtiv: true, maiorBlocoTipico: true, alcoolDoses: true, docesSemana: true,
};
const CHAVES_MES: Record<Exclude<keyof Mes, 'mes' | 'atualizadoEm'>, true> = {
  panturrilha: true, preensao: true, repsAteFalhar: true,
};
const CHAVES_EXAME: Record<Exclude<keyof Exame, 'data' | 'atualizadoEm'>, true> = {
  glicemia: true, hba1c: true, homaIr: true, tg: true, hdl: true, ferritina: true, b12: true, vitD: true, paSistolica: true, paDiastolica: true,
};

describe('CAMPOS', () => {
  it('declara todos os campos de dia, semana, mes e exame, cada um uma vez', () => {
    const esperados = [
      ...Object.keys(CHAVES_DIA).map((k) => `dia.${k}`),
      ...Object.keys(CHAVES_SEMANA).map((k) => `semana.${k}`),
      ...Object.keys(CHAVES_MES).map((k) => `mes.${k}`),
      ...Object.keys(CHAVES_EXAME).map((k) => `exame.${k}`),
    ].sort();
    const ids = CAMPOS.map((c) => c.id).sort();
    expect(ids).toEqual(esperados);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('todo desbloqueia aponta para um AcaoId do catálogo', () => {
    const idsValidos = new Set<string>(catalogo.acoes.map((a) => a.id));
    for (const c of CAMPOS) {
      for (const acao of c.desbloqueia) {
        expect(idsValidos.has(acao), `${c.id} desbloqueia id desconhecido "${acao}"`).toBe(true);
      }
    }
  });

  it('todo campo de nível 1 do dia está no check-in da manhã, e vice-versa', () => {
    const nivel1 = CAMPOS.filter((c) => c.id.startsWith('dia.') && c.nivel === 1).map((c) => c.id);
    expect([...nivel1].sort()).toEqual([...CHECK_IN].sort());
  });

  it('todo campo tem rótulo com texto e, se numérico, min <= max', () => {
    for (const c of CAMPOS) {
      expect(c.rotulo.length, c.id).toBeGreaterThan(0);
      if (c.min !== undefined && c.max !== undefined) expect(c.min, c.id).toBeLessThanOrEqual(c.max);
      if (c.tipo === 'escala') {
        expect(c.min, `${c.id}: escala precisa de min`).toBeDefined();
        expect(c.max, `${c.id}: escala precisa de max`).toBeDefined();
      }
    }
  });
});

describe('CAMPOS_SOBRE_ONTEM', () => {
  const ESPERADOS: CampoId[] = [
    'dia.ultimoCafe',
    'dia.jantarFim',
    'dia.passos',
    'dia.moveu',
    'dia.maiorBloco',
    'dia.minPosJantar',
    'dia.copos',
    'dia.proteinaG',
    'dia.fibraG',
    'dia.refeicoesCozinhadas',
    'dia.bebidaDoce',
    'dia.alcoolDoses',
  ];

  it('só contém ids "dia.*" presentes em CAMPOS', () => {
    const idsDeCampos = new Set(CAMPOS.map((c) => c.id));
    for (const id of CAMPOS_SOBRE_ONTEM) {
      expect(id.startsWith('dia.'), id).toBe(true);
      expect(idsDeCampos.has(id), id).toBe(true);
    }
  });

  it('é exatamente a lista de 12 campos definida pelo controller', () => {
    expect([...CAMPOS_SOBRE_ONTEM].sort()).toEqual([...ESPERADOS].sort());
  });
});

describe('campo()', () => {
  it('devolve o campo pelo id', () => {
    expect(campo('dia.passos').tipo).toBe('inteiro');
    expect(campo('dia.passos').nivel).toBe(1);
    expect(campo('dia.ultimoCafe').tipo).toBe('hora-ou-nao');
    expect(campo('dia.alcoolDoses').tipo).toBe('inteiro-ou-nao');
  });

  it('lança para id fora do registro (perfil.* não está em CAMPOS)', () => {
    expect(() => campo('perfil.altura')).toThrow("Campo 'perfil.altura' não está no registro.");
  });
});

describe('camposDe()', () => {
  it('filtra por tabela e por nível acumulado (nível 2 inclui o nível 1)', () => {
    const n1 = camposDe('dia', perfilBase, 1);
    const n2 = camposDe('dia', perfilBase, 2);
    const todos = camposDe('dia', perfilBase);
    expect(n1.every((c) => c.nivel === 1 && c.id.startsWith('dia.'))).toBe(true);
    expect(n2.every((c) => c.nivel <= 2)).toBe(true);
    expect(n2.length).toBeGreaterThan(n1.length);
    expect(todos.map((c) => c.id)).toContain('dia.notas');
    expect(n2.map((c) => c.id)).not.toContain('dia.notas');
  });

  it('esconde ultimoCafe quando perfil.cafe === "nao" e mostra nos outros casos', () => {
    const ids = (p: Perfil) => camposDe('dia', p, 1).map((c) => c.id);
    expect(ids({ ...perfilBase, cafe: 'nao' })).not.toContain('dia.ultimoCafe');
    expect(ids({ ...perfilBase, cafe: 'as-vezes' })).toContain('dia.ultimoCafe');
    expect(ids({ ...perfilBase, cafe: 'diario' })).toContain('dia.ultimoCafe');
  });

  it('esconde alcoolDoses (dia e semana) quando perfil.alcool === "nao"', () => {
    expect(camposDe('dia', perfilBase).map((c) => c.id)).not.toContain('dia.alcoolDoses');
    expect(camposDe('semana', perfilBase).map((c) => c.id)).not.toContain('semana.alcoolDoses');
    const bebe = { ...perfilBase, alcool: 'as-vezes' as const };
    expect(camposDe('dia', bebe).map((c) => c.id)).toContain('dia.alcoolDoses');
    expect(camposDe('semana', bebe).map((c) => c.id)).toContain('semana.alcoolDoses');
  });

  it('preserva a ordem de declaração', () => {
    const ids = camposDe('semana', perfilBase).map((c) => c.id);
    expect(ids[0]).toBe('semana.cintura');
    expect(camposDe('mes', perfilBase).map((c) => c.id)).toEqual(['mes.panturrilha', 'mes.preensao', 'mes.repsAteFalhar']);
    expect(camposDe('exame', perfilBase)).toHaveLength(10);
  });
});

describe('validar()', () => {
  it('undefined é sempre ok (não registrou)', () => {
    for (const c of CAMPOS) expect(validar(c, undefined), c.id).toBeNull();
  });

  it('null só é ok nos tipos "-ou-nao"', () => {
    expect(validar(campo('dia.ultimoCafe'), null)).toBeNull();
    expect(validar(campo('dia.alcoolDoses'), null)).toBeNull();
    expect(validar(campo('dia.jantarFim'), null)).toBe('Informe um valor.');
    expect(validar(campo('dia.passos'), null)).toBe('Informe um valor.');
  });

  it('hora exige HH:MM 24 h', () => {
    const c = campo('dia.deitou');
    expect(validar(c, '23:30')).toBeNull();
    expect(validar(c, '00:00')).toBeNull();
    expect(validar(c, '24:00')).toBe('Use o formato HH:MM (ex.: 23:30).');
    expect(validar(c, '7:30')).toBe('Use o formato HH:MM (ex.: 23:30).');
    expect(validar(c, 1410)).toBe('Use o formato HH:MM (ex.: 23:30).');
    expect(validar(campo('dia.ultimoCafe'), '14:00')).toBeNull();
    expect(validar(campo('dia.ultimoCafe'), 'tarde')).toBe('Use o formato HH:MM (ex.: 23:30).');
  });

  it('inteiro exige número inteiro dentro de min/max', () => {
    const c = campo('dia.passos');
    expect(validar(c, 6200)).toBeNull();
    expect(validar(c, 0)).toBeNull();
    expect(validar(c, 62.5)).toBe('Use um número inteiro.');
    expect(validar(c, '6200')).toBe('Use um número inteiro.');
    expect(validar(c, -1)).toBe('O mínimo é 0 passos.');
    expect(validar(c, 100001)).toBe('O máximo é 100000 passos.');
    expect(validar(campo('dia.alcoolDoses'), 2)).toBeNull();
    expect(validar(campo('dia.alcoolDoses'), 1.5)).toBe('Use um número inteiro.');
  });

  it('escala exige inteiro entre min e max', () => {
    const c = campo('dia.comoAcordei');
    expect(validar(c, 3)).toBeNull();
    expect(validar(c, 0)).toBe('O mínimo é 1.');
    expect(validar(c, 6)).toBe('O máximo é 5.');
    expect(validar(c, 2.5)).toBe('Use um número inteiro.');
    expect(validar(campo('dia.fome'), 10)).toBeNull();
    expect(validar(campo('dia.fome'), 11)).toBe('O máximo é 10.');
  });

  it('decimal aceita fração, rejeita NaN/Infinity e respeita min/max', () => {
    const c = campo('dia.peso');
    expect(validar(c, 89.6)).toBeNull();
    expect(validar(c, Number.NaN)).toBe('Use um número.');
    expect(validar(c, Number.POSITIVE_INFINITY)).toBe('Use um número.');
    expect(validar(c, '89,6')).toBe('Use um número.');
    expect(validar(c, 10)).toBe('O mínimo é 20 kg.');
    expect(validar(c, 500)).toBe('O máximo é 400 kg.');
  });

  it('bool exige boolean', () => {
    const c = campo('dia.moveu');
    expect(validar(c, true)).toBeNull();
    expect(validar(c, false)).toBeNull();
    expect(validar(c, 'sim')).toBe('Responda sim ou não.');
    expect(validar(c, 1)).toBe('Responda sim ou não.');
  });

  it('texto exige string e respeita max (caracteres)', () => {
    const c = campo('dia.notas');
    expect(validar(c, 'dormi mal')).toBeNull();
    expect(validar(c, '')).toBeNull();
    expect(validar(c, 42)).toBe('Escreva um texto.');
    expect(validar(c, 'x'.repeat(2001))).toBe('No máximo 2000 caracteres.');
  });
});
