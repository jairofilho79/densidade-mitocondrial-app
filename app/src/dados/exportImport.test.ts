// @vitest-environment node
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/dados/db';
import { limparBanco, PERFIL_TESTE } from '@/dados/testes/banco';
import { lerPerfil, salvarPerfil } from '@/dados/repositorios/perfil';
import { lerDia, salvarDia } from '@/dados/repositorios/dia';
import { registrarRefeicao, registrarTreino } from '@/dados/repositorios/eventos';
import { salvarSemana } from '@/dados/repositorios/semana';
import { salvarMes } from '@/dados/repositorios/mes';
import { salvarExame } from '@/dados/repositorios/exame';
import { apagarTudo, exportar, importar } from './exportImport';

beforeEach(limparBanco);

async function popular() {
  await salvarPerfil(PERFIL_TESTE);
  await salvarDia('2026-09-13', { passos: 5000 });
  await salvarDia('2026-09-14', { passos: 6000, ultimoCafe: null });
  await registrarTreino({ data: '2026-09-14', hora: '07:00', tipo: 'tiros', minutos: 20 });
  await registrarRefeicao({ data: '2026-09-14', hora: '12:00', proteinaG: 30 });
  await salvarSemana('2026-W37', { cintura: 92 });
  await salvarMes('2026-09', { panturrilha: 37 });
  await salvarExame({ data: '2026-09-01', glicemia: 90 });
}

async function contarTudo(): Promise<Record<string, number>> {
  const contagem: Record<string, number> = {};
  for (const t of db.tables) contagem[t.name] = await t.count();
  return contagem;
}

describe('exportar', () => {
  it('produz o envelope versionado com todas as tabelas', async () => {
    await popular();
    const e = await exportar();
    expect(e.versao).toBe(1);
    expect(e.exportadoEm).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(e.perfil?.peso).toBe(80);
    expect(e.perfil).not.toHaveProperty('id');
    expect(e.dia.map((d) => d.data).sort()).toEqual(['2026-09-13', '2026-09-14']);
    expect(e.eventoTreino).toHaveLength(1);
    expect(e.eventoRefeicao).toHaveLength(1);
    expect(e.semana).toHaveLength(1);
    expect(e.mes).toHaveLength(1);
    expect(e.exame).toHaveLength(1);
  });

  it('banco vazio exporta sem perfil e com listas vazias', async () => {
    const e = await exportar();
    expect(e.perfil).toBeUndefined();
    expect(e.dia).toEqual([]);
  });
});

describe('apagarTudo', () => {
  it('zera todas as tabelas', async () => {
    await popular();
    await apagarTudo();
    expect(await contarTudo()).toEqual({ perfil: 0, dia: 0, eventoTreino: 0, eventoRefeicao: 0, semana: 0, mes: 0, exame: 0 });
  });
});

describe('importar', () => {
  it('round-trip: exportar → apagarTudo → importar restaura tudo', async () => {
    await popular();
    const antes = await exportar();
    await apagarTudo();

    const r = await importar(JSON.parse(JSON.stringify(antes)));
    expect(r).toEqual({
      ok: true,
      contagem: { perfil: 1, dia: 2, eventoTreino: 1, eventoRefeicao: 1, semana: 1, mes: 1, exame: 1 },
    });

    const depois = await exportar();
    expect({ ...depois, exportadoEm: '' }).toEqual({ ...antes, exportadoEm: '' });
    expect(await lerPerfil()).toEqual(antes.perfil);
    expect((await lerDia('2026-09-14'))?.ultimoCafe).toBeNull();
  });

  it('aceita o texto do arquivo (string JSON)', async () => {
    const r = await importar(JSON.stringify({ versao: 1, dia: [{ data: '2026-09-14', passos: 1, atualizadoEm: '2026-09-14T00:00:00.000Z' }] }));
    expect(r.ok).toBe(true);
    expect((await lerDia('2026-09-14'))?.passos).toBe(1);
  });

  it('merge: mantém a linha mais recente de cada lado', async () => {
    await salvarDia('2026-09-14', { passos: 6000 }); // atualizadoEm = agora (mais recente que 2020)
    await salvarDia('2026-09-13', { passos: 5000 });
    const r = await importar({
      versao: 1,
      dia: [
        { data: '2026-09-14', passos: 1, atualizadoEm: '2020-01-01T00:00:00.000Z' }, // mais antiga: ignorada
        { data: '2026-09-13', passos: 2, atualizadoEm: '2099-01-01T00:00:00.000Z' }, // mais recente: vence
        { data: '2026-09-12', passos: 3, atualizadoEm: '2020-01-01T00:00:00.000Z' }, // não existia: gravada
      ],
    });
    expect(r).toEqual({ ok: true, contagem: { perfil: 0, dia: 2, eventoTreino: 0, eventoRefeicao: 0, semana: 0, mes: 0, exame: 0 } });
    expect((await lerDia('2026-09-14'))?.passos).toBe(6000);
    expect((await lerDia('2026-09-13'))?.passos).toBe(2);
    expect((await lerDia('2026-09-12'))?.passos).toBe(3);
  });

  it('merge do perfil segue a mesma regra', async () => {
    await salvarPerfil(PERFIL_TESTE);
    const r = await importar({ versao: 1, perfil: { ...PERFIL_TESTE, peso: 70, atualizadoEm: '2020-01-01T00:00:00.000Z' } });
    expect(r).toMatchObject({ ok: true, contagem: { perfil: 0 } });
    expect((await lerPerfil())?.peso).toBe(80);
    const r2 = await importar({ versao: 1, perfil: { ...PERFIL_TESTE, peso: 70, atualizadoEm: '2099-01-01T00:00:00.000Z' } });
    expect(r2).toMatchObject({ ok: true, contagem: { perfil: 1 } });
    expect((await lerPerfil())?.peso).toBe(70);
  });

  it('versão 2 é rejeitada e nada muda', async () => {
    await popular();
    const antes = await contarTudo();
    const r = await importar({ versao: 2, dia: [{ data: '2000-01-01', atualizadoEm: '2000-01-01T00:00:00.000Z' }] });
    expect(r).toEqual({ ok: false, motivo: 'Versão de exportação não suportada: 2 (esperada 1).' });
    expect(await contarTudo()).toEqual(antes);
    expect(await lerDia('2000-01-01')).toBeUndefined();
  });

  it('JSON malformado (string) é rejeitado com motivo', async () => {
    const r = await importar('{ isto não é json');
    expect(r).toEqual({ ok: false, motivo: 'O arquivo não é um JSON válido.' });
  });

  it('valores que não são objeto são rejeitados', async () => {
    expect(await importar(null)).toEqual({ ok: false, motivo: 'O arquivo não é um objeto de exportação.' });
    expect(await importar([1, 2])).toEqual({ ok: false, motivo: 'O arquivo não é um objeto de exportação.' });
    expect(await importar(42)).toEqual({ ok: false, motivo: 'O arquivo não é um objeto de exportação.' });
  });

  it('tabela desconhecida é rejeitada', async () => {
    const r = await importar({ versao: 1, treinos: [] });
    expect(r).toEqual({ ok: false, motivo: 'Tabela desconhecida: treinos.' });
  });

  it('tabela que não é lista é rejeitada', async () => {
    const r = await importar({ versao: 1, dia: { data: '2026-09-14' } });
    expect(r).toEqual({ ok: false, motivo: 'A tabela dia deveria ser uma lista.' });
  });

  it('linha sem chave é rejeitada antes de gravar qualquer outra linha', async () => {
    const r = await importar({
      versao: 1,
      dia: [{ data: '2026-09-14', atualizadoEm: '2026-09-14T00:00:00.000Z' }],
      semana: [{ cintura: 90 }],
    });
    expect(r).toEqual({ ok: false, motivo: 'Linha 1 da tabela semana sem o campo "semana".' });
    expect(await lerDia('2026-09-14')).toBeUndefined(); // a tabela dia, válida, também não foi gravada
  });

  it('perfil que não é objeto é rejeitado', async () => {
    expect(await importar({ versao: 1, perfil: 'eu' })).toEqual({ ok: false, motivo: 'O perfil não é um objeto.' });
  });
});
