import { describe, expect, it } from 'vitest';
import { durma7 } from './durma7';
import { HOJE, ONTEM, ctxBase, diaBase, perfilBase } from './_fixtures';

/** O valor vem de derivados.sonoHoras (plano 01): (levantou − deitou) − 0,33. Fixamos por override, com dias coerentes. */
function ctxSono(deitou: string, levantou: string, sonoHoras: number) {
  return ctxBase({ hoje: diaBase(HOJE, { deitou, levantou }), derivados: { sonoHoras } });
}

describe('durma-7', () => {
  it('aplica a todo perfil', () => {
    expect(durma7.id).toBe('durma-7');
    expect(durma7.aplica(perfilBase)).toBe(true);
  });

  it('pouco: 5,2 h de sono; próximo passo é deitar 15 min antes até levantar − 7h30', () => {
    const m = durma7.meta(ctxSono('01:00', '06:30', 5.2));
    expect(m.zona).toBe('pouco');
    expect(m.valor).toBe(5.2);
    expect(m.texto).toBe('5.2 h de sono (5.5 h na cama)');
    expect(m.proximoPasso).toBe('deitar 15 min antes por uma semana, até chegar às 23:00');
    expect(m.faixa).toEqual({ pouco: 6, meta: 7, demais: 8.5 });
    expect(m.posicao).toBeCloseTo(0.05, 3);
    expect(m.deDia).toBeUndefined();
  });

  it('atencao: 6,7 h', () => {
    const m = durma7.meta(ctxSono('23:30', '06:30', 6.7));
    expect(m.zona).toBe('atencao');
    expect(m.proximoPasso).toBe('deitar 15 min antes por uma semana, até chegar às 23:00');
    expect(m.posicao).toBeCloseTo(0.425, 3);
  });

  it('meta: 7,7 h', () => {
    const m = durma7.meta(ctxSono('22:30', '06:30', 7.7));
    expect(m.zona).toBe('meta');
    expect(m.proximoPasso).toBe('manter o horário; anotar a variação');
    expect(m.posicao).toBeCloseTo(0.675, 3);
  });

  it('demais não existe: 9,2 h vira atencao', () => {
    const m = durma7.meta(ctxSono('21:00', '06:30', 9.2));
    expect(m.zona).toBe('atencao');
    expect(m.proximoPasso).toBe('mais de 8,5 h: manter o horário e anotar como acordou');
  });

  it('sem-dado: nenhum dia com deitou e levantou', () => {
    const m = durma7.meta(ctxBase({ hoje: diaBase(HOJE, { levantou: '06:30' }), derivados: { sonoHoras: null } }));
    expect(m.zona).toBe('sem-dado');
    expect(m.precisaDe).toEqual(['dia.deitou', 'dia.levantou']);
  });

  it('diz de que dia é quando o sono é de ontem', () => {
    const m = durma7.meta(
      ctxBase({
        hoje: diaBase(HOJE),
        dias: [diaBase(ONTEM, { deitou: '22:30', levantou: '06:30' })],
        derivados: { sonoHoras: 7.7 },
      }),
    );
    expect(m.zona).toBe('meta');
    expect(m.deDia).toBe(ONTEM);
  });
});
