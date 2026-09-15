import { describe, expect, it } from 'vitest';
import { pergunteAFome } from './pergunteAFome';
import { HOJE, ONTEM, ctxBase, diaBase, perfilBase } from './_fixtures';

describe('pergunte-a-fome (só registro)', () => {
  it('aplica a todo perfil', () => {
    expect(pergunteAFome.id).toBe('pergunte-a-fome');
    expect(pergunteAFome.aplica(perfilBase)).toBe(true);
  });

  it('meta: hoje tem fome e comiSemFome', () => {
    const m = pergunteAFome.meta(ctxBase({ hoje: diaBase(HOJE, { fome: 6, comiSemFome: false }) }));
    expect(m).toEqual({
      zona: 'meta',
      valor: null,
      faixa: null,
      posicao: null,
      texto: 'registrado',
      proximoPasso: 'manter o registro diário',
    });
  });

  it('sem-dado: só a fome', () => {
    const m = pergunteAFome.meta(ctxBase({ hoje: diaBase(HOJE, { fome: 6 }) }));
    expect(m.zona).toBe('sem-dado');
    expect(m.precisaDe).toEqual(['dia.fome', 'dia.comiSemFome']);
    expect(m.texto).toBe('sem registro hoje');
  });

  it('sem-dado: sem dia de hoje; ontem não conta', () => {
    expect(pergunteAFome.meta(ctxBase()).zona).toBe('sem-dado');
    expect(
      pergunteAFome.meta(ctxBase({ hoje: diaBase(HOJE), dias: [diaBase(ONTEM, { fome: 3, comiSemFome: true })] })).zona,
    ).toBe('sem-dado');
  });

  it('nunca é pouco, atencao ou demais', () => {
    const z = pergunteAFome.meta(ctxBase({ hoje: diaBase(HOJE, { fome: 10, comiSemFome: true }) })).zona;
    expect(z).toBe('meta');
  });
});
