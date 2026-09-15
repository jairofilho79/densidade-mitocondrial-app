import { describe, expect, it } from 'vitest';
import { anoteOSono } from './anoteOSono';
import { HOJE, ONTEM, ctxBase, diaBase, perfilBase } from './_fixtures';

describe('anote-o-sono (só registro)', () => {
  it('aplica a todo perfil', () => {
    expect(anoteOSono.id).toBe('anote-o-sono');
    expect(anoteOSono.aplica(perfilBase)).toBe(true);
  });

  it('meta: hoje tem deitou e levantou', () => {
    const m = anoteOSono.meta(ctxBase({ hoje: diaBase(HOJE, { deitou: '23:00', levantou: '06:30' }) }));
    expect(m).toEqual({
      zona: 'meta',
      valor: null,
      faixa: null,
      posicao: null,
      texto: 'registrado',
      proximoPasso: 'manter o registro diário',
    });
  });

  it('sem-dado: só levantou', () => {
    const m = anoteOSono.meta(ctxBase({ hoje: diaBase(HOJE, { levantou: '06:30' }) }));
    expect(m.zona).toBe('sem-dado');
    expect(m.precisaDe).toEqual(['dia.deitou', 'dia.levantou']);
    expect(m.texto).toBe('sem registro hoje');
  });

  it('sem-dado: sem dia de hoje', () => {
    expect(anoteOSono.meta(ctxBase()).zona).toBe('sem-dado');
  });

  it('sem-dado: ontem completo não conta como hoje', () => {
    const m = anoteOSono.meta(
      ctxBase({ hoje: diaBase(HOJE), dias: [diaBase(ONTEM, { deitou: '23:00', levantou: '06:30' })] }),
    );
    expect(m.zona).toBe('sem-dado');
  });

  it('nunca é pouco, atencao ou demais', () => {
    const zonas = [
      anoteOSono.meta(ctxBase()).zona,
      anoteOSono.meta(ctxBase({ hoje: diaBase(HOJE, { deitou: '23:00', levantou: '06:30' }) })).zona,
    ];
    expect(zonas.every((z) => z === 'meta' || z === 'sem-dado')).toBe(true);
  });
});
