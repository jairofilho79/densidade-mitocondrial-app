import { catalogo } from '../catalogo';
import type { AcaoCatalogo, AcaoId } from '../catalogo/tipos';
import { andeDepoisDoJantar } from './andeDepoisDoJantar';
import { anoteOSono } from './anoteOSono';
import { bebaPelaSede } from './bebaPelaSede';
import { comidaDeVerdade } from './comidaDeVerdade';
import { durma7 } from './durma7';
import { emagrecaDevagar } from './emagrecaDevagar';
import { fecheACozinha } from './fecheACozinha';
import { fibraNoPrato } from './fibraNoPrato';
import { janteCedo } from './janteCedo';
import { levanteACada30 } from './levanteACada30';
import { levantePeso } from './levantePeso';
import { mecaACintura } from './mecaACintura';
import { nuncaDoisDias } from './nuncaDoisDias';
import { panturrilhaPreensao } from './panturrilhaPreensao';
import { pergunteAFome } from './pergunteAFome';
import { proteinaNoPrato } from './proteinaNoPrato';
import { seBeber } from './seBeber';
import { seisMilPassos } from './seisMilPassos';
import { some150 } from './some150';
import type { AcaoMeta, Contexto, Meta } from './tipos';
import { tresTiros } from './tresTiros';
import { troqueODoce } from './troqueODoce';
import { ultimoCafe } from './ultimoCafe';

export type { AcaoMeta, Contexto, Faixa, Meta, Zona } from './tipos';

export const METAS: Record<AcaoId, AcaoMeta> = {
  'tres-tiros': tresTiros,
  'levante-peso': levantePeso,
  'some-150': some150,
  'levante-a-cada-30': levanteACada30,
  'ande-depois-do-jantar': andeDepoisDoJantar,
  'nunca-dois-dias': nuncaDoisDias,
  'seis-mil-passos': seisMilPassos,
  'durma-7': durma7,
  'ultimo-cafe': ultimoCafe,
  'jante-cedo': janteCedo,
  'anote-o-sono': anoteOSono,
  'proteina-no-prato': proteinaNoPrato,
  'fibra-no-prato': fibraNoPrato,
  'feche-a-cozinha': fecheACozinha,
  'troque-o-doce': troqueODoce,
  'comida-de-verdade': comidaDeVerdade,
  'beba-pela-sede': bebaPelaSede,
  'se-beber': seBeber,
  'pergunte-a-fome': pergunteAFome,
  'emagreca-devagar': emagrecaDevagar,
  'meca-a-cintura': mecaACintura,
  'panturrilha-preensao': panturrilhaPreensao,
};

export interface AcaoComMeta {
  acao: AcaoCatalogo;
  meta: Meta;
}

/** Só as ações cujo `aplica(perfil)` é verdadeiro, na ordem do catálogo. */
export function metasAplicaveis(ctx: Contexto): AcaoComMeta[] {
  return catalogo.acoes
    .filter((acao) => METAS[acao.id].aplica(ctx.perfil))
    .map((acao) => ({ acao, meta: METAS[acao.id].meta(ctx) }));
}

const ORDEM_ZONA: Record<'atencao' | 'pouco', number> = { atencao: 0, pouco: 1 };

/** As `n` ações em `pouco`/`atencao`: `atencao` antes de `pouco` e, dentro da zona, na ordem do catálogo. */
export function acoesEmFoco(ctx: Contexto, n = 3): AcaoComMeta[] {
  return metasAplicaveis(ctx)
    .filter((x): x is AcaoComMeta & { meta: { zona: 'pouco' | 'atencao' } } => x.meta.zona === 'pouco' || x.meta.zona === 'atencao')
    .sort((a, b) => ORDEM_ZONA[a.meta.zona] - ORDEM_ZONA[b.meta.zona])
    .slice(0, n);
}
