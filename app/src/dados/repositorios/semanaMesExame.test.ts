// @vitest-environment node
import { beforeEach, describe, expect, it } from 'vitest';
import { limparBanco } from '@/dados/testes/banco';
import { salvarDia } from './dia';
import { registrarTreino } from './eventos';
import { lerSemana, preencherSemana, salvarSemana, semanaMaisRecente } from './semana';
import { lerMes, mesMaisRecente, salvarMes } from './mes';
import { listarExames, salvarExame, ultimoExame } from './exame';

beforeEach(limparBanco);

describe('semana', () => {
  it('lerSemana sem registro retorna undefined; semanaMaisRecente também', async () => {
    expect(await lerSemana('2026-W38')).toBeUndefined();
    expect(await semanaMaisRecente()).toBeUndefined();
  });

  it('salvarSemana cria e faz merge', async () => {
    await salvarSemana('2026-W38', { cintura: 92 });
    const s = await salvarSemana('2026-W38', { sessoesTiros: 2 });
    expect(s).toMatchObject({ semana: '2026-W38', cintura: 92, sessoesTiros: 2 });
    expect(await lerSemana('2026-W38')).toEqual(s);
  });

  it('semanaMaisRecente ordena pela chave ISO, inclusive na virada de ano', async () => {
    await salvarSemana('2026-W53', { cintura: 90 });
    await salvarSemana('2027-W01', { cintura: 89 });
    await salvarSemana('2026-W38', { cintura: 92 });
    expect((await semanaMaisRecente())?.semana).toBe('2027-W01');
  });

  it('preencherSemana conta eventos e soma dias da semana ISO, sem gravar', async () => {
    // 2026-W38 = 2026-09-14 (segunda) … 2026-09-20 (domingo)
    await registrarTreino({ data: '2026-09-14', hora: '07:00', tipo: 'tiros', minutos: 20 });
    await registrarTreino({ data: '2026-09-15', hora: '07:00', tipo: 'moderado', minutos: 30 });
    await registrarTreino({ data: '2026-09-16', hora: '07:00', tipo: 'forca', minutos: 40 });
    await registrarTreino({ data: '2026-09-19', hora: '07:00', tipo: 'moderado', minutos: 45 });
    await registrarTreino({ data: '2026-09-21', hora: '07:00', tipo: 'moderado', minutos: 60 }); // semana seguinte
    await registrarTreino({ data: '2026-09-13', hora: '07:00', tipo: 'tiros', minutos: 20 });    // semana anterior
    await salvarDia('2026-09-14', { alcoolDoses: 2, bebidaDoce: 1, maiorBloco: 60 });
    await salvarDia('2026-09-15', { alcoolDoses: null, bebidaDoce: 2, maiorBloco: 90 });
    await salvarDia('2026-09-17', { maiorBloco: 120 });
    await salvarDia('2026-09-13', { alcoolDoses: 5, bebidaDoce: 9, maiorBloco: 300 }); // fora da semana

    const p = await preencherSemana('2026-W38');
    expect(p).toEqual({
      sessoesTiros: 1,
      sessoesForca: 1,
      minAtiv: 75,
      alcoolDoses: 2,
      docesSemana: 3,
      maiorBlocoTipico: 90,
    });
    expect(await lerSemana('2026-W38')).toBeUndefined(); // não gravou
  });

  it('preencherSemana sem dados devolve só as contagens em zero', async () => {
    expect(await preencherSemana('2026-W38')).toEqual({ sessoesTiros: 0, sessoesForca: 0, minAtiv: 0 });
  });
});

describe('mes', () => {
  it('cria, faz merge e acha o mais recente', async () => {
    expect(await lerMes('2026-09')).toBeUndefined();
    await salvarMes('2026-09', { panturrilha: 37 });
    const m = await salvarMes('2026-09', { preensao: 40 });
    expect(m).toMatchObject({ mes: '2026-09', panturrilha: 37, preensao: 40 });
    await salvarMes('2026-08', { panturrilha: 36 });
    expect((await mesMaisRecente())?.mes).toBe('2026-09');
  });
});

describe('exame', () => {
  it('lista mais recente primeiro, faz merge por data e acha o último', async () => {
    expect(await listarExames()).toEqual([]);
    expect(await ultimoExame()).toBeUndefined();
    await salvarExame({ data: '2026-03-01', glicemia: 95 });
    await salvarExame({ data: '2026-09-01', glicemia: 90 });
    await salvarExame({ data: '2026-03-01', hba1c: 5.4 });
    const lista = await listarExames();
    expect(lista.map((e) => e.data)).toEqual(['2026-09-01', '2026-03-01']);
    expect(lista[1]).toMatchObject({ glicemia: 95, hba1c: 5.4 });
    expect((await ultimoExame())?.data).toBe('2026-09-01');
  });
});
