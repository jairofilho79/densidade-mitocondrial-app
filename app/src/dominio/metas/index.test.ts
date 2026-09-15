import { describe, expect, it } from 'vitest';
import { catalogo } from '../catalogo';
import { METAS, acoesEmFoco, metasAplicaveis } from './index';
import { HOJE, ctxBase, diaBase, perfilBase, semanaBase } from './_fixtures';

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
