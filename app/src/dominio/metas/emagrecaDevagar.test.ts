import { describe, expect, it } from 'vitest';
import { emagrecaDevagar } from './emagrecaDevagar';
import { HOJE, ctxBase, diaBase, perfilBase } from './_fixtures';

/** As médias vêm de derivados (plano 01); fixamos por override. Peso 90 → ideal bruto 0,45 kg/sem, máximo bruto 0,9. */
function ctxPeso(atual: number | null, anterior: number | null) {
  return ctxBase({
    hoje: diaBase(HOJE, { peso: atual ?? undefined }),
    derivados: { pesoMedioSemana: atual, pesoMedioSemanaAnterior: anterior },
  });
}

describe('emagreca-devagar', () => {
  it('aplica a todo perfil', () => {
    expect(emagrecaDevagar.id).toBe('emagreca-devagar');
    expect(emagrecaDevagar.aplica(perfilBase)).toBe(true);
  });

  it('pouco: peso estável', () => {
    const m = emagrecaDevagar.meta(ctxPeso(90, 90));
    expect(m.zona).toBe('pouco');
    expect(m.valor).toBe(0);
    expect(m.texto).toBe('peso estável esta semana (meta até 0,45 kg)');
    expect(m.proximoPasso).toBe('peso estável: não é problema; se quer perder, o déficit moderado está nas Medidas');
    expect(m.posicao).toBe(0.15);
    expect(m.faixa).toEqual({ pouco: 0, meta: 0.45, demais: 0.9 });
    expect(m.seguranca).toBeUndefined();
    expect(m.vals).toEqual({ peso: 90, perda_ideal: '0,45', perda_max: '0,9', delta_peso: 'peso estável' });
  });

  it('atencao (não pouco): ganhou 0,5 kg — a balança engana nas primeiras semanas', () => {
    const m = emagrecaDevagar.meta(ctxPeso(90, 89.5));
    expect(m.zona).toBe('atencao');
    expect(m.valor).toBe(-0.5);
    expect(m.texto).toBe('a balança engana nas primeiras semanas — água do glicogênio; olhe a média de 2–3 semanas');
    expect(m.proximoPasso).toBe('manter o plano; comparar a média da próxima semana');
    expect(m.vals?.delta_peso).toBe('+0,5 kg');
  });

  it('meta: perdeu 0,4 kg', () => {
    const m = emagrecaDevagar.meta(ctxPeso(90, 90.4));
    expect(m.zona).toBe('meta');
    expect(m.valor).toBe(0.4);
    expect(m.texto).toBe('−0,4 kg esta semana (meta até 0,45 kg)');
    expect(m.proximoPasso).toBe('ritmo certo — panturrilha estável confirma que é gordura');
    expect(m.posicao).toBeCloseTo(0.611, 2);
  });

  it('atencao: perdeu 0,8 kg — um pouco rápido', () => {
    const m = emagrecaDevagar.meta(ctxPeso(90, 90.8));
    expect(m.zona).toBe('atencao');
    expect(m.proximoPasso).toBe('um pouco rápido: manter proteína e força; não cortar mais nada');
    expect(m.posicao).toBeCloseTo(0.722, 2);
  });

  it('demais: perdeu 1,5 kg', () => {
    const m = emagrecaDevagar.meta(ctxPeso(90, 91.5));
    expect(m.zona).toBe('demais');
    expect(m.texto).toBe('−1,5 kg esta semana (meta até 0,45 kg)');
    expect(m.proximoPasso).toBe('rápido demais: não cortar mais nada esta semana; manter proteína e força');
    expect(m.posicao).toBeCloseTo(0.917, 2);
  });

  it('atencao: limiar sem arredondar (dl 0,5 kg a 89,5 kg, 0,5 > 0,4475)', () => {
    const m = emagrecaDevagar.meta(ctxPeso(89.5, 90.0));
    expect(m.valor).toBe(0.5);
    expect(m.zona).toBe('atencao');
  });

  it('meta: logo abaixo do limiar sem arredondar (dl 0,4 kg a 89,6 kg)', () => {
    const m = emagrecaDevagar.meta(ctxPeso(89.6, 90.0));
    expect(m.valor).toBe(0.4);
    expect(m.zona).toBe('meta');
  });

  it('sem-dado: falta a semana anterior ou a atual', () => {
    const m = emagrecaDevagar.meta(ctxPeso(90, null));
    expect(m.zona).toBe('sem-dado');
    expect(m.precisaDe).toEqual(['dia.peso']);
    expect(m.texto).toBe('precisa do peso em duas semanas seguidas');
    expect(m.vals).toEqual({ peso: 90, perda_ideal: '0,45', perda_max: '0,9' });
    expect(emagrecaDevagar.meta(ctxPeso(null, null)).zona).toBe('sem-dado');
    expect(emagrecaDevagar.meta(ctxPeso(null, null)).vals).toBeUndefined();
  });

  it('segurança: remédio para tireoide', () => {
    const ctx = ctxPeso(90, 90.4);
    const m = emagrecaDevagar.meta({ ...ctx, perfil: { ...perfilBase, remedios: ['tireoide'] } });
    expect(m.seguranca).toContain('remédio para tireoide');
  });
});
