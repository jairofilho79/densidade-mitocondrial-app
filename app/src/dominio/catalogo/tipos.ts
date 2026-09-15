// Tipos do catálogo acoes.json (22 ações, 9 medidas, 28 variáveis).
// Fonte: contratos. Correção de tipo (não de nome): `fontes` é string no JSON,
// `setas` mistura números e strings, e `registro` é `string[]` (não uma tupla de 3)
// porque resolveJsonModule não infere tuplas para arrays de JSON.

export type AcaoId =
  | 'tres-tiros'
  | 'levante-peso'
  | 'some-150'
  | 'levante-a-cada-30'
  | 'ande-depois-do-jantar'
  | 'nunca-dois-dias'
  | 'seis-mil-passos'
  | 'durma-7'
  | 'ultimo-cafe'
  | 'jante-cedo'
  | 'anote-o-sono'
  | 'proteina-no-prato'
  | 'fibra-no-prato'
  | 'feche-a-cozinha'
  | 'troque-o-doce'
  | 'comida-de-verdade'
  | 'beba-pela-sede'
  | 'se-beber'
  | 'pergunte-a-fome'
  | 'emagreca-devagar'
  | 'meca-a-cintura'
  | 'panturrilha-preensao';

export type Grupo = 'Movimento' | 'Sono e ritmo' | 'Alimentação' | 'Corpo e medida';

export interface AcaoCatalogo {
  id: AcaoId;
  grupo: Grupo;
  titulo: string;
  gatilho: string;
  acao_minima: string;
  descricao: string;
  faixa: { variaveis: string[]; pouco: string; ideal: string; demais: string; regra?: string };
  afeta: { input: string; processo: string; output: string };
  registro: string[];
  sinal: { output: string; prazo: string };
  seguranca?: string;
  evidencia: { grau: string; fontes: string };
  setas: Array<string | number>;
}

export interface MedidaCatalogo {
  id: string;
  titulo: string;
  como: string;
  para_que: string;
  muda: string;
  fontes: string;
  grau: string;
}

export interface VariavelCatalogo {
  escopo: 'perfil' | 'dia';
  rotulo: string;
  unidade: string;
  padrao: number | string;
}

export interface Catalogo {
  variaveis: Record<string, VariavelCatalogo>;
  acoes: AcaoCatalogo[];
  medidas: MedidaCatalogo[];
}
