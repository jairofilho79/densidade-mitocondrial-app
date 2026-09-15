import type { Dia, EventoRefeicao, EventoTreino, Exame, Mes, Perfil, Semana } from '@/dominio/tipos';
import { db } from '@/dados/db';
import { lerPerfil } from '@/dados/repositorios/perfil';

export interface Exportacao {
  versao: 1;
  exportadoEm: string;
  perfil?: Perfil;
  dia: Dia[];
  eventoTreino: EventoTreino[];
  eventoRefeicao: EventoRefeicao[];
  semana: Semana[];
  mes: Mes[];
  exame: Exame[];
}

type Tabela = 'dia' | 'eventoTreino' | 'eventoRefeicao' | 'semana' | 'mes' | 'exame';
const TABELAS: Tabela[] = ['dia', 'eventoTreino', 'eventoRefeicao', 'semana', 'mes', 'exame'];
const CHAVE: Record<Tabela, string> = { dia: 'data', eventoTreino: 'id', eventoRefeicao: 'id', semana: 'semana', mes: 'mes', exame: 'data' };
const CHAVES_PERMITIDAS = new Set<string>(['versao', 'exportadoEm', 'perfil', ...TABELAS]);

type Linha = Record<string, unknown> & { atualizadoEm?: unknown };

interface Validado {
  perfil?: Linha;
  tabelas: Record<Tabela, Linha[]>;
}

type Resultado = { ok: true; contagem: Record<string, number> } | { ok: false; motivo: string };

function ehObjeto(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Valida TUDO e devolve o conteúdo normalizado (tabelas ausentes = []). Nunca toca no banco. */
function validar(json: unknown): { ok: true; dados: Validado } | { ok: false; motivo: string } {
  if (!ehObjeto(json)) return { ok: false, motivo: 'O arquivo não é um objeto de exportação.' };
  if (json.versao !== 1) return { ok: false, motivo: `Versão de exportação não suportada: ${String(json.versao)} (esperada 1).` };

  for (const chave of Object.keys(json)) {
    if (!CHAVES_PERMITIDAS.has(chave)) return { ok: false, motivo: `Tabela desconhecida: ${chave}.` };
  }

  let perfil: Linha | undefined;
  if (json.perfil !== undefined) {
    if (!ehObjeto(json.perfil)) return { ok: false, motivo: 'O perfil não é um objeto.' };
    perfil = json.perfil;
  }

  const tabelas = {} as Record<Tabela, Linha[]>;
  for (const tabela of TABELAS) {
    const valor = json[tabela] ?? [];
    if (!Array.isArray(valor)) return { ok: false, motivo: `A tabela ${tabela} deveria ser uma lista.` };
    const chave = CHAVE[tabela];
    for (let i = 0; i < valor.length; i++) {
      const linha: unknown = valor[i];
      if (!ehObjeto(linha) || typeof linha[chave] !== 'string' || linha[chave] === '') {
        return { ok: false, motivo: `Linha ${i + 1} da tabela ${tabela} sem o campo "${chave}".` };
      }
    }
    tabelas[tabela] = valor as Linha[];
  }

  return { ok: true, dados: { perfil, tabelas } };
}

/** A linha nova vence se não há existente ou se seu atualizadoEm (ISO) é maior. Sem atualizadoEm = a mais antiga possível. */
function maisRecente(nova: Linha, atual: Linha | undefined): boolean {
  if (!atual) return true;
  const a = typeof nova.atualizadoEm === 'string' ? nova.atualizadoEm : '';
  const b = typeof atual.atualizadoEm === 'string' ? atual.atualizadoEm : '';
  return a > b;
}

export async function exportar(): Promise<Exportacao> {
  const [perfil, dia, eventoTreino, eventoRefeicao, semana, mes, exame] = await Promise.all([
    lerPerfil(),
    db.dia.toArray(),
    db.eventoTreino.toArray(),
    db.eventoRefeicao.toArray(),
    db.semana.toArray(),
    db.mes.toArray(),
    db.exame.toArray(),
  ]);
  const exportacao: Exportacao = { versao: 1, exportadoEm: new Date().toISOString(), dia, eventoTreino, eventoRefeicao, semana, mes, exame };
  if (perfil) exportacao.perfil = perfil;
  return exportacao;
}

/**
 * Importa com merge por chave (atualizadoEm mais recente vence).
 * Aceita o objeto já parseado ou o texto do arquivo. Se qualquer coisa for inválida
 * (JSON malformado, formato do envelope, tabela ou linha), a validação roda inteira
 * ANTES de abrir a transação e nada é gravado — só então devolve `{ ok: false, motivo }`.
 * Uma falha inesperada do IndexedDB/Dexie já dentro da transação (disco cheio, quota
 * excedida etc.) não é convertida: a promise rejeita e propaga para quem chamou.
 */
export async function importar(json: unknown): Promise<Resultado> {
  let conteudo = json;
  if (typeof json === 'string') {
    try {
      conteudo = JSON.parse(json);
    } catch {
      return { ok: false, motivo: 'O arquivo não é um JSON válido.' };
    }
  }

  const validacao = validar(conteudo);
  if (!validacao.ok) return validacao;
  const { perfil, tabelas } = validacao.dados;

  const contagem: Record<string, number> = { perfil: 0 };
  for (const tabela of TABELAS) contagem[tabela] = 0;

  await db.transaction('rw', db.tables, async () => {
    if (perfil) {
      const atual = (await db.perfil.get('me')) as Linha | undefined;
      if (maisRecente(perfil, atual)) {
        await db.perfil.put({ ...(perfil as unknown as Perfil), id: 'me' });
        contagem.perfil = 1;
      }
    }
    for (const tabela of TABELAS) {
      const tabelaDb = db.table(tabela);
      for (const linha of tabelas[tabela]) {
        const chave = linha[CHAVE[tabela]] as string; // validar() já garantiu que é string não vazia
        const atual = (await tabelaDb.get(chave)) as Linha | undefined;
        if (maisRecente(linha, atual)) {
          await tabelaDb.put(linha);
          contagem[tabela] += 1;
        }
      }
    }
  });

  return { ok: true, contagem };
}

export async function apagarTudo(): Promise<void> {
  await db.transaction('rw', db.tables, async () => {
    await Promise.all(db.tables.map((t) => t.clear()));
  });
}
