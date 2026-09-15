import { describe, expect, it } from 'vitest';
import { andeDepoisDoJantar } from './andeDepoisDoJantar';
import { HOJE, ONTEM, ctxBase, diaBase, perfilBase } from './_fixtures';

describe('ande-depois-do-jantar', () => {
  it('aplica a todo perfil', () => {
    expect(andeDepoisDoJantar.id).toBe('ande-depois-do-jantar');
    expect(andeDepoisDoJantar.aplica(perfilBase)).toBe(true);
  });

  it('pouco: 0 min', () => {
    const m = andeDepoisDoJantar.meta(ctxBase({ hoje: diaBase(HOJE, { minPosJantar: 0 }) }));
    expect(m.zona).toBe('pouco');
    expect(m.valor).toBe(0);
    expect(m.texto).toBe('0 min depois do jantar');
    expect(m.proximoPasso).toBe('5 minutos de pé andando na sala, hoje');
    expect(m.posicao).toBe(0.06);
    expect(m.faixa).toEqual({ pouco: 0, meta: 10, demais: 30 });
  });

  it('atencao: 4 min, próximo passo +5 sem passar de 10', () => {
    const m = andeDepoisDoJantar.meta(ctxBase({ hoje: diaBase(HOJE, { minPosJantar: 4 }) }));
    expect(m.zona).toBe('atencao');
    expect(m.proximoPasso).toBe('chegar a 9 min (mais 5 que da última vez)');
    expect(m.posicao).toBe(0.25);

    const m2 = andeDepoisDoJantar.meta(ctxBase({ hoje: diaBase(HOJE, { minPosJantar: 8 }) }));
    expect(m2.proximoPasso).toBe('chegar a 10 min (mais 5 que da última vez)');
  });

  it('meta: 15 min', () => {
    const m = andeDepoisDoJantar.meta(ctxBase({ hoje: diaBase(HOJE, { minPosJantar: 15 }) }));
    expect(m.zona).toBe('meta');
    expect(m.proximoPasso).toBe('manter; se quiser, até 30 min');
    expect(m.posicao).toBe(0.5);
  });

  it('demais não existe: 45 min continua na meta', () => {
    const m = andeDepoisDoJantar.meta(ctxBase({ hoje: diaBase(HOJE, { minPosJantar: 45 }) }));
    expect(m.zona).toBe('meta');
  });

  it('sem-dado', () => {
    const m = andeDepoisDoJantar.meta(ctxBase({ hoje: diaBase(HOJE) }));
    expect(m.zona).toBe('sem-dado');
    expect(m.precisaDe).toEqual(['dia.minPosJantar']);
  });

  it('usa o último dia com o campo', () => {
    const m = andeDepoisDoJantar.meta(ctxBase({ hoje: diaBase(HOJE), dias: [diaBase(ONTEM, { minPosJantar: 12 })] }));
    expect(m.valor).toBe(12);
    expect(m.deDia).toBe(ONTEM);
  });
});
