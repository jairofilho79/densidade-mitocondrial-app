import { describe, expect, it } from 'vitest';
import { fibraNoPrato } from './fibraNoPrato';
import { HOJE, ONTEM, ctxBase, diaBase, perfilBase } from './_fixtures';

describe('fibra-no-prato', () => {
  it('aplica a todo perfil', () => {
    expect(fibraNoPrato.id).toBe('fibra-no-prato');
    expect(fibraNoPrato.aplica(perfilBase)).toBe(true);
  });

  it('pouco: 10 g; próximo passo +5 g', () => {
    const m = fibraNoPrato.meta(ctxBase({ hoje: diaBase(HOJE, { fibraG: 10 }) }));
    expect(m.zona).toBe('pouco');
    expect(m.valor).toBe(10);
    expect(m.texto).toBe('10 g/dia');
    expect(m.proximoPasso).toBe('mais 5 g/dia (15 g): uma concha de feijão ≈ 7 g, aveia 40 g ≈ 4 g; suba devagar');
    expect(m.faixa).toEqual({ pouco: 15, meta: 25, demais: 40 });
    expect(m.posicao).toBeCloseTo(0.02, 3);
  });

  it('atencao: 20 g', () => {
    const m = fibraNoPrato.meta(ctxBase({ hoje: diaBase(HOJE, { fibraG: 20 }) }));
    expect(m.zona).toBe('atencao');
    expect(m.proximoPasso).toBe('mais 5 g/dia (25 g): uma concha de feijão ≈ 7 g, aveia 40 g ≈ 4 g; suba devagar');
  });

  it('nunca salta além da meta: 22 g → 25 g', () => {
    const m = fibraNoPrato.meta(ctxBase({ hoje: diaBase(HOJE, { fibraG: 22 }) }));
    expect(m.proximoPasso).toBe('mais 5 g/dia (25 g): uma concha de feijão ≈ 7 g, aveia 40 g ≈ 4 g; suba devagar');
  });

  it('meta: 27 g', () => {
    const m = fibraNoPrato.meta(ctxBase({ hoje: diaBase(HOJE, { fibraG: 27 }) }));
    expect(m.zona).toBe('meta');
    expect(m.proximoPasso).toBe('na meta');
    expect(m.posicao).toBeCloseTo(0.625, 3);
  });

  it('demais: 45 g', () => {
    const m = fibraNoPrato.meta(ctxBase({ hoje: diaBase(HOJE, { fibraG: 45 }) }));
    expect(m.zona).toBe('demais');
    expect(m.proximoPasso).toBe('acima de 40 g não há ganho extra');
  });

  it('sem-dado', () => {
    const m = fibraNoPrato.meta(ctxBase({ hoje: diaBase(HOJE) }));
    expect(m.zona).toBe('sem-dado');
    expect(m.precisaDe).toEqual(['dia.fibraG']);
  });

  it('usa o último dia com o campo', () => {
    const m = fibraNoPrato.meta(ctxBase({ hoje: diaBase(HOJE), dias: [diaBase(ONTEM, { fibraG: 27 })] }));
    expect(m.deDia).toBe(ONTEM);
  });
});
