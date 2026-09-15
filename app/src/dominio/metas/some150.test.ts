import { describe, expect, it } from 'vitest';
import { some150 } from './some150';
import { ctxBase, eventoBase, perfilBase, semanaBase } from './_fixtures';

describe('some-150', () => {
  it('aplica a todo perfil', () => {
    expect(some150.id).toBe('some-150');
    expect(some150.aplica(perfilBase)).toBe(true);
  });

  it('pouco: sem revisão, soma eventos moderados dos últimos 7 dias + tiros × 20', () => {
    const m = some150.meta(
      ctxBase({
        eventos: [
          eventoBase('2026-09-15', 'moderado', 30),
          eventoBase('2026-09-12', 'moderado', 30), // dentro dos 7 dias (limite 11/09)
          eventoBase('2026-09-14', 'tiros', 10),
          eventoBase('2026-09-01', 'moderado', 100), // fora da janela de 7 dias
        ],
      }),
    );
    expect(m.zona).toBe('pouco');
    expect(m.valor).toBe(80);
    expect(m.texto).toBe('80 min/sem (tiros contam em dobro)');
    expect(m.proximoPasso).toBe('faltam 70 min: a caminhada pós-jantar de 10 min × 5 dias fecha 50');
    expect(m.posicao).toBeCloseTo(0.383, 2);
    expect(m.faixa).toEqual({ pouco: 150, meta: 300, demais: 600 });
  });

  it('atencao: revisão 320 min + 1 sessão de tiros = 340', () => {
    const m = some150.meta(ctxBase({ semana: semanaBase({ minAtiv: 320, sessoesTiros: 1 }) }));
    expect(m.zona).toBe('atencao');
    expect(m.valor).toBe(340);
    expect(m.proximoPasso).toBe('acima de 300 o retorno para de crescer — ok, sem ganho extra');
  });

  it('meta: revisão 150 + 3 tiros = 210', () => {
    const m = some150.meta(ctxBase({ semana: semanaBase({ minAtiv: 150, sessoesTiros: 3 }) }));
    expect(m.zona).toBe('meta');
    expect(m.valor).toBe(210);
    expect(m.posicao).toBeCloseTo(0.6, 3);
    expect(m.proximoPasso).toBe('manter; se quiser mais, até 300 ainda rende');
  });

  it('revisão sem sessoesTiros usa a contagem de eventos de tiros da semana', () => {
    const m = some150.meta(
      ctxBase({
        semana: semanaBase({ minAtiv: 100 }),
        eventos: [eventoBase('2026-09-14', 'tiros'), eventoBase('2026-09-16', 'tiros')],
      }),
    );
    expect(m.valor).toBe(140);
    expect(m.zona).toBe('pouco');
    expect(m.proximoPasso).toBe('faltam 10 min: a caminhada pós-jantar de 10 min × 5 dias fecha 10');
  });

  it('demais: 700 min', () => {
    const m = some150.meta(ctxBase({ semana: semanaBase({ minAtiv: 700, sessoesTiros: 0 }) }));
    expect(m.zona).toBe('demais');
    expect(m.posicao).toBeCloseTo(0.98, 3);
  });

  it('sem-dado: sem revisão e sem eventos', () => {
    const m = some150.meta(ctxBase());
    expect(m.zona).toBe('sem-dado');
    expect(m.precisaDe).toEqual(['semana.minAtiv']);
  });
});
