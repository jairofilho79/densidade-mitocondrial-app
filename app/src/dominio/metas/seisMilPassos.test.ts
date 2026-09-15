import { describe, expect, it } from 'vitest';
import { seisMilPassos } from './seisMilPassos';
import { HOJE, ONTEM, ctxBase, diaBase, perfilBase } from './_fixtures';

describe('seis-mil-passos', () => {
  it('aplica a todo perfil', () => {
    expect(seisMilPassos.id).toBe('seis-mil-passos');
    expect(seisMilPassos.aplica(perfilBase)).toBe(true);
  });

  it('pouco: abaixo de 2 mil; próximo passo +500', () => {
    const m = seisMilPassos.meta(ctxBase({ hoje: diaBase(HOJE, { passos: 1500 }) }));
    expect(m.zona).toBe('pouco');
    expect(m.valor).toBe(1500);
    expect(m.texto).toBe('1500 passos/dia');
    expect(m.proximoPasso).toBe('meta desta semana: 2000 passos/dia (+500)');
    expect(m.faixa).toEqual({ pouco: 2000, meta: 5000, demais: 10000 });
    expect(m.posicao).toBeCloseTo(0.062, 2);
    expect(m.deDia).toBeUndefined();
  });

  it('atencao: 3540 → próximo passo 4000 (arredonda à centena)', () => {
    const m = seisMilPassos.meta(ctxBase({ hoje: diaBase(HOJE, { passos: 3540 }) }));
    expect(m.zona).toBe('atencao');
    expect(m.proximoPasso).toBe('meta desta semana: 4000 passos/dia (+500)');
  });

  it('nunca salta para além da meta: 4800 → 5000', () => {
    const m = seisMilPassos.meta(ctxBase({ hoje: diaBase(HOJE, { passos: 4800 }) }));
    expect(m.proximoPasso).toBe('meta desta semana: 5000 passos/dia (+500)');
  });

  it('meta: 6 mil', () => {
    const m = seisMilPassos.meta(ctxBase({ hoje: diaBase(HOJE, { passos: 6000 }) }));
    expect(m.zona).toBe('meta');
    expect(m.posicao).toBeCloseTo(0.625, 3);
    expect(m.proximoPasso).toBe('na meta; 7–10 mil ainda soma');
  });

  it('demais não existe: 12 mil continua na meta, com texto de inflexão', () => {
    const m = seisMilPassos.meta(ctxBase({ hoje: diaBase(HOJE, { passos: 12000 }) }));
    expect(m.zona).toBe('meta');
    expect(m.proximoPasso).toBe('acima da inflexão — manter');
    expect(m.posicao).toBeCloseTo(0.98, 3);
  });

  it('sem-dado: nenhum dia com passos', () => {
    const m = seisMilPassos.meta(ctxBase({ hoje: diaBase(HOJE) }));
    expect(m.zona).toBe('sem-dado');
    expect(m.valor).toBeNull();
    expect(m.precisaDe).toEqual(['dia.passos']);
  });

  it('usa o último dia com o campo e diz de que dia é', () => {
    const m = seisMilPassos.meta(ctxBase({ hoje: diaBase(HOJE), dias: [diaBase(ONTEM, { passos: 4000 })] }));
    expect(m.valor).toBe(4000);
    expect(m.deDia).toBe(ONTEM);
  });
});
