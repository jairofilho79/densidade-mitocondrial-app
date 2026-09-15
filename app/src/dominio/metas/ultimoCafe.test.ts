import { describe, expect, it } from 'vitest';
import { ultimoCafe } from './ultimoCafe';
import { HOJE, ONTEM, ctxBase, diaBase, perfilBase } from './_fixtures';

// perfilBase deita às 23:30 → corte = 14:30 (9 h antes), limite = 17:30 (6 h antes)

describe('ultimo-cafe', () => {
  it('aplica só quando o perfil toma café', () => {
    expect(ultimoCafe.id).toBe('ultimo-cafe');
    expect(ultimoCafe.aplica({ ...perfilBase, cafe: 'nao' })).toBe(false);
    expect(ultimoCafe.aplica({ ...perfilBase, cafe: 'as-vezes' })).toBe(true);
    expect(ultimoCafe.aplica({ ...perfilBase, cafe: 'diario' })).toBe(true);
  });

  it('pouco não existe: sem café em todos os dias registrados é meta', () => {
    const m = ultimoCafe.meta(
      ctxBase({ hoje: diaBase(HOJE, { ultimoCafe: null }), dias: [diaBase(ONTEM, { ultimoCafe: null })] }),
    );
    expect(m.zona).toBe('meta');
    expect(m.valor).toBeNull();
    expect(m.texto).toBe('sem café nesta semana');
    expect(m.proximoPasso).toBe('se um dia tomar, antes das 14:30');
    expect(m.posicao).toBe(0.5);
    expect(m.faixa).toEqual({ pouco: 9, meta: 9, demais: 6 });
  });

  it('atencao: café às 16:00 (7,5 h antes); próximo passo 15 min mais cedo', () => {
    const m = ultimoCafe.meta(ctxBase({ hoje: diaBase(HOJE, { ultimoCafe: '16:00' }) }));
    expect(m.zona).toBe('atencao');
    expect(m.valor).toBe(7.5);
    expect(m.texto).toBe('último café 7,5 h antes de deitar');
    expect(m.proximoPasso).toBe('último café 15 min mais cedo: até 15:45 (a meta é antes das 14:30)');
    expect(m.posicao).toBe(0.72);
    expect(m.deDia).toBeUndefined();
    expect(m.vals).toEqual({ deitar: '23:30', corte_cafe: '14:30' });
  });

  it('perto da meta o passo encolhe para não passar dela: 14:36 → 14:30', () => {
    const m = ultimoCafe.meta(ctxBase({ hoje: diaBase(HOJE, { ultimoCafe: '14:36' }) }));
    expect(m.zona).toBe('atencao');
    expect(m.proximoPasso).toBe('último café 6 min mais cedo: até 14:30 (a meta é antes das 14:30)');
  });

  it('meta: café às 13:00 (10,5 h antes)', () => {
    const m = ultimoCafe.meta(ctxBase({ hoje: diaBase(HOJE, { ultimoCafe: '13:00' }) }));
    expect(m.zona).toBe('meta');
    expect(m.valor).toBe(10.5);
    expect(m.proximoPasso).toBe('manter');
    expect(m.posicao).toBe(0.5);
  });

  it('meta: café bem cedo (07:00) não usa mais o corte fixo de 12 h — 16,5 h antes de deitar', () => {
    const m = ultimoCafe.meta(ctxBase({ hoje: diaBase(HOJE, { ultimoCafe: '07:00' }) }));
    expect(m.zona).toBe('meta');
    expect(m.valor).toBe(16.5);
  });

  it('demais: café às 20:00 (3,5 h antes)', () => {
    const m = ultimoCafe.meta(ctxBase({ hoje: diaBase(HOJE, { ultimoCafe: '20:00' }) }));
    expect(m.zona).toBe('demais');
    expect(m.posicao).toBe(0.9);
    expect(m.proximoPasso).toBe('último café 15 min mais cedo: até 19:45 (a meta é antes das 14:30)');
  });

  it('demais: café depois do horário de deitar (22:30, deitar 22:00)', () => {
    const m = ultimoCafe.meta(
      ctxBase({ perfil: { ...perfilBase, deitar: '22:00' }, hoje: diaBase(HOJE, { ultimoCafe: '22:30' }) }),
    );
    expect(m.zona).toBe('demais');
    expect(m.valor).toBe(-0.5);
    expect(m.texto).toBe('depois do horário de deitar (0,5 h)');
    expect(m.posicao).toBe(0.98);
    expect(m.proximoPasso).toBe('último café 15 min mais cedo: até 22:15 (a meta é antes das 13:00)');
  });

  it('meta: café às 14:00, deitar às 00:30 (10,5 h antes, atravessa a meia-noite)', () => {
    const m = ultimoCafe.meta(
      ctxBase({ perfil: { ...perfilBase, deitar: '00:30' }, hoje: diaBase(HOJE, { ultimoCafe: '14:00' }) }),
    );
    expect(m.zona).toBe('meta');
    expect(m.valor).toBe(10.5);
  });

  it('sem-dado: nenhum dia com ultimoCafe nos últimos 7 dias', () => {
    expect(ultimoCafe.meta(ctxBase({ hoje: diaBase(HOJE) })).zona).toBe('sem-dado');
    const antigo = ultimoCafe.meta(ctxBase({ dias: [diaBase('2026-09-01', { ultimoCafe: '20:00' })] }));
    expect(antigo.zona).toBe('sem-dado');
    expect(antigo.precisaDe).toEqual(['dia.ultimoCafe']);
  });

  it('as-vezes: avalia só os dias com café e diz "nos dias em que tomar"', () => {
    const m = ultimoCafe.meta(
      ctxBase({
        perfil: { ...perfilBase, cafe: 'as-vezes' },
        hoje: diaBase(HOJE, { ultimoCafe: null }),
        dias: [diaBase(ONTEM, { ultimoCafe: '16:00' })],
      }),
    );
    expect(m.zona).toBe('atencao');
    expect(m.valor).toBe(7.5);
    expect(m.texto).toBe('nos dias em que tomar, antes das 14:30 — último: 7,5 h antes de deitar');
    expect(m.deDia).toBe(ONTEM);
  });
});
