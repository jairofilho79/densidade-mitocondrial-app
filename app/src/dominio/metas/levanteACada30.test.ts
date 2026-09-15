import { describe, expect, it } from 'vitest';
import { levanteACada30 } from './levanteACada30';
import { HOJE, ONTEM, ctxBase, diaBase, perfilBase } from './_fixtures';

describe('levante-a-cada-30', () => {
  it('aplica a todo perfil', () => {
    expect(levanteACada30.id).toBe('levante-a-cada-30');
    expect(levanteACada30.aplica(perfilBase)).toBe(true);
  });

  it('pouco: bloco de 90 min', () => {
    const m = levanteACada30.meta(ctxBase({ hoje: diaBase(HOJE, { maiorBloco: 90 }) }));
    expect(m.zona).toBe('pouco');
    expect(m.valor).toBe(90);
    expect(m.texto).toBe('maior bloco: 90 min');
    expect(m.proximoPasso).toBe('um alarme em 60 min esta semana; depois em 30');
    expect(m.posicao).toBe(0.08);
    expect(m.faixa).toEqual({ pouco: 60, meta: 30, demais: 30 });
    expect(m.deDia).toBeUndefined();
  });

  it('atencao: bloco de 45 min; o alarme nunca vai abaixo de 30', () => {
    const m = levanteACada30.meta(ctxBase({ hoje: diaBase(HOJE, { maiorBloco: 45 }) }));
    expect(m.zona).toBe('atencao');
    expect(m.proximoPasso).toBe('um alarme em 30 min esta semana; depois em 30');
    expect(m.posicao).toBe(0.25);
  });

  it('meta: bloco de 25 min', () => {
    const m = levanteACada30.meta(ctxBase({ hoje: diaBase(HOJE, { maiorBloco: 25 }) }));
    expect(m.zona).toBe('meta');
    expect(m.proximoPasso).toBe('manter');
    expect(m.posicao).toBe(0.5);
  });

  it('demais não existe: bloco de 5 min continua na meta', () => {
    const m = levanteACada30.meta(ctxBase({ hoje: diaBase(HOJE, { maiorBloco: 5 }) }));
    expect(m.zona).toBe('meta');
  });

  it('sem-dado: nenhum dia com maiorBloco', () => {
    const m = levanteACada30.meta(ctxBase({ hoje: diaBase(HOJE, { levantadas: 4 }) }));
    expect(m.zona).toBe('sem-dado');
    expect(m.precisaDe).toEqual(['dia.maiorBloco']);
  });

  it('cita as levantadas de hoje no texto e diz de que dia é o bloco', () => {
    const m = levanteACada30.meta(
      ctxBase({ hoje: diaBase(HOJE, { levantadas: 6 }), dias: [diaBase(ONTEM, { maiorBloco: 40 })] }),
    );
    expect(m.texto).toBe('maior bloco: 40 min · levantou 6× hoje');
    expect(m.deDia).toBe(ONTEM);
  });
});
