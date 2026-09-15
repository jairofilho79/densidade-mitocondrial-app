import { describe, expect, it } from 'vitest';
import { mecaACintura } from './mecaACintura';
import { ctxBase, perfilBase, semanaBase } from './_fixtures';

describe('meca-a-cintura (só registro)', () => {
  it('aplica a todo perfil', () => {
    expect(mecaACintura.id).toBe('meca-a-cintura');
    expect(mecaACintura.aplica(perfilBase)).toBe(true);
  });

  it('meta: a semana mais recente tem cintura', () => {
    const m = mecaACintura.meta(ctxBase({ semana: semanaBase({ cintura: 100 }) }));
    expect(m).toEqual({
      zona: 'meta',
      valor: 100,
      faixa: null,
      posicao: null,
      texto: 'cintura registrada: 100 cm',
      proximoPasso: 'medir de novo na próxima segunda',
      vals: { cintura_ideal: 88, altura: 175, corte_cintura: 88, cintura: 100 },
    });
  });

  it('meta: vale a semana mais recente mesmo que não seja a corrente; texto não cita a chave ISO', () => {
    const m = mecaACintura.meta(ctxBase({ semana: semanaBase({ semana: '2026-W37', cintura: 101 }) }));
    expect(m.zona).toBe('meta');
    expect(m.texto).toBe('cintura registrada: 101 cm');
    expect(m.texto).not.toContain('W37');
  });

  it('sem-dado: semana sem cintura; vals traz o que depende só do perfil', () => {
    const m = mecaACintura.meta(ctxBase({ semana: semanaBase({ sessoesTiros: 2 }) }));
    expect(m.zona).toBe('sem-dado');
    expect(m.precisaDe).toEqual(['semana.cintura']);
    expect(m.texto).toBe('sem medida esta semana');
    expect(m.vals).toEqual({ cintura_ideal: 88, altura: 175, corte_cintura: 88 });
  });

  it('sem-dado: sem semana', () => {
    expect(mecaACintura.meta(ctxBase()).zona).toBe('sem-dado');
  });

  it('nunca é pouco, atencao ou demais', () => {
    expect(mecaACintura.meta(ctxBase({ semana: semanaBase({ cintura: 130 }) })).zona).toBe('meta');
    expect(mecaACintura.meta(ctxBase({ semana: semanaBase({ cintura: 60 }) })).zona).toBe('meta');
  });
});
