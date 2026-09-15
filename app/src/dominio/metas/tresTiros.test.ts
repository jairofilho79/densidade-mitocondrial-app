import { describe, expect, it } from 'vitest';
import { tresTiros } from './tresTiros';
import { ctxBase, eventoBase, perfilBase, semanaBase } from './_fixtures';

describe('tres-tiros', () => {
  it('aplica a todo perfil', () => {
    expect(tresTiros.id).toBe('tres-tiros');
    expect(tresTiros.aplica(perfilBase)).toBe(true);
  });

  it('pouco: 1 sessão de tiros nesta semana', () => {
    const m = tresTiros.meta(ctxBase({ eventos: [eventoBase('2026-09-15', 'tiros')] }));
    expect(m.zona).toBe('pouco');
    expect(m.valor).toBe(1);
    expect(m.texto).toBe('1 sessão/sem');
    expect(m.posicao).toBeCloseTo(0.25, 3);
    expect(m.proximoPasso).toBe('mais 1 sessão esta semana; se o máximo não dá, tiros a 70% já contam');
    expect(m.faixa).toEqual({ pouco: 2, meta: 3, demais: 5 });
    expect(m.seguranca).toBeUndefined();
  });

  it('meta: 3 sessões nesta semana; a de sábado passado não conta', () => {
    const m = tresTiros.meta(
      ctxBase({
        eventos: [
          eventoBase('2026-09-17', 'tiros'),
          eventoBase('2026-09-15', 'tiros'),
          eventoBase('2026-09-14', 'tiros'),
          eventoBase('2026-09-12', 'tiros'),
        ],
      }),
    );
    expect(m.zona).toBe('meta');
    expect(m.valor).toBe(3);
    expect(m.texto).toBe('3 sessões/sem');
    expect(m.posicao).toBeCloseTo(0.75, 3);
    expect(m.proximoPasso).toBe('manter o protocolo fixo e registrar o RPE');
  });

  it('atencao: a revisão da semana diz 4', () => {
    const m = tresTiros.meta(ctxBase({ semana: semanaBase({ sessoesTiros: 4 }) }));
    expect(m.zona).toBe('atencao');
    expect(m.valor).toBe(4);
    expect(m.posicao).toBeCloseTo(0.98, 3);
  });

  it('demais: 5 sessões', () => {
    const m = tresTiros.meta(ctxBase({ semana: semanaBase({ sessoesTiros: 5 }) }));
    expect(m.zona).toBe('demais');
    expect(m.proximoPasso).toBe('tirar 1 sessão e ver se o RPE cai');
  });

  it('a revisão da semana corrente vence a contagem de eventos', () => {
    const m = tresTiros.meta(
      ctxBase({ semana: semanaBase({ sessoesTiros: 2 }), eventos: [eventoBase('2026-09-15', 'tiros')] }),
    );
    expect(m.valor).toBe(2);
  });

  it('revisão de outra semana é ignorada; com eventos na janela, conta zero', () => {
    const m = tresTiros.meta(
      ctxBase({
        semana: semanaBase({ semana: '2026-W36', sessoesTiros: 3 }),
        eventos: [eventoBase('2026-09-15', 'forca')],
      }),
    );
    expect(m.zona).toBe('pouco');
    expect(m.valor).toBe(0);
    expect(m.texto).toBe('0 sessões/sem');
  });

  it('sem-dado: nenhum treino registrado e sem revisão', () => {
    const m = tresTiros.meta(ctxBase());
    expect(m.zona).toBe('sem-dado');
    expect(m.valor).toBeNull();
    expect(m.faixa).toBeNull();
    expect(m.posicao).toBeNull();
    expect(m.precisaDe).toEqual(['semana.sessoesTiros']);
  });

  it('segurança: remédio para pressão preenche seguranca', () => {
    const m = tresTiros.meta(
      ctxBase({ perfil: { ...perfilBase, remedios: ['pressao'] }, semana: semanaBase({ sessoesTiros: 3 }) }),
    );
    expect(m.seguranca).toContain('converse com quem te acompanha');
    expect(m.zona).toBe('meta');
  });
});
