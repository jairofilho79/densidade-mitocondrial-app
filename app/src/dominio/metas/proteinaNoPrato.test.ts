import { describe, expect, it } from 'vitest';
import { proteinaNoPrato } from './proteinaNoPrato';
import { HOJE, ONTEM, ctxBase, diaBase, perfilBase } from './_fixtures';

// perfilBase pesa 90 kg → pouco < 72 g, meta 108–198 g (1,2–2,2 g/kg), barra entre 108 e 144

describe('proteina-no-prato', () => {
  it('aplica a todo perfil', () => {
    expect(proteinaNoPrato.id).toBe('proteina-no-prato');
    expect(proteinaNoPrato.aplica(perfilBase)).toBe(true);
  });

  it('pouco: 60 g; próximo passo +10 g', () => {
    const m = proteinaNoPrato.meta(ctxBase({ hoje: diaBase(HOJE, { proteinaG: 60 }) }));
    expect(m.zona).toBe('pouco');
    expect(m.valor).toBe(60);
    expect(m.texto).toBe('60 g/dia (0.7 g/kg)');
    expect(m.proximoPasso).toBe('mais 10 g/dia (70 g): um ovo ≈ 6 g, 100 g de frango ≈ 30 g, uma dose de whey ≈ 25 g');
    expect(m.faixa).toEqual({ pouco: 72, meta: 108, demais: 198 });
    expect(m.posicao).toBeCloseTo(0.167, 2);
  });

  it('atencao: 100 g', () => {
    const m = proteinaNoPrato.meta(ctxBase({ hoje: diaBase(HOJE, { proteinaG: 100 }) }));
    expect(m.zona).toBe('atencao');
    expect(m.texto).toBe('100 g/dia (1.1 g/kg)');
    expect(m.proximoPasso).toBe('mais 10 g/dia (108 g): um ovo ≈ 6 g, 100 g de frango ≈ 30 g, uma dose de whey ≈ 25 g');
  });

  it('nunca salta além da meta: 105 g → 108 g', () => {
    const m = proteinaNoPrato.meta(ctxBase({ hoje: diaBase(HOJE, { proteinaG: 105 }) }));
    expect(m.proximoPasso).toBe('mais 10 g/dia (108 g): um ovo ≈ 6 g, 100 g de frango ≈ 30 g, uma dose de whey ≈ 25 g');
  });

  it('meta: 120 g', () => {
    const m = proteinaNoPrato.meta(ctxBase({ hoje: diaBase(HOJE, { proteinaG: 120 }) }));
    expect(m.zona).toBe('meta');
    expect(m.texto).toBe('120 g/dia (1.3 g/kg)');
    expect(m.proximoPasso).toBe('na meta');
    expect(m.posicao).toBeCloseTo(0.583, 2);
  });

  it('demais: 220 g', () => {
    const m = proteinaNoPrato.meta(ctxBase({ hoje: diaBase(HOJE, { proteinaG: 220 }) }));
    expect(m.zona).toBe('demais');
    expect(m.proximoPasso).toBe('acima do que traz benefício; pode reduzir');
  });

  it('sem-dado', () => {
    const m = proteinaNoPrato.meta(ctxBase({ hoje: diaBase(HOJE) }));
    expect(m.zona).toBe('sem-dado');
    expect(m.precisaDe).toEqual(['dia.proteinaG']);
  });

  it('usa o último dia com o campo', () => {
    const m = proteinaNoPrato.meta(ctxBase({ hoje: diaBase(HOJE), dias: [diaBase(ONTEM, { proteinaG: 120 })] }));
    expect(m.deDia).toBe(ONTEM);
  });
});
