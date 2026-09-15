import { describe, expect, it } from 'vitest';
import { panturrilhaPreensao } from './panturrilhaPreensao';
import { ctxBase, mesBase, perfilBase } from './_fixtures';

describe('panturrilha-preensao (só registro)', () => {
  it('aplica a todo perfil', () => {
    expect(panturrilhaPreensao.id).toBe('panturrilha-preensao');
    expect(panturrilhaPreensao.aplica(perfilBase)).toBe(true);
  });

  it('meta: o mês tem panturrilha', () => {
    const m = panturrilhaPreensao.meta(ctxBase({ mes: mesBase({ panturrilha: 38 }) }));
    expect(m).toEqual({
      zona: 'meta',
      valor: 38,
      faixa: null,
      posicao: null,
      texto: 'panturrilha 38 cm registrada (2026-09)',
      proximoPasso: 'medir de novo na primeira segunda do próximo mês',
    });
  });

  it('meta: com preensão o texto cita as duas', () => {
    const m = panturrilhaPreensao.meta(ctxBase({ mes: mesBase({ panturrilha: 38, preensao: 40 }) }));
    expect(m.texto).toBe('panturrilha 38 cm e preensão 40 kg registradas (2026-09)');
  });

  it('sem-dado: mês só com preensão', () => {
    const m = panturrilhaPreensao.meta(ctxBase({ mes: mesBase({ preensao: 40 }) }));
    expect(m.zona).toBe('sem-dado');
    expect(m.precisaDe).toEqual(['mes.panturrilha']);
    expect(m.texto).toBe('sem medida este mês');
  });

  it('sem-dado: sem mês', () => {
    expect(panturrilhaPreensao.meta(ctxBase()).zona).toBe('sem-dado');
  });

  it('nunca é pouco, atencao ou demais', () => {
    expect(panturrilhaPreensao.meta(ctxBase({ mes: mesBase({ panturrilha: 30 }) })).zona).toBe('meta');
    expect(panturrilhaPreensao.meta(ctxBase({ mes: mesBase({ panturrilha: 45 }) })).zona).toBe('meta');
  });
});
