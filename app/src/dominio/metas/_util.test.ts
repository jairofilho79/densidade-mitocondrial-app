import { describe, expect, it } from 'vitest';
import {
  aplicarSeguranca,
  contarSessoes7,
  dataISO,
  diasUltimos,
  eventosUltimos,
  fmt,
  horasAntesDeDeitar,
  hojeISO,
  inicioSemana,
  interpolar,
  passo15min,
  semDado,
  semanaAtual,
  semanaISO,
  somaUltimos7,
  ultimoDiaCom,
  deDiaSeNaoHoje,
} from './_util';
import { AGORA, HOJE, ONTEM, ctxBase, diaBase, eventoBase, perfilBase, semanaBase } from './_fixtures';
import type { Meta } from './tipos';

describe('datas', () => {
  it('dataISO usa a hora local', () => {
    expect(dataISO(new Date(2026, 8, 17, 23, 59))).toBe('2026-09-17');
    expect(dataISO(new Date(2026, 0, 5, 0, 0))).toBe('2026-01-05');
  });

  it('hojeISO vem de ctx.agora', () => {
    expect(hojeISO(ctxBase())).toBe(HOJE);
    expect(AGORA.getDay()).toBe(4); // quinta-feira
  });

  it('semanaISO e inicioSemana', () => {
    expect(semanaISO('2026-09-17')).toBe('2026-W38');
    expect(semanaISO('2026-09-14')).toBe('2026-W38');
    expect(semanaISO('2026-09-13')).toBe('2026-W37');
    expect(semanaISO('2026-01-01')).toBe('2026-W01');
    expect(semanaISO('2027-01-01')).toBe('2026-W53');
    expect(inicioSemana('2026-09-17')).toBe('2026-09-14');
    expect(inicioSemana('2026-09-14')).toBe('2026-09-14');
    expect(inicioSemana('2026-09-20')).toBe('2026-09-14');
  });
});

describe('semDado', () => {
  it('nunca chuta valor', () => {
    const m = semDado(['dia.passos']);
    expect(m).toEqual({
      zona: 'sem-dado',
      valor: null,
      faixa: null,
      posicao: null,
      texto: 'ainda sem registro',
      proximoPasso: 'registre para ver onde você está',
      precisaDe: ['dia.passos'],
    });
  });

  it('aceita texto próprio', () => {
    expect(semDado(['dia.peso'], 'precisa de duas semanas').texto).toBe('precisa de duas semanas');
  });
});

describe('ultimoDiaCom', () => {
  const dias = [
    diaBase('2026-09-17', {}),
    diaBase('2026-09-16', { passos: 4000, ultimoCafe: null }),
    diaBase('2026-09-15', { passos: 3000, ultimoCafe: '15:00' }),
  ];

  it('devolve o dia mais recente com o campo definido', () => {
    expect(ultimoDiaCom(dias, 'passos')?.data).toBe('2026-09-16');
  });

  it('null conta como definido', () => {
    expect(ultimoDiaCom(dias, 'ultimoCafe')?.data).toBe('2026-09-16');
  });

  it('undefined quando ninguém tem o campo', () => {
    expect(ultimoDiaCom(dias, 'copos')).toBeUndefined();
    expect(ultimoDiaCom([], 'passos')).toBeUndefined();
  });
});

describe('janelas', () => {
  it('diasUltimos filtra por data, não por posição', () => {
    const ctx = ctxBase({
      dias: [diaBase('2026-09-17'), diaBase('2026-09-11'), diaBase('2026-09-10'), diaBase('2026-08-20')],
    });
    expect(diasUltimos(ctx, 7).map((d) => d.data)).toEqual(['2026-09-17', '2026-09-11']);
    expect(diasUltimos(ctx, 28).map((d) => d.data)).toEqual(['2026-09-17', '2026-09-11', '2026-09-10']);
  });

  it('eventosUltimos filtra por data', () => {
    const ctx = ctxBase({
      eventos: [eventoBase('2026-09-17', 'tiros'), eventoBase('2026-09-11', 'moderado', 30), eventoBase('2026-09-10', 'moderado', 30)],
    });
    expect(eventosUltimos(ctx, 7).length).toBe(2);
  });

  it('contarSessoes7 conta os últimos 7 dias (janela móvel), não segunda→hoje', () => {
    const ctx = ctxBase({
      eventos: [
        eventoBase('2026-09-17', 'tiros'),
        eventoBase('2026-09-15', 'tiros'),
        eventoBase('2026-09-14', 'forca'),
        eventoBase('2026-09-11', 'tiros'), // dentro dos 7 dias móveis (limite 11/09), fora da semana ISO
        eventoBase('2026-09-09', 'tiros'), // 8 dias atrás: exclui
        eventoBase('2026-09-18', 'tiros'), // amanhã (não deveria existir, mas não conta)
      ],
    });
    expect(contarSessoes7(ctx, 'tiros')).toBe(3);
    expect(contarSessoes7(ctx, 'forca')).toBe(1);
    expect(contarSessoes7(ctx, 'moderado')).toBe(0);
  });

  it('somaUltimos7 soma o campo nos últimos 7 dias; null conta como 0; undefined se ninguém registrou', () => {
    const ctx = ctxBase({
      hoje: diaBase(HOJE, { alcoolDoses: 4 }),
      dias: [
        diaBase('2026-09-16', { alcoolDoses: null }),
        diaBase('2026-09-11', { alcoolDoses: 5 }), // dentro dos 7 dias (limite 11/09)
        diaBase('2026-09-01', { alcoolDoses: 20 }), // fora da janela
      ],
    });
    expect(somaUltimos7(ctx, 'alcoolDoses')).toBe(9);
    expect(somaUltimos7(ctxBase(), 'alcoolDoses')).toBeUndefined();
  });

  it('semanaAtual só devolve a revisão da semana ISO de hoje', () => {
    expect(semanaAtual(ctxBase({ semana: semanaBase({ sessoesTiros: 3 }) }))?.sessoesTiros).toBe(3);
    expect(semanaAtual(ctxBase({ semana: semanaBase({ semana: '2026-W37', sessoesTiros: 3 }) }))).toBeUndefined();
    expect(semanaAtual(ctxBase())).toBeUndefined();
  });

  it('deDiaSeNaoHoje', () => {
    const ctx = ctxBase();
    expect(deDiaSeNaoHoje(ctx, diaBase(HOJE))).toEqual({});
    expect(deDiaSeNaoHoje(ctx, diaBase(ONTEM))).toEqual({ deDia: ONTEM });
  });
});

describe('aplicarSeguranca', () => {
  const meta: Meta = { zona: 'meta', valor: 3, faixa: null, posicao: 0.5, texto: 'x', proximoPasso: 'manter' };

  it('sem flag devolve a meta igual', () => {
    expect(aplicarSeguranca('tres-tiros', perfilBase, meta)).toEqual(meta);
    expect(aplicarSeguranca('tres-tiros', perfilBase, meta).seguranca).toBeUndefined();
  });

  it('com flag preenche seguranca e mantém o resto', () => {
    const m = aplicarSeguranca('tres-tiros', { ...perfilBase, fuma: 'sim' }, meta);
    expect(m.seguranca).toContain('converse com quem te acompanha');
    expect(m.proximoPasso).toBe('manter');
    expect(m.zona).toBe('meta');
  });
});

describe('fmt', () => {
  it('vírgula decimal, sem zeros à direita desnecessários', () => {
    expect(fmt(7.5)).toBe('7,5');
    expect(fmt(2)).toBe('2');
    expect(fmt(0.45, 2)).toBe('0,45');
    expect(fmt(0)).toBe('0');
    expect(fmt(-0.5)).toBe('-0,5');
  });
});

describe('interpolar', () => {
  it('substitui {chave} por vals[chave]; números via fmt; chaves ausentes ficam como estão', () => {
    expect(interpolar('até {corte} ({n} vezes)', { corte: '14:30', n: 2.5 })).toBe('até 14:30 (2,5 vezes)');
    expect(interpolar('falta {x}', {})).toBe('falta {x}');
  });
});

describe('horasAntesDeDeitar', () => {
  it('trata a virada de meia-noite', () => {
    expect(horasAntesDeDeitar('14:00', '23:00')).toBe(9);
    expect(horasAntesDeDeitar('22:30', '22:00')).toBe(-0.5);
    expect(horasAntesDeDeitar('14:00', '00:30')).toBeCloseTo(10.5, 5);
    expect(horasAntesDeDeitar('23:30', '01:00')).toBeCloseTo(1.5, 5);
  });
});

describe('passo15min', () => {
  it('move no máximo 15 min em direção ao alvo, na direção pedida', () => {
    expect(passo15min('16:00', '14:30', 'antes')).toEqual({ hora: '15:45', minutos: 15 });
    expect(passo15min('14:36', '14:30', 'antes')).toEqual({ hora: '14:30', minutos: 6 });
    expect(passo15min('20:00', '20:30', 'depois')).toEqual({ hora: '20:15', minutos: 15 });
    expect(passo15min('20:20', '20:30', 'depois')).toEqual({ hora: '20:30', minutos: 10 });
  });
});

describe('ctxBase', () => {
  it('coloca hoje em dias e ordena do mais recente para o mais antigo', () => {
    const ctx = ctxBase({ hoje: diaBase(HOJE, { passos: 1 }), dias: [diaBase('2026-09-10'), diaBase(ONTEM)] });
    expect(ctx.dias.map((d) => d.data)).toEqual([HOJE, ONTEM, '2026-09-10']);
    expect(ctx.hoje?.passos).toBe(1);
  });

  it('override de derivados vence o derivar()', () => {
    expect(ctxBase({ derivados: { diasParado: 9 } }).derivados.diasParado).toBe(9);
    expect(ctxBase().derivados.coposMeta).toBe(8); // H, sem treino hoje: 2,0 L / 0,25
  });
});
