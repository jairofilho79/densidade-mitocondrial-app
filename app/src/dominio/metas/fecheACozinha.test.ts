import { describe, expect, it } from 'vitest';
import { fecheACozinha } from './fecheACozinha';
import { HOJE, ONTEM, ctxBase, diaBase, perfilBase } from './_fixtures';

const ANTEONTEM = '2026-09-15';

/** jantarFim de ontem fixo às 18:00; primeiraRefeicao de hoje varia o jejum (h = horasEntre(18:00, primeiraRefeicao)). */
function ctxJejum(primeiraRefeicao: string) {
  return ctxBase({
    hoje: diaBase(HOJE, { primeiraRefeicao }),
    dias: [diaBase(ONTEM, { jantarFim: '18:00' })],
  });
}

describe('feche-a-cozinha', () => {
  it('aplica a todo perfil', () => {
    expect(fecheACozinha.id).toBe('feche-a-cozinha');
    expect(fecheACozinha.aplica(perfilBase)).toBe(true);
  });

  it('pouco: 11 h (primeiraRefeicao 05:00); próximo passo 15 min', () => {
    const m = fecheACozinha.meta(ctxJejum('05:00'));
    expect(m.zona).toBe('pouco');
    expect(m.valor).toBe(11);
    expect(m.texto).toBe('11 h de jejum');
    expect(m.proximoPasso).toBe('fechar a cozinha 15 min mais cedo: até 17:45 (a meta é 14 h de jejum)');
    expect(m.faixa).toEqual({ pouco: 12, meta: 14, demais: 20 });
    expect(m.posicao).toBeCloseTo(0.125, 3);
    expect(m.deDia).toBeUndefined();
    expect(m.seguranca).toBeUndefined();
    expect(m.vals).toEqual({ jantar: '18:00', primeira: '05:00', jejum_h: 11 });
  });

  it('atencao: 13,9 h (primeiraRefeicao 07:54); próximo passo limitado ao que falta', () => {
    const m = fecheACozinha.meta(ctxJejum('07:54'));
    expect(m.zona).toBe('atencao');
    expect(m.valor).toBe(13.9);
    expect(m.proximoPasso).toBe('fechar a cozinha 6 min mais cedo: até 17:54 (a meta é 14 h de jejum)');
  });

  it('meta: 15 h (primeiraRefeicao 09:00)', () => {
    const m = fecheACozinha.meta(ctxJejum('09:00'));
    expect(m.zona).toBe('meta');
    expect(m.proximoPasso).toBe('manter; bater a proteína na janela');
    expect(m.posicao).toBeCloseTo(0.625, 3);
  });

  it('atencao alta: 18 h — mais que o testado (primeiraRefeicao 12:00)', () => {
    const m = fecheACozinha.meta(ctxJejum('12:00'));
    expect(m.zona).toBe('atencao');
    expect(m.proximoPasso).toBe('você está em 18 h — mais que o testado; se a proteína não fecha, encurte para 16');
  });

  it('demais: 21 h (primeiraRefeicao 15:00)', () => {
    const m = fecheACozinha.meta(ctxJejum('15:00'));
    expect(m.zona).toBe('demais');
    expect(m.proximoPasso).toBe('reduzir: acima de 24 h repetido perde músculo');
  });

  it('sem-dado', () => {
    const m = fecheACozinha.meta(ctxBase({ hoje: diaBase(HOJE) }));
    expect(m.zona).toBe('sem-dado');
    expect(m.precisaDe).toEqual(['dia.jantarFim', 'dia.primeiraRefeicao']);
  });

  it('segurança: remédio para glicemia', () => {
    const ctx = ctxJejum('09:00');
    const m = fecheACozinha.meta({ ...ctx, perfil: { ...perfilBase, remedios: ['glicemia'] } });
    expect(m.seguranca).toContain('remédio para glicemia');
    expect(m.zona).toBe('meta');
  });

  it('usa o par mais recente mesmo quando não é hoje (ontem + anteontem)', () => {
    const m = fecheACozinha.meta(
      ctxBase({
        dias: [diaBase(ONTEM, { primeiraRefeicao: '08:00' }), diaBase(ANTEONTEM, { jantarFim: '18:00' })],
      }),
    );
    expect(m.zona).toBe('meta');
    expect(m.valor).toBe(14);
    expect(m.deDia).toBe(ONTEM);
    expect(m.vals).toEqual({ jantar: '18:00', primeira: '08:00', jejum_h: 14 });
  });

  it('só hoje sem primeiraRefeicao, mas ontem completo → usa ontem', () => {
    const m = fecheACozinha.meta(
      ctxBase({
        hoje: diaBase(HOJE, { deitou: '23:00' }), // hoje existe mas sem primeiraRefeicao
        dias: [
          diaBase(ONTEM, { jantarFim: '20:00', primeiraRefeicao: '09:00' }),
          diaBase(ANTEONTEM, { jantarFim: '19:00' }),
        ],
      }),
    );
    expect(m.zona).toBe('meta');
    expect(m.valor).toBe(14);
    expect(m.deDia).toBe(ONTEM);
  });
});
