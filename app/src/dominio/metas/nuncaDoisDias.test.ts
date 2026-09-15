import { describe, expect, it } from 'vitest';
import { nuncaDoisDias } from './nuncaDoisDias';
import { HOJE, ctxBase, diaBase, perfilBase } from './_fixtures';

/** O contador vem de derivados.diasParado (plano 01); aqui ele é fixado por override. */
function ctxParado(diasParado: number) {
  return ctxBase({ hoje: diaBase(HOJE, { moveu: false }), derivados: { diasParado } });
}

describe('nunca-dois-dias', () => {
  it('aplica a todo perfil', () => {
    expect(nuncaDoisDias.id).toBe('nunca-dois-dias');
    expect(nuncaDoisDias.aplica(perfilBase)).toBe(true);
  });

  it('pouco: 3 dias parado', () => {
    const m = nuncaDoisDias.meta(ctxParado(3));
    expect(m.zona).toBe('pouco');
    expect(m.valor).toBe(3);
    expect(m.texto).toBe('3 dia(s) seguido(s) parado — 48 h: transcritos já mudam');
    expect(m.proximoPasso).toBe('10 minutos de caminhada hoje zeram o contador');
    expect(m.posicao).toBe(0.06);
    expect(m.faixa).toEqual({ pouco: 3, meta: 1, demais: 1 });
  });

  it('pouco: 5 dias mostra o custo em citrato sintase', () => {
    const m = nuncaDoisDias.meta(ctxParado(5));
    expect(m.zona).toBe('pouco');
    expect(m.texto).toBe('5 dia(s) seguido(s) parado — 4+ dias: já mensurável em citrato sintase');
  });

  it('atencao: 2 dias', () => {
    const m = nuncaDoisDias.meta(ctxParado(2));
    expect(m.zona).toBe('atencao');
    expect(m.texto).toBe('2 dia(s) seguido(s) parado — 48 h: transcritos já mudam');
    expect(m.posicao).toBe(0.25);
  });

  it('meta: 0 dia — "em dia"', () => {
    const m0 = nuncaDoisDias.meta(ctxParado(0));
    expect(m0.zona).toBe('meta');
    expect(m0.texto).toBe('em dia — moveu hoje');
    expect(m0.proximoPasso).toBe('contador zerado');
    expect(m0.posicao).toBe(0.45);
  });

  it('meta: 1 dia — "moveu ontem; hoje ainda não"', () => {
    const m1 = nuncaDoisDias.meta(ctxParado(1));
    expect(m1.zona).toBe('meta');
    expect(m1.texto).toBe('moveu ontem; hoje ainda não');
  });

  it('demais não existe: nunca sai de meta por mover muito', () => {
    expect(nuncaDoisDias.meta(ctxParado(0)).zona).not.toBe('demais');
  });

  it('sem-dado: nenhum dia e nenhum evento registrados', () => {
    const m = nuncaDoisDias.meta(ctxBase());
    expect(m.zona).toBe('sem-dado');
    expect(m.precisaDe).toEqual(['dia.moveu']);
  });
});
