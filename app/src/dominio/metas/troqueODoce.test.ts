import { describe, expect, it } from 'vitest';
import { troqueODoce } from './troqueODoce';
import { HOJE, ONTEM, ctxBase, diaBase, perfilBase, semanaBase } from './_fixtures';

describe('troque-o-doce', () => {
  it('aplica a todo perfil', () => {
    expect(troqueODoce.id).toBe('troque-o-doce');
    expect(troqueODoce.aplica(perfilBase)).toBe(true);
  });

  it('pouco não existe: zero pela revisão é meta', () => {
    const m = troqueODoce.meta(ctxBase({ semana: semanaBase({ docesSemana: 0 }) }));
    expect(m.zona).toBe('meta');
    expect(m.valor).toBe(0);
    expect(m.texto).toBe('0 bebidas doces/sem');
    expect(m.proximoPasso).toBe('manter');
    expect(m.posicao).toBe(0.1);
    expect(m.faixa).toEqual({ pouco: 0, meta: 1, demais: 3 });
  });

  it('atencao: 2 por semana; troca no máximo 2', () => {
    const m = troqueODoce.meta(ctxBase({ semana: semanaBase({ docesSemana: 2 }) }));
    expect(m.zona).toBe('atencao');
    expect(m.proximoPasso).toBe('trocar 2 por semana por água com gás ou fruta inteira');
    expect(m.posicao).toBe(0.5);
    expect(troqueODoce.meta(ctxBase({ semana: semanaBase({ docesSemana: 1 }) })).proximoPasso).toBe(
      'trocar 1 por semana por água com gás ou fruta inteira',
    );
  });

  it('meta: soma dos dias dá zero', () => {
    const m = troqueODoce.meta(
      ctxBase({ hoje: diaBase(HOJE, { bebidaDoce: 0 }), dias: [diaBase(ONTEM, { bebidaDoce: 0 })] }),
    );
    expect(m.zona).toBe('meta');
    expect(m.valor).toBe(0);
  });

  it('demais: soma dos últimos 7 dias = 5 (dia antigo ignorado)', () => {
    const m = troqueODoce.meta(
      ctxBase({
        hoje: diaBase(HOJE, { bebidaDoce: 3 }),
        dias: [diaBase(ONTEM, { bebidaDoce: 2 }), diaBase('2026-09-01', { bebidaDoce: 10 })],
      }),
    );
    expect(m.zona).toBe('demais');
    expect(m.valor).toBe(5);
    expect(m.posicao).toBe(0.9);
    expect(m.proximoPasso).toBe('trocar 2 por semana por água com gás ou fruta inteira');
  });

  it('revisão de outra semana é ignorada; usa os dias', () => {
    const m = troqueODoce.meta(
      ctxBase({ semana: semanaBase({ semana: '2026-W36', docesSemana: 9 }), hoje: diaBase(HOJE, { bebidaDoce: 1 }) }),
    );
    expect(m.valor).toBe(1);
  });

  it('sem-dado', () => {
    const m = troqueODoce.meta(ctxBase({ hoje: diaBase(HOJE) }));
    expect(m.zona).toBe('sem-dado');
    expect(m.precisaDe).toEqual(['dia.bebidaDoce']);
  });
});
