// @vitest-environment node
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { acaoDoCatalogo, catalogo } from './index';
import type { AcaoId, Grupo } from './tipos';

// Caminhos relativos a este arquivo: app/src/dominio/catalogo/ → 4 níveis acima é a raiz do repo.
const BRAIN = new URL('../../../../docs/brain/acoes/acoes.json', import.meta.url);
const COPIA = new URL('./acoes.json', import.meta.url);
const HASH = new URL('./acoes.hash', import.meta.url);

function sha256(conteudo: Buffer): string {
  return createHash('sha256').update(conteudo).digest('hex');
}

const IDS: AcaoId[] = [
  'tres-tiros',
  'levante-peso',
  'some-150',
  'levante-a-cada-30',
  'ande-depois-do-jantar',
  'nunca-dois-dias',
  'seis-mil-passos',
  'durma-7',
  'ultimo-cafe',
  'jante-cedo',
  'anote-o-sono',
  'proteina-no-prato',
  'fibra-no-prato',
  'feche-a-cozinha',
  'troque-o-doce',
  'comida-de-verdade',
  'beba-pela-sede',
  'se-beber',
  'pergunte-a-fome',
  'emagreca-devagar',
  'meca-a-cintura',
  'panturrilha-preensao',
];

const GRUPOS: Grupo[] = ['Movimento', 'Sono e ritmo', 'Alimentação', 'Corpo e medida'];

describe('catálogo sincronizado com o brain', () => {
  it('acoes.hash bate com o sha256 de docs/brain/acoes/acoes.json', () => {
    const brain = readFileSync(fileURLToPath(BRAIN));
    const hash = readFileSync(fileURLToPath(HASH), 'utf8').trim();
    expect(hash, 'Catálogo dessincronizado: rode `pnpm sync-catalogo` dentro de app/').toBe(sha256(brain));
  });

  it('a cópia local é byte a byte igual ao brain', () => {
    const brain = readFileSync(fileURLToPath(BRAIN));
    const copia = readFileSync(fileURLToPath(COPIA));
    expect(copia.equals(brain), 'Catálogo dessincronizado: rode `pnpm sync-catalogo` dentro de app/').toBe(true);
  });
});

describe('conteúdo do catálogo', () => {
  it('tem as 22 ações do contrato, na ordem do brain', () => {
    expect(catalogo.acoes.map((a) => a.id)).toEqual(IDS);
  });

  it('tem 9 medidas e 28 variáveis', () => {
    expect(catalogo.medidas).toHaveLength(9);
    expect(catalogo.medidas.map((m) => m.id)).toEqual([
      'imc',
      'whtr',
      'panturrilha',
      'preensao',
      'fc_repouso',
      'fc_max',
      'rmr',
      'agua',
      'peso',
    ]);
    expect(Object.keys(catalogo.variaveis)).toHaveLength(28);
  });

  it('toda ação pertence a um dos 4 grupos e tem os campos obrigatórios', () => {
    for (const a of catalogo.acoes) {
      expect(GRUPOS).toContain(a.grupo);
      expect(a.titulo.length).toBeGreaterThan(0);
      expect(a.gatilho.length).toBeGreaterThan(0);
      expect(a.acao_minima.length).toBeGreaterThan(0);
      expect(a.registro).toHaveLength(3);
      expect(Array.isArray(a.faixa.variaveis)).toBe(true);
      expect(typeof a.evidencia.grau).toBe('string');
      expect(typeof a.evidencia.fontes).toBe('string');
    }
  });

  it('as variáveis de faixa existem em catalogo.variaveis', () => {
    for (const a of catalogo.acoes) {
      for (const v of a.faixa.variaveis) {
        expect(catalogo.variaveis, `ação ${a.id} usa variável desconhecida "${v}"`).toHaveProperty(v);
      }
    }
  });

  it('acaoDoCatalogo devolve a ação pelo id e lança para id desconhecido', () => {
    expect(acaoDoCatalogo('durma-7').titulo).toBe('Durma 7 horas');
    expect(acaoDoCatalogo('durma-7').grupo).toBe('Sono e ritmo');
    expect(() => acaoDoCatalogo('nao-existe' as AcaoId)).toThrow("Ação 'nao-existe' não existe no catálogo.");
  });
});
