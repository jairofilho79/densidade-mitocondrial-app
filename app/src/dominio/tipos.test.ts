import { describe, expect, it } from 'vitest';
import type { Dia, EventoRefeicao, EventoTreino, Exame, Mes, Perfil, Semana } from './tipos';

const perfil: Perfil = {
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

const dia: Dia = {
  data: '2026-09-14',
  deitou: '23:30',
  levantou: '06:30',
  comoAcordei: 4,
  fome: 3,
  comiSemFome: false,
  ultimoCafe: null, // três estados: undefined = não registrou, null = não tomou, "HH:MM" = hora
  jantarFim: '19:00',
  passos: 6200,
  moveu: true,
  atualizadoEm: '2026-09-14T08:00:00.000Z',
};

const treino: EventoTreino = {
  id: 'ev-1',
  data: '2026-09-14',
  hora: '07:00',
  tipo: 'tiros',
  minutos: 15,
  tiros: 3,
  atualizadoEm: '2026-09-14T07:20:00.000Z',
};

const refeicao: EventoRefeicao = {
  id: 'ref-1',
  data: '2026-09-14',
  hora: '12:00',
  proteinaG: 30,
  comecouPelaFibra: true,
  atualizadoEm: '2026-09-14T12:30:00.000Z',
};

const semana: Semana = { semana: '2026-W37', cintura: 100, sessoesTiros: 3, atualizadoEm: '2026-09-14T08:00:00.000Z' };
const mes: Mes = { mes: '2026-09', panturrilha: 38, atualizadoEm: '2026-09-07T08:00:00.000Z' };
const exame: Exame = { data: '2026-09-01', glicemia: 92, hba1c: 5.4, atualizadoEm: '2026-09-01T08:00:00.000Z' };

// Asserções de compilação: o tsc (pnpm build) falha se alguma linha abaixo passar a compilar.
// @ts-expect-error comoAcordei só aceita 1–5
const diaInvalido1: Dia = { data: '2026-09-14', comoAcordei: 6, atualizadoEm: '' };
// @ts-expect-error sexo só aceita 'H' | 'M'
const perfilInvalido: Perfil = { ...perfil, sexo: 'X' };
// @ts-expect-error tipo de treino restrito
const treinoInvalido: EventoTreino = { ...treino, tipo: 'yoga' };
// @ts-expect-error jantarFim não aceita null (só ultimoCafe e alcoolDoses aceitam)
const diaInvalido2: Dia = { data: '2026-09-14', jantarFim: null, atualizadoEm: '' };
const diaValidoNulls: Dia = { data: '2026-09-14', ultimoCafe: null, alcoolDoses: null, atualizadoEm: '' };

describe('tipos do domínio', () => {
  it('as fixtures compilam e carregam as chaves naturais', () => {
    expect(dia.data).toBe('2026-09-14');
    expect(semana.semana).toBe('2026-W37');
    expect(mes.mes).toBe('2026-09');
    expect(exame.data).toBe('2026-09-01');
    expect(treino.tipo).toBe('tiros');
    expect(refeicao.comecouPelaFibra).toBe(true);
    expect(perfil.cafe).toBe('diario');
  });

  it('ultimoCafe e alcoolDoses distinguem "não registrou" de "não se aplica"', () => {
    expect(diaValidoNulls.ultimoCafe).toBeNull();
    expect(diaValidoNulls.alcoolDoses).toBeNull();
    expect(diaValidoNulls.jantarFim).toBeUndefined();
  });

  it('fonte por campo está preparado para a v2', () => {
    const comFonte: Dia = { ...dia, fonte: { passos: 'health' } };
    expect(comFonte.fonte?.passos).toBe('health');
  });

  it('as fixtures inválidas existem só para o tsc', () => {
    expect([diaInvalido1, perfilInvalido, treinoInvalido, diaInvalido2]).toHaveLength(4);
  });
});
