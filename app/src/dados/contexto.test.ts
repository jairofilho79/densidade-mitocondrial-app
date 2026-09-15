// @vitest-environment node
import { beforeEach, describe, expect, it } from 'vitest';
import { limparBanco, PERFIL_TESTE } from '@/dados/testes/banco';
import { salvarPerfil } from '@/dados/repositorios/perfil';
import { salvarDia } from '@/dados/repositorios/dia';
import { registrarRefeicao, registrarTreino } from '@/dados/repositorios/eventos';
import { salvarSemana } from '@/dados/repositorios/semana';
import { salvarMes } from '@/dados/repositorios/mes';
import { METAS } from '@/dominio/metas';
import { montarContexto } from './contexto';

beforeEach(limparBanco);

describe('montarContexto', () => {
  it('sem perfil retorna { semPerfil: true }', async () => {
    await salvarDia('2026-09-14', { passos: 1 });
    expect(await montarContexto('2026-09-14')).toEqual({ semPerfil: true });
  });

  it('com perfil e 3 dias monta o contexto com dias mais recentes primeiro e derivados calculados', async () => {
    await salvarPerfil(PERFIL_TESTE); // peso 80, altura 175 → imc 26,1
    await salvarDia('2026-09-12', { passos: 4000 });
    await salvarDia('2026-09-14', { passos: 6000, deitou: '23:00', levantou: '07:00' });
    await salvarDia('2026-09-13', { passos: 5000 });
    await salvarDia('2026-08-17', { passos: 9999 }); // 28 dias antes de 2026-09-14 seria 2026-08-18: fora da janela
    const agora = new Date(2026, 8, 14, 9, 0);

    const ctx = await montarContexto('2026-09-14', agora);
    expect('semPerfil' in ctx).toBe(false);
    if ('semPerfil' in ctx) return;

    expect(ctx.perfil.peso).toBe(80);
    expect(ctx.dias.length).toBe(3);
    expect(ctx.dias.map((d) => d.data)).toEqual(['2026-09-14', '2026-09-13', '2026-09-12']);
    expect(ctx.hoje?.data).toBe('2026-09-14');
    expect(ctx.hoje?.passos).toBe(6000);
    expect(ctx.derivados.imc).toBe(26.1);
    expect(ctx.derivados.sonoHoras).not.toBeNull(); // veio de deitou/levantou de 2026-09-14
    expect(ctx.eventos).toEqual([]);
    expect(ctx.refeicoes).toEqual([]);
    expect(ctx.semana).toBeUndefined();
    expect(ctx.mes).toBeUndefined();
    expect(ctx.agora).toBe(agora);
  });

  it('hoje é undefined quando o dia de hoje ainda não foi registrado', async () => {
    await salvarPerfil(PERFIL_TESTE);
    await salvarDia('2026-09-13', { passos: 5000 });
    const ctx = await montarContexto('2026-09-14');
    if ('semPerfil' in ctx) throw new Error('esperava contexto');
    expect(ctx.hoje).toBeUndefined();
    expect(ctx.dias.map((d) => d.data)).toEqual(['2026-09-13']);
  });

  it('traz eventos e refeições da janela de 28 dias, semana e mês mais recentes', async () => {
    await salvarPerfil(PERFIL_TESTE);
    await registrarTreino({ data: '2026-08-18', hora: '07:00', tipo: 'tiros', minutos: 20 }); // primeiro dia da janela
    await registrarTreino({ data: '2026-08-17', hora: '07:00', tipo: 'tiros', minutos: 20 }); // fora
    await registrarTreino({ data: '2026-09-14', hora: '07:00', tipo: 'forca', minutos: 30 });
    await registrarRefeicao({ data: '2026-09-10', hora: '12:00', proteinaG: 30 });
    await salvarSemana('2026-W37', { cintura: 92 });
    await salvarSemana('2026-W36', { cintura: 93 });
    await salvarMes('2026-09', { panturrilha: 37 });

    const ctx = await montarContexto('2026-09-14');
    if ('semPerfil' in ctx) throw new Error('esperava contexto');
    expect(ctx.eventos.map((e) => e.data)).toEqual(['2026-09-14', '2026-08-18']);
    expect(ctx.refeicoes.map((r) => r.data)).toEqual(['2026-09-10']);
    expect(ctx.semana?.semana).toBe('2026-W37');
    expect(ctx.mes?.mes).toBe('2026-09');
  });

  it('end-to-end: METAS["seis-mil-passos"].meta funciona com um contexto vindo do banco', async () => {
    await salvarPerfil(PERFIL_TESTE);
    await salvarDia('2026-09-14', { passos: 6000 });

    const ctx = await montarContexto('2026-09-14');
    if ('semPerfil' in ctx) throw new Error('esperava contexto');

    const meta = METAS['seis-mil-passos'].meta(ctx);
    expect(meta.valor).toBe(6000);
    expect(meta.zona).not.toBe('sem-dado');
  });
});
