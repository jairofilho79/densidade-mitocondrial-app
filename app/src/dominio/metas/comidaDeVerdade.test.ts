import { describe, expect, it } from 'vitest';
import { comidaDeVerdade } from './comidaDeVerdade';
import { HOJE, ONTEM, ctxBase, diaBase, perfilBase } from './_fixtures';

describe('comida-de-verdade', () => {
  it('aplica a todo perfil', () => {
    expect(comidaDeVerdade.id).toBe('comida-de-verdade');
    expect(comidaDeVerdade.aplica(perfilBase)).toBe(true);
  });

  it('pouco: 0 de 3', () => {
    const m = comidaDeVerdade.meta(ctxBase({ hoje: diaBase(HOJE, { refeicoesCozinhadas: 0 }) }));
    expect(m.zona).toBe('pouco');
    expect(m.valor).toBe(0);
    expect(m.texto).toBe('0 de 3 refeições de ingredientes');
    expect(m.proximoPasso).toBe('uma refeição a mais de ingredientes: a mais fácil é o café da manhã');
    expect(m.posicao).toBe(0.06);
    expect(m.faixa).toEqual({ pouco: 0, meta: 2, demais: 3 });
  });

  it('atencao: 1 de 3', () => {
    const m = comidaDeVerdade.meta(ctxBase({ hoje: diaBase(HOJE, { refeicoesCozinhadas: 1 }) }));
    expect(m.zona).toBe('atencao');
    expect(m.posicao).toBe(0.25);
    expect(m.proximoPasso).toBe('uma refeição a mais de ingredientes: a mais fácil é o café da manhã');
  });

  it('meta: 2 de 3', () => {
    const m = comidaDeVerdade.meta(ctxBase({ hoje: diaBase(HOJE, { refeicoesCozinhadas: 2 }) }));
    expect(m.zona).toBe('meta');
    expect(m.proximoPasso).toBe('manter');
    expect(m.posicao).toBe(0.55);
  });

  it('demais não existe: 3 de 3 é meta', () => {
    expect(comidaDeVerdade.meta(ctxBase({ hoje: diaBase(HOJE, { refeicoesCozinhadas: 3 }) })).zona).toBe('meta');
  });

  it('sem-dado', () => {
    const m = comidaDeVerdade.meta(ctxBase({ hoje: diaBase(HOJE) }));
    expect(m.zona).toBe('sem-dado');
    expect(m.precisaDe).toEqual(['dia.refeicoesCozinhadas']);
  });

  it('usa o último dia com o campo', () => {
    const m = comidaDeVerdade.meta(
      ctxBase({ hoje: diaBase(HOJE), dias: [diaBase(ONTEM, { refeicoesCozinhadas: 2 })] }),
    );
    expect(m.deDia).toBe(ONTEM);
  });
});
