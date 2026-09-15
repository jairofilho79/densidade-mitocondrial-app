// @vitest-environment node
import { beforeEach, describe, expect, it } from 'vitest';
import { limparBanco, PERFIL_TESTE } from '@/dados/testes/banco';
import { lerPerfil, salvarPerfil } from './perfil';
import { diasRecentes, lerDia, salvarDia } from './dia';

beforeEach(limparBanco);

describe('perfil', () => {
  it('sem perfil retorna undefined', async () => {
    expect(await lerPerfil()).toBeUndefined();
  });

  it('salva com atualizadoEm e lê de volta sem o id interno', async () => {
    const salvo = await salvarPerfil(PERFIL_TESTE);
    expect(salvo.atualizadoEm).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    const lido = await lerPerfil();
    expect(lido).toEqual(salvo);
    expect(lido).not.toHaveProperty('id');
  });

  it('salvar de novo substitui (chave fixa "me")', async () => {
    await salvarPerfil(PERFIL_TESTE);
    await salvarPerfil({ ...PERFIL_TESTE, peso: 78 });
    expect((await lerPerfil())?.peso).toBe(78);
  });
});

describe('dia', () => {
  it('lerDia de data sem registro retorna undefined', async () => {
    expect(await lerDia('2026-09-14')).toBeUndefined();
  });

  it('salvarDia cria, faz merge e atualiza atualizadoEm', async () => {
    const primeiro = await salvarDia('2026-09-14', { passos: 5000, fome: 4 });
    expect(primeiro).toMatchObject({ data: '2026-09-14', passos: 5000, fome: 4 });
    expect(primeiro.atualizadoEm).toMatch(/^\d{4}-\d{2}-\d{2}T/);

    await new Promise((r) => setTimeout(r, 5));
    const segundo = await salvarDia('2026-09-14', { copos: 6, fome: 7 });
    expect(segundo).toMatchObject({ data: '2026-09-14', passos: 5000, fome: 7, copos: 6 });
    expect(segundo.atualizadoEm > primeiro.atualizadoEm).toBe(true);
    expect(await lerDia('2026-09-14')).toEqual(segundo);
  });

  it('salvarDia aceita null como "não se aplica hoje"', async () => {
    await salvarDia('2026-09-14', { ultimoCafe: null, alcoolDoses: null });
    const dia = await lerDia('2026-09-14');
    expect(dia?.ultimoCafe).toBeNull();
    expect(dia?.alcoolDoses).toBeNull();
  });

  it('diasRecentes devolve a janela [ate − (n−1), ate], mais recente primeiro, só dias existentes', async () => {
    for (const data of ['2026-09-10', '2026-09-12', '2026-09-14', '2026-09-15', '2026-09-07']) {
      await salvarDia(data, { passos: 1 });
    }
    const dias = await diasRecentes('2026-09-14', 7); // 2026-09-08 … 2026-09-14
    expect(dias.map((d) => d.data)).toEqual(['2026-09-14', '2026-09-12', '2026-09-10']);
  });

  it('diasRecentes com n = 1 devolve só o próprio dia', async () => {
    await salvarDia('2026-09-13', { passos: 1 });
    await salvarDia('2026-09-14', { passos: 2 });
    expect((await diasRecentes('2026-09-14', 1)).map((d) => d.data)).toEqual(['2026-09-14']);
  });
});
