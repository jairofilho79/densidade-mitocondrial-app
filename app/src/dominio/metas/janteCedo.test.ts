import { describe, expect, it } from 'vitest';
import { janteCedo } from './janteCedo';
import { HOJE, ONTEM, ctxBase, diaBase, perfilBase } from './_fixtures';

// perfilBase deita às 23:30 → jantar ideal até 20:30

describe('jante-cedo', () => {
  it('aplica a todo perfil', () => {
    expect(janteCedo.id).toBe('jante-cedo');
    expect(janteCedo.aplica(perfilBase)).toBe(true);
  });

  it('pouco não existe: jantar às 17:00 (6,5 h antes) é meta', () => {
    const m = janteCedo.meta(ctxBase({ hoje: diaBase(HOJE, { jantarFim: '17:00' }) }));
    expect(m.zona).toBe('meta');
    expect(m.valor).toBe(6.5);
  });

  it('atencao: jantar às 21:30 (2 h antes); próximo passo 15 min mais cedo', () => {
    const m = janteCedo.meta(ctxBase({ hoje: diaBase(HOJE, { jantarFim: '21:30' }) }));
    expect(m.zona).toBe('atencao');
    expect(m.valor).toBe(2);
    expect(m.texto).toBe('jantar termina 2 h antes de deitar');
    expect(m.proximoPasso).toBe('terminar o jantar 15 min mais cedo esta semana: até 21:15 (a meta é até 20:30)');
    expect(m.posicao).toBe(0.72);
    expect(m.faixa).toEqual({ pouco: 3, meta: 3, demais: 1 });
  });

  it('meta: jantar às 20:00 (3,5 h antes)', () => {
    const m = janteCedo.meta(ctxBase({ hoje: diaBase(HOJE, { jantarFim: '20:00' }) }));
    expect(m.zona).toBe('meta');
    expect(m.proximoPasso).toBe('manter');
    expect(m.posicao).toBe(0.5);
  });

  it('demais: jantar às 23:00 (0,5 h antes)', () => {
    const m = janteCedo.meta(ctxBase({ hoje: diaBase(HOJE, { jantarFim: '23:00' }) }));
    expect(m.zona).toBe('demais');
    expect(m.posicao).toBe(0.9);
    expect(m.proximoPasso).toBe('terminar o jantar 15 min mais cedo esta semana: até 22:45 (a meta é até 20:30)');
  });

  it('demais: jantar depois do horário de deitar (22:30, deitar 22:00)', () => {
    const m = janteCedo.meta(
      ctxBase({ perfil: { ...perfilBase, deitar: '22:00' }, hoje: diaBase(HOJE, { jantarFim: '22:30' }) }),
    );
    expect(m.zona).toBe('demais');
    expect(m.valor).toBe(-0.5);
    expect(m.texto).toBe('depois do horário de deitar (0,5 h)');
    expect(m.posicao).toBe(0.98);
    expect(m.vals).toEqual({ deitar: '22:00', jantar_ideal: '19:00' });
  });

  it('sem-dado', () => {
    const m = janteCedo.meta(ctxBase({ hoje: diaBase(HOJE) }));
    expect(m.zona).toBe('sem-dado');
    expect(m.precisaDe).toEqual(['dia.jantarFim']);
  });

  it('usa o último dia com jantarFim', () => {
    const m = janteCedo.meta(ctxBase({ hoje: diaBase(HOJE), dias: [diaBase(ONTEM, { jantarFim: '20:00' })] }));
    expect(m.zona).toBe('meta');
    expect(m.deDia).toBe(ONTEM);
  });
});
