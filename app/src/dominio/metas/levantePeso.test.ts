import { describe, expect, it } from 'vitest';
import { levantePeso } from './levantePeso';
import { ctxBase, eventoBase, perfilBase, semanaBase } from './_fixtures';

describe('levante-peso', () => {
  it('aplica a todo perfil', () => {
    expect(levantePeso.id).toBe('levante-peso');
    expect(levantePeso.aplica(perfilBase)).toBe(true);
  });

  it('pouco: há treinos na janela mas nenhum de força nesta semana', () => {
    const m = levantePeso.meta(ctxBase({ eventos: [eventoBase('2026-09-15', 'moderado', 30)] }));
    expect(m.zona).toBe('pouco');
    expect(m.valor).toBe(0);
    expect(m.texto).toBe('0 sessões/sem');
    expect(m.posicao).toBeCloseTo(0.02, 3);
    expect(m.proximoPasso).toBe('uma sessão de 20 min em casa nesta semana: agachamento, flexão, remada');
    expect(m.faixa).toEqual({ pouco: 1, meta: 2, demais: 3 });
  });

  it('atencao: 1 sessão de força', () => {
    const m = levantePeso.meta(ctxBase({ eventos: [eventoBase('2026-09-16', 'forca', 25)] }));
    expect(m.zona).toBe('atencao');
    expect(m.valor).toBe(1);
    expect(m.texto).toBe('1 sessão/sem');
    expect(m.posicao).toBeCloseTo(0.25, 3);
    expect(m.proximoPasso).toBe('uma sessão de 20 min em casa nesta semana: agachamento, flexão, remada');
  });

  it('meta: 2 sessões nesta semana; a da semana passada não conta', () => {
    const m = levantePeso.meta(
      ctxBase({
        eventos: [eventoBase('2026-09-14', 'forca'), eventoBase('2026-09-16', 'forca'), eventoBase('2026-09-11', 'forca')],
      }),
    );
    expect(m.zona).toBe('meta');
    expect(m.valor).toBe(2);
    expect(m.posicao).toBeCloseTo(0.5, 3);
    expect(m.proximoPasso).toBe('anotar repetições até falhar num exercício fixo');
  });

  it('demais: revisão diz 4', () => {
    const m = levantePeso.meta(ctxBase({ semana: semanaBase({ sessoesForca: 4 }) }));
    expect(m.zona).toBe('demais');
    expect(m.proximoPasso).toBe('garantir 48 h entre sessões do mesmo grupo');
  });

  it('sem-dado: nada registrado', () => {
    const m = levantePeso.meta(ctxBase());
    expect(m.zona).toBe('sem-dado');
    expect(m.precisaDe).toEqual(['semana.sessoesForca']);
  });
});
