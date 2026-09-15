import { describe, expect, it } from 'vitest';
import { catalogo } from '../catalogo';
import type { AcaoId } from '../catalogo/tipos';
import { interpolar } from './_util';
import { METAS, acoesEmFoco, metasAplicaveis } from './index';
import { HOJE, ctxBase, diaBase, eventoBase, mesBase, perfilBase, semanaBase } from './_fixtures';

describe('contrato catálogo ↔ METAS', () => {
  it('as chaves de METAS são exatamente os 22 ids do catálogo', () => {
    const ids = catalogo.acoes.map((a) => a.id).sort();
    expect(ids).toHaveLength(22);
    expect(Object.keys(METAS).sort()).toEqual(ids);
  });

  it('cada módulo declara o próprio id', () => {
    for (const [id, modulo] of Object.entries(METAS)) expect(modulo.id).toBe(id);
  });

  it('com contexto vazio todo módulo devolve sem-dado e nunca chuta valor', () => {
    const ctx = ctxBase();
    for (const modulo of Object.values(METAS)) {
      const m = modulo.meta(ctx);
      expect(m.zona, modulo.id).toBe('sem-dado');
      expect(m.valor, modulo.id).toBeNull();
      expect(m.faixa, modulo.id).toBeNull();
      expect(m.posicao, modulo.id).toBeNull();
      expect(m.precisaDe?.length, modulo.id).toBeGreaterThan(0);
    }
  });
});

describe('metasAplicaveis', () => {
  it('esconde ultimo-cafe e se-beber com perfil "nao"', () => {
    const r = metasAplicaveis(ctxBase({ perfil: { ...perfilBase, cafe: 'nao', alcool: 'nao' } }));
    const ids = r.map((x) => x.acao.id);
    expect(ids).toHaveLength(20);
    expect(ids).not.toContain('ultimo-cafe');
    expect(ids).not.toContain('se-beber');
  });

  it('com café diário e álcool às vezes mostra as 22 na ordem do catálogo, com o AcaoCatalogo inteiro', () => {
    const r = metasAplicaveis(ctxBase());
    expect(r.map((x) => x.acao.id)).toEqual(catalogo.acoes.map((a) => a.id));
    expect(r[0].acao.titulo).toBe(catalogo.acoes[0].titulo);
    expect(r[0].meta.zona).toBe('sem-dado');
  });
});

describe('acoesEmFoco', () => {
  it('contexto vazio: nada em foco', () => {
    expect(acoesEmFoco(ctxBase())).toEqual([]);
  });

  it('atencao antes de pouco; dentro da zona, na ordem do catálogo (não por posicao)', () => {
    const ctx = ctxBase({
      hoje: diaBase(HOJE, { passos: 4000, fibraG: 20, proteinaG: 60, refeicoesCozinhadas: 2, minPosJantar: 0 }),
      semana: semanaBase({ sessoesTiros: 3 }),
      derivados: { diasParado: 0 },
    });
    // zonas: seis-mil-passos atencao, fibra-no-prato atencao (nessa ordem no catálogo);
    // ande-depois-do-jantar pouco, proteina-no-prato pouco (nessa ordem no catálogo).
    // fora: tres-tiros (meta), comida-de-verdade (meta), nunca-dois-dias (meta), o resto sem-dado
    const tres = acoesEmFoco(ctx);
    expect(tres.map((x) => x.acao.id)).toEqual(['seis-mil-passos', 'fibra-no-prato', 'ande-depois-do-jantar']);
    for (const x of tres) expect(x.meta.proximoPasso.length).toBeGreaterThan(0);

    const quatro = acoesEmFoco(ctx, 4);
    expect(quatro.map((x) => x.acao.id)).toEqual([
      'seis-mil-passos',
      'fibra-no-prato',
      'ande-depois-do-jantar',
      'proteina-no-prato',
    ]);
  });

  it('respeita aplica(): ultimo-cafe em atencao some com perfil "nao"', () => {
    const base = { hoje: diaBase(HOJE, { ultimoCafe: '16:00' }) }; // 7,5 h antes de deitar → atencao
    expect(acoesEmFoco(ctxBase(base)).map((x) => x.acao.id)).toContain('ultimo-cafe');
    expect(
      acoesEmFoco(ctxBase({ ...base, perfil: { ...perfilBase, cafe: 'nao' } })).map((x) => x.acao.id),
    ).not.toContain('ultimo-cafe');
  });
});

describe('vals: preenche os placeholders das faixas do catálogo', () => {
  // Completo o bastante para que quase toda ação tenha dado — exceto as três que dependem de um
  // par de dias/semanas que este fixture não tem: seis-mil-passos (sem dia.passos), feche-a-cozinha
  // (sem dia.primeiraRefeicao) e emagreca-devagar (sem pesoMedioSemanaAnterior, que pede 2 semanas).
  function ctxCompleto() {
    return ctxBase({
      hoje: diaBase(HOJE, {
        deitou: '23:00',
        levantou: '06:30',
        ultimoCafe: '09:00',
        jantarFim: '19:00',
        fome: 5,
        comiSemFome: false,
        copos: 6,
        proteinaG: 120,
        fibraG: 20,
        refeicoesCozinhadas: 2,
        bebidaDoce: 0,
        alcoolDoses: 1,
        levantadas: 3,
        peso: 90,
        fcRepouso: 60,
        maiorBloco: 25,
        minPosJantar: 15,
        moveu: true,
      }),
      semana: semanaBase({ cintura: 90, sessoesTiros: 2, sessoesForca: 2, minAtiv: 200, alcoolDoses: 1, docesSemana: 0 }),
      mes: mesBase({ panturrilha: 38, preensao: 40 }),
      eventos: [eventoBase(HOJE, 'tiros', 20)],
    });
  }

  // Placeholders que dependem só do dado ausente daquela ação específica no fixture acima.
  const PERMITIDAS: Partial<Record<AcaoId, string[]>> = {
    'seis-mil-passos': ['prox_passos'],
    'feche-a-cozinha': ['jantar', 'primeira', 'jejum_h'],
    'emagreca-devagar': ['delta_peso'],
  };

  it('interpolar(faixa.*, meta.vals) não deixa placeholder aberto, exceto os que dependem do dado ausente', () => {
    const ctx = ctxCompleto();
    const aplicaveis = metasAplicaveis(ctx);
    expect(aplicaveis).toHaveLength(22); // garante que o teste abaixo não passa vazio
    let comPlaceholder = 0;
    for (const { acao } of aplicaveis) if (/\{[a-z_0-9]+\}/.test(acao.faixa.pouco + acao.faixa.ideal + acao.faixa.demais + (acao.faixa.regra ?? ''))) comPlaceholder += 1;
    expect(comPlaceholder).toBeGreaterThan(0); // garante que há placeholders de fato sendo exercitados
    for (const { acao, meta } of aplicaveis) {
      const textoFaixas = [acao.faixa.pouco, acao.faixa.ideal, acao.faixa.demais, acao.faixa.regra ?? ''].join(' ||| ');
      const resultado = interpolar(textoFaixas, meta.vals ?? {});
      const restantes = [...resultado.matchAll(/\{([a-z_0-9]+)\}/g)].map((m) => m[1]);
      const permitidas = PERMITIDAS[acao.id] ?? [];
      for (const p of restantes) expect(permitidas, `${acao.id}: placeholder inesperado {${p}}`).toContain(p);
    }
  });

  it('as três ações sem-dado do fixture continuam sem-dado (confirma a premissa do teste acima)', () => {
    const ctx = ctxCompleto();
    expect(METAS['seis-mil-passos'].meta(ctx).zona).toBe('sem-dado');
    expect(METAS['feche-a-cozinha'].meta(ctx).zona).toBe('sem-dado');
    expect(METAS['emagreca-devagar'].meta(ctx).zona).toBe('sem-dado');
  });
});
