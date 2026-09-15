import { describe, expect, it } from 'vitest';
import { seBeber } from './seBeber';
import { HOJE, ONTEM, ctxBase, diaBase, perfilBase, semanaBase } from './_fixtures';

describe('se-beber', () => {
  it('aplica só quando o perfil bebe', () => {
    expect(seBeber.id).toBe('se-beber');
    expect(seBeber.aplica({ ...perfilBase, alcool: 'nao' })).toBe(false);
    expect(seBeber.aplica({ ...perfilBase, alcool: 'as-vezes' })).toBe(true);
    expect(seBeber.aplica({ ...perfilBase, alcool: 'regular' })).toBe(true);
  });

  it('pouco não existe: zero pela revisão é meta', () => {
    const m = seBeber.meta(ctxBase({ semana: semanaBase({ alcoolDoses: 0 }) }));
    expect(m.zona).toBe('meta');
    expect(m.valor).toBe(0);
    expect(m.texto).toBe('0 doses/sem');
    expect(m.proximoPasso).toBe('zero — manter');
    expect(m.posicao).toBe(0.12);
    expect(m.faixa).toEqual({ pouco: 0, meta: 7, demais: 7 });
  });

  it('atencao: 3 doses', () => {
    const m = seBeber.meta(ctxBase({ semana: semanaBase({ alcoolDoses: 3 }) }));
    expect(m.zona).toBe('atencao');
    expect(m.proximoPasso).toBe('dentro da faixa; nunca nas horas antes de deitar');
    expect(m.posicao).toBe(0.5);
  });

  it('meta: dias com null (não bebi) somam zero', () => {
    const m = seBeber.meta(
      ctxBase({ hoje: diaBase(HOJE, { alcoolDoses: null }), dias: [diaBase(ONTEM, { alcoolDoses: null })] }),
    );
    expect(m.zona).toBe('meta');
    expect(m.valor).toBe(0);
  });

  it('demais: 4 + 5 nos últimos 7 dias (dia antigo ignorado)', () => {
    const m = seBeber.meta(
      ctxBase({
        hoje: diaBase(HOJE, { alcoolDoses: 4 }),
        dias: [diaBase(ONTEM, { alcoolDoses: 5 }), diaBase('2026-09-01', { alcoolDoses: 20 })],
      }),
    );
    expect(m.zona).toBe('demais');
    expect(m.valor).toBe(9);
    expect(m.posicao).toBe(0.9);
    expect(m.proximoPasso).toBe('uma dose a menos por semana, começando pelas da noite');
  });

  it('sem-dado', () => {
    const m = seBeber.meta(ctxBase({ hoje: diaBase(HOJE) }));
    expect(m.zona).toBe('sem-dado');
    expect(m.precisaDe).toEqual(['dia.alcoolDoses']);
  });
});
