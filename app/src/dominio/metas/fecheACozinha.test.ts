import { describe, expect, it } from 'vitest';
import { fecheACozinha } from './fecheACozinha';
import { HOJE, ONTEM, ctxBase, diaBase, perfilBase } from './_fixtures';

/** O valor vem de derivados.jejumHoras (plano 01); fixamos por override com dias coerentes. */
function ctxJejum(jejumHoras: number | null) {
  return ctxBase({
    hoje: diaBase(HOJE, { primeiraRefeicao: '12:00' }),
    dias: [diaBase(ONTEM, { jantarFim: '18:00' })],
    derivados: { jejumHoras },
  });
}

describe('feche-a-cozinha', () => {
  it('aplica a todo perfil', () => {
    expect(fecheACozinha.id).toBe('feche-a-cozinha');
    expect(fecheACozinha.aplica(perfilBase)).toBe(true);
  });

  it('pouco: 11 h; próximo passo 15 min', () => {
    const m = fecheACozinha.meta(ctxJejum(11));
    expect(m.zona).toBe('pouco');
    expect(m.valor).toBe(11);
    expect(m.texto).toBe('11 h de jejum');
    expect(m.proximoPasso).toBe('fechar a cozinha 15 min mais cedo, ou abrir 15 min mais tarde (faltam 180 min para 14 h)');
    expect(m.faixa).toEqual({ pouco: 12, meta: 14, demais: 20 });
    expect(m.posicao).toBeCloseTo(0.125, 3);
    expect(m.deDia).toBeUndefined();
    expect(m.seguranca).toBeUndefined();
  });

  it('atencao: 13,5 h', () => {
    const m = fecheACozinha.meta(ctxJejum(13.5));
    expect(m.zona).toBe('atencao');
    expect(m.proximoPasso).toBe('fechar a cozinha 15 min mais cedo, ou abrir 15 min mais tarde (faltam 30 min para 14 h)');
  });

  it('meta: 15 h', () => {
    const m = fecheACozinha.meta(ctxJejum(15));
    expect(m.zona).toBe('meta');
    expect(m.proximoPasso).toBe('manter; bater a proteína na janela');
    expect(m.posicao).toBeCloseTo(0.625, 3);
  });

  it('atencao alta: 18 h (mais que o testado)', () => {
    const m = fecheACozinha.meta(ctxJejum(18));
    expect(m.zona).toBe('atencao');
    expect(m.proximoPasso).toBe('você está em 18 h — mais que o testado; se a proteína não fecha, encurte para 16');
  });

  it('demais: 21 h', () => {
    const m = fecheACozinha.meta(ctxJejum(21));
    expect(m.zona).toBe('demais');
    expect(m.proximoPasso).toBe('reduzir: acima de 24 h repetido perde músculo');
  });

  it('sem-dado', () => {
    const m = fecheACozinha.meta(ctxBase({ hoje: diaBase(HOJE), derivados: { jejumHoras: null } }));
    expect(m.zona).toBe('sem-dado');
    expect(m.precisaDe).toEqual(['dia.jantarFim', 'dia.primeiraRefeicao']);
  });

  it('segurança: remédio para glicemia', () => {
    const ctx = ctxJejum(15);
    const m = fecheACozinha.meta({ ...ctx, perfil: { ...perfilBase, remedios: ['glicemia'] } });
    expect(m.seguranca).toContain('remédio para glicemia');
    expect(m.zona).toBe('meta');
  });
});
