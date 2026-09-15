import { describe, expect, it } from 'vitest';
import { bebaPelaSede } from './bebaPelaSede';
import { HOJE, ONTEM, ctxBase, diaBase, perfilBase } from './_fixtures';

/** A referência vem de derivados.coposMeta (plano 01); fixamos 8 por override. */
function ctxCopos(copos: number | undefined, coposMeta = 8) {
  return ctxBase({ hoje: diaBase(HOJE, copos === undefined ? {} : { copos }), derivados: { coposMeta } });
}

describe('beba-pela-sede', () => {
  it('aplica a todo perfil', () => {
    expect(bebaPelaSede.id).toBe('beba-pela-sede');
    expect(bebaPelaSede.aplica(perfilBase)).toBe(true);
  });

  it('pouco: 4 copos (menos de 60% de 8); próximo passo no máximo +2', () => {
    const m = bebaPelaSede.meta(ctxCopos(4));
    expect(m.zona).toBe('pouco');
    expect(m.valor).toBe(4);
    expect(m.texto).toBe('4 copos ≈ 1 L · referência 8 copos');
    expect(m.proximoPasso).toBe('mais 2 copo(s) hoje: um ao acordar e um a cada pausa de 30 min (referência 8)');
    expect(m.faixa).toEqual({ pouco: 5, meta: 8, demais: 14 });
    expect(m.posicao).toBeCloseTo(0.25, 3);
    expect(m.vals).toEqual({ copos_meta: 8, agua_meta: 2, min_treino_dia: 0 });
  });

  it('atencao: 7 copos → +1', () => {
    const m = bebaPelaSede.meta(ctxCopos(7));
    expect(m.zona).toBe('atencao');
    expect(m.proximoPasso).toBe('mais 1 copo(s) hoje: um ao acordar e um a cada pausa de 30 min (referência 8)');
  });

  it('meta: 9 copos', () => {
    const m = bebaPelaSede.meta(ctxCopos(9));
    expect(m.zona).toBe('meta');
    expect(m.texto).toBe('9 copos ≈ 2,3 L · referência 8 copos');
    expect(m.proximoPasso).toBe('na referência — a urina clara confirma');
    expect(m.posicao).toBeCloseTo(0.5625, 3);
  });

  it('demais não existe: 16 copos vira atencao', () => {
    const m = bebaPelaSede.meta(ctxCopos(16));
    expect(m.zona).toBe('atencao');
    expect(m.proximoPasso).toBe('bem acima da referência — beba pela sede');
  });

  it('sem-dado: vals traz copos_meta/agua_meta/min_treino_dia (não dependem de dia.copos)', () => {
    const m = bebaPelaSede.meta(ctxCopos(undefined));
    expect(m.zona).toBe('sem-dado');
    expect(m.precisaDe).toEqual(['dia.copos']);
    expect(m.vals).toEqual({ copos_meta: 8, agua_meta: 2, min_treino_dia: 0 });
  });

  it('a referência acompanha derivados.coposMeta', () => {
    expect(bebaPelaSede.meta(ctxCopos(9, 10)).zona).toBe('atencao');
  });

  it('usa o último dia com o campo', () => {
    const m = bebaPelaSede.meta(ctxBase({ hoje: diaBase(HOJE), dias: [diaBase(ONTEM, { copos: 9 })], derivados: { coposMeta: 8 } }));
    expect(m.deDia).toBe(ONTEM);
  });
});
