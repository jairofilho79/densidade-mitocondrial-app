// Registro de campos (spec §4). Cada campo de dia, semana, mes e exame é declarado
// uma única vez: nível (em que tela aparece), tipo (como valida/renderiza), rótulo,
// unidade, faixa, condição por perfil e quais ações passam a ter meta com ele.
// As telas do plano 04 são geradas daqui; o convite "registre X e eu te digo Y"
// (ADR-002) vem de `desbloqueia`.
import type { AcaoId } from './catalogo/tipos';
import type { Dia, Exame, Mes, Perfil, Semana } from './tipos';

export type CampoId =
  | `dia.${Exclude<keyof Dia, 'data' | 'fonte' | 'atualizadoEm'>}`
  | `semana.${Exclude<keyof Semana, 'semana' | 'atualizadoEm'>}`
  | `mes.${Exclude<keyof Mes, 'mes' | 'atualizadoEm'>}`
  | `exame.${Exclude<keyof Exame, 'data' | 'atualizadoEm'>}`
  | `perfil.${Exclude<keyof Perfil, 'atualizadoEm'>}`;

export type TipoCampo = 'hora' | 'inteiro' | 'decimal' | 'escala' | 'bool' | 'texto' | 'hora-ou-nao' | 'inteiro-ou-nao';

export interface Campo {
  id: CampoId;
  nivel: 1 | 2 | 3;
  tipo: TipoCampo;
  rotulo: string;
  ajuda?: string;
  unidade?: string;
  min?: number;
  max?: number;
  condicao?: (perfil: Perfil) => boolean;
  desbloqueia: AcaoId[];
}

const tomaCafe = (p: Perfil): boolean => p.cafe !== 'nao';
const bebeAlcool = (p: Perfil): boolean => p.alcool !== 'nao';

export const CAMPOS: readonly Campo[] = [
  // ---------- dia · nível 1 (check-in da manhã, spec §5) ----------
  { id: 'dia.deitou', nivel: 1, tipo: 'hora', rotulo: 'Deitei às', desbloqueia: ['durma-7', 'anote-o-sono'] },
  { id: 'dia.levantou', nivel: 1, tipo: 'hora', rotulo: 'Levantei às', desbloqueia: ['durma-7', 'anote-o-sono'] },
  { id: 'dia.comoAcordei', nivel: 1, tipo: 'escala', rotulo: 'Como acordei', ajuda: '1 = péssimo, 5 = ótimo', min: 1, max: 5, desbloqueia: [] },
  { id: 'dia.fome', nivel: 1, tipo: 'escala', rotulo: 'Fome de ontem', ajuda: '1 = nenhuma, 10 = muita', min: 1, max: 10, desbloqueia: ['pergunte-a-fome'] },
  { id: 'dia.comiSemFome', nivel: 1, tipo: 'bool', rotulo: 'Comi sem estar com fome?', desbloqueia: ['pergunte-a-fome'] },
  {
    id: 'dia.ultimoCafe',
    nivel: 1,
    tipo: 'hora-ou-nao',
    rotulo: 'Último café de ontem',
    ajuda: 'Café, chá preto/verde, energético. "Não tomei" também vale.',
    condicao: tomaCafe,
    desbloqueia: ['ultimo-cafe'],
  },
  { id: 'dia.jantarFim', nivel: 1, tipo: 'hora', rotulo: 'Jantar de ontem terminou às', desbloqueia: ['jante-cedo', 'feche-a-cozinha'] },
  { id: 'dia.passos', nivel: 1, tipo: 'inteiro', rotulo: 'Passos de ontem', unidade: 'passos', min: 0, max: 100000, desbloqueia: ['seis-mil-passos'] },
  { id: 'dia.moveu', nivel: 1, tipo: 'bool', rotulo: 'Me movi de propósito por 10 minutos ou mais?', ajuda: 'Só aparece se não houve treino registrado.', desbloqueia: ['nunca-dois-dias'] },

  // ---------- dia · nível 2 ("quero registrar mais") ----------
  { id: 'dia.primeiraRefeicao', nivel: 2, tipo: 'hora', rotulo: 'Primeira refeição às', desbloqueia: ['feche-a-cozinha'] },
  { id: 'dia.maiorBloco', nivel: 2, tipo: 'inteiro', rotulo: 'Maior bloco sentado sem levantar', unidade: 'min', min: 0, max: 1440, desbloqueia: ['levante-a-cada-30'] },
  { id: 'dia.minPosJantar', nivel: 2, tipo: 'inteiro', rotulo: 'Minutos andando depois do jantar', unidade: 'min', min: 0, max: 300, desbloqueia: ['ande-depois-do-jantar'] },
  { id: 'dia.copos', nivel: 2, tipo: 'inteiro', rotulo: 'Copos de água, chá ou café', unidade: 'copos', ajuda: 'Copo de 250 mL.', min: 0, max: 40, desbloqueia: ['beba-pela-sede'] },
  { id: 'dia.proteinaG', nivel: 2, tipo: 'inteiro', rotulo: 'Proteína no dia', unidade: 'g', ajuda: 'Rótulo, app de dieta ou suplemento. Soma das refeições registradas, se houver.', min: 0, max: 500, desbloqueia: ['proteina-no-prato'] },
  { id: 'dia.fibraG', nivel: 2, tipo: 'inteiro', rotulo: 'Fibra no dia', unidade: 'g', ajuda: 'Rótulo ou app de dieta; psyllium conta.', min: 0, max: 200, desbloqueia: ['fibra-no-prato'] },
  { id: 'dia.refeicoesCozinhadas', nivel: 2, tipo: 'inteiro', rotulo: 'Refeições feitas de ingredientes', unidade: 'de 3', min: 0, max: 3, desbloqueia: ['comida-de-verdade'] },
  { id: 'dia.bebidaDoce', nivel: 2, tipo: 'inteiro', rotulo: 'Bebidas doces', unidade: 'por dia', ajuda: 'Refrigerante, suco, energético.', min: 0, max: 30, desbloqueia: ['troque-o-doce'] },
  {
    id: 'dia.alcoolDoses',
    nivel: 2,
    tipo: 'inteiro-ou-nao',
    rotulo: 'Doses de álcool',
    unidade: 'doses',
    ajuda: 'Uma dose ≈ lata de cerveja, taça de vinho ou dose de destilado. "Não bebi" também vale.',
    min: 0,
    max: 30,
    condicao: bebeAlcool,
    desbloqueia: ['se-beber'],
  },
  { id: 'dia.levantadas', nivel: 2, tipo: 'inteiro', rotulo: 'Vezes que levantei da cadeira', unidade: 'vezes', ajuda: 'Contado pelo botão "Levantei".', min: 0, max: 200, desbloqueia: ['levante-a-cada-30'] },
  { id: 'dia.peso', nivel: 2, tipo: 'decimal', rotulo: 'Peso', unidade: 'kg', ajuda: 'Só a média da semana é mostrada.', min: 20, max: 400, desbloqueia: ['emagreca-devagar'] },
  { id: 'dia.fcRepouso', nivel: 2, tipo: 'inteiro', rotulo: 'FC de repouso ao acordar', unidade: 'bpm', ajuda: 'Só a média de 7 dias é mostrada.', min: 30, max: 200, desbloqueia: [] },

  // ---------- dia · nível 3 ----------
  { id: 'dia.notas', nivel: 3, tipo: 'texto', rotulo: 'Notas', max: 2000, desbloqueia: [] },

  // ---------- semana (revisão de segunda, spec §5) ----------
  { id: 'semana.cintura', nivel: 1, tipo: 'decimal', rotulo: 'Cintura', unidade: 'cm', ajuda: 'Na altura do umbigo, sem apertar, antes do café.', min: 40, max: 250, desbloqueia: ['meca-a-cintura'] },
  { id: 'semana.sessoesTiros', nivel: 1, tipo: 'inteiro', rotulo: 'Sessões de tiros na semana', unidade: 'sessões', min: 0, max: 14, desbloqueia: ['tres-tiros', 'some-150'] },
  { id: 'semana.sessoesForca', nivel: 1, tipo: 'inteiro', rotulo: 'Sessões de força na semana', unidade: 'sessões', min: 0, max: 14, desbloqueia: ['levante-peso'] },
  { id: 'semana.minAtiv', nivel: 1, tipo: 'inteiro', rotulo: 'Minutos de atividade moderada na semana', unidade: 'min', ajuda: 'Sem contar os tiros.', min: 0, max: 3000, desbloqueia: ['some-150'] },
  { id: 'semana.maiorBlocoTipico', nivel: 2, tipo: 'inteiro', rotulo: 'Maior bloco sentado num dia típico', unidade: 'min', min: 0, max: 1440, desbloqueia: ['levante-a-cada-30'] },
  { id: 'semana.alcoolDoses', nivel: 2, tipo: 'inteiro', rotulo: 'Doses de álcool na semana', unidade: 'doses', min: 0, max: 100, condicao: bebeAlcool, desbloqueia: ['se-beber'] },
  { id: 'semana.docesSemana', nivel: 2, tipo: 'inteiro', rotulo: 'Bebidas doces na semana', unidade: 'por semana', min: 0, max: 100, desbloqueia: ['troque-o-doce'] },

  // ---------- mes (primeira segunda do mês) ----------
  { id: 'mes.panturrilha', nivel: 1, tipo: 'decimal', rotulo: 'Panturrilha', unidade: 'cm', ajuda: 'Ponto mais largo, sentado, perna a 90°.', min: 15, max: 80, desbloqueia: ['panturrilha-preensao'] },
  { id: 'mes.preensao', nivel: 2, tipo: 'decimal', rotulo: 'Força de preensão', unidade: 'kg', ajuda: 'Se tiver dinamômetro.', min: 0, max: 120, desbloqueia: ['panturrilha-preensao'] },
  { id: 'mes.repsAteFalhar', nivel: 2, tipo: 'inteiro', rotulo: 'Repetições até falhar', unidade: 'reps', ajuda: 'Num exercício fixo (flexão ou agachamento), se não tiver dinamômetro.', min: 0, max: 500, desbloqueia: ['panturrilha-preensao', 'levante-peso'] },

  // ---------- exame (todos opcionais; sinal de 12 semanas) ----------
  { id: 'exame.glicemia', nivel: 1, tipo: 'decimal', rotulo: 'Glicemia de jejum', unidade: 'mg/dL', min: 30, max: 600, desbloqueia: [] },
  { id: 'exame.hba1c', nivel: 1, tipo: 'decimal', rotulo: 'HbA1c', unidade: '%', min: 3, max: 20, desbloqueia: [] },
  { id: 'exame.homaIr', nivel: 1, tipo: 'decimal', rotulo: 'HOMA-IR', min: 0, max: 30, desbloqueia: [] },
  { id: 'exame.tg', nivel: 1, tipo: 'decimal', rotulo: 'Triglicerídeos', unidade: 'mg/dL', min: 10, max: 3000, desbloqueia: [] },
  { id: 'exame.hdl', nivel: 1, tipo: 'decimal', rotulo: 'HDL', unidade: 'mg/dL', min: 5, max: 200, desbloqueia: [] },
  { id: 'exame.ferritina', nivel: 2, tipo: 'decimal', rotulo: 'Ferritina', unidade: 'ng/mL', min: 0, max: 5000, desbloqueia: [] },
  { id: 'exame.b12', nivel: 2, tipo: 'decimal', rotulo: 'Vitamina B12', unidade: 'pg/mL', min: 0, max: 5000, desbloqueia: [] },
  { id: 'exame.vitD', nivel: 2, tipo: 'decimal', rotulo: 'Vitamina D (25-OH)', unidade: 'ng/mL', min: 0, max: 300, desbloqueia: [] },
  { id: 'exame.paSistolica', nivel: 1, tipo: 'inteiro', rotulo: 'Pressão sistólica', unidade: 'mmHg', min: 60, max: 260, desbloqueia: [] },
  { id: 'exame.paDiastolica', nivel: 1, tipo: 'inteiro', rotulo: 'Pressão diastólica', unidade: 'mmHg', min: 30, max: 160, desbloqueia: [] },
];

// Atribuição de dia-calendário (contratos §"Atribuição de dia (convenção)"): dia[D]
// descreve o dia D, exceto fome/comiSemFome (dia D−1) e deitou/levantou (a noite
// D−1→D). Os 12 campos abaixo são os únicos do check-in da manhã que seguem a
// convenção normal de dia-calendário e, por serem perguntados sobre o dia anterior,
// o check-in os grava em `dia[ontem]` — não em `dia[hoje]`, onde a tela roda.
export const CAMPOS_SOBRE_ONTEM: readonly CampoId[] = [
  'dia.ultimoCafe',
  'dia.jantarFim',
  'dia.passos',
  'dia.moveu',
  'dia.maiorBloco',
  'dia.minPosJantar',
  'dia.copos',
  'dia.proteinaG',
  'dia.fibraG',
  'dia.refeicoesCozinhadas',
  'dia.bebidaDoce',
  'dia.alcoolDoses',
];

export function campo(id: CampoId): Campo {
  const c = CAMPOS.find((x) => x.id === id);
  if (!c) throw new Error(`Campo '${id}' não está no registro.`);
  return c;
}

export function camposDe(tabela: 'dia' | 'semana' | 'mes' | 'exame', perfil: Perfil, nivel: 1 | 2 | 3 = 3): Campo[] {
  const prefixo = `${tabela}.`;
  return CAMPOS.filter((c) => c.id.startsWith(prefixo) && c.nivel <= nivel && (c.condicao === undefined || c.condicao(perfil)));
}

const HORA_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const MSG_HORA = 'Use o formato HH:MM (ex.: 23:30).';

function foraDaFaixa(c: Campo, v: number): string | null {
  const un = c.unidade ? ` ${c.unidade}` : '';
  if (c.min !== undefined && v < c.min) return `O mínimo é ${c.min}${un}.`;
  if (c.max !== undefined && v > c.max) return `O máximo é ${c.max}${un}.`;
  return null;
}

function nuncaChega(x: never): never {
  throw new Error(`Tipo de campo desconhecido: ${String(x)}`);
}

/** null = ok; string = mensagem ao usuário. A tela avisa e não grava (spec §9). */
export function validar(c: Campo, valor: unknown): string | null {
  if (valor === undefined) return null; // não registrou: sempre ok
  if (valor === null) {
    return c.tipo === 'hora-ou-nao' || c.tipo === 'inteiro-ou-nao' ? null : 'Informe um valor.';
  }
  switch (c.tipo) {
    case 'hora':
    case 'hora-ou-nao':
      return typeof valor === 'string' && HORA_RE.test(valor) ? null : MSG_HORA;
    case 'inteiro':
    case 'inteiro-ou-nao':
    case 'escala':
      if (typeof valor !== 'number' || !Number.isInteger(valor)) return 'Use um número inteiro.';
      return foraDaFaixa(c, valor);
    case 'decimal':
      if (typeof valor !== 'number' || !Number.isFinite(valor)) return 'Use um número.';
      return foraDaFaixa(c, valor);
    case 'bool':
      return typeof valor === 'boolean' ? null : 'Responda sim ou não.';
    case 'texto':
      if (typeof valor !== 'string') return 'Escreva um texto.';
      return c.max !== undefined && valor.length > c.max ? `No máximo ${c.max} caracteres.` : null;
    default:
      return nuncaChega(c.tipo);
  }
}
