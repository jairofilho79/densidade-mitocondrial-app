import type { CampoId } from '../campos';
import type { AcaoId } from '../catalogo/tipos';
import { somarDias } from '../derivados';
import { avisoSeguranca } from '../seguranca';
import type { DataISO, Dia, EventoTreino, Perfil, Semana, SemanaISO } from '../tipos';
import type { Contexto, Meta } from './tipos';

const DIA_MS = 86_400_000;

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** `Date` (hora local) → `YYYY-MM-DD`. */
export function dataISO(d: Date): DataISO {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function hojeISO(ctx: Contexto): DataISO {
  return dataISO(ctx.agora);
}

function utc(data: DataISO): Date {
  const [a, m, d] = data.split('-').map(Number);
  return new Date(Date.UTC(a, m - 1, d));
}

/** Semana ISO 8601: `'2026-09-17' → '2026-W38'`. */
export function semanaISO(data: DataISO): SemanaISO {
  const t = utc(data);
  const diaSemana = t.getUTCDay() || 7; // 1 = segunda … 7 = domingo
  t.setUTCDate(t.getUTCDate() + 4 - diaSemana); // quinta-feira da mesma semana define o ano
  const ano = t.getUTCFullYear();
  const inicioAno = Date.UTC(ano, 0, 1);
  const semana = Math.ceil(((t.getTime() - inicioAno) / DIA_MS + 1) / 7);
  return `${ano}-W${pad2(semana)}`;
}

/** Segunda-feira da semana ISO que contém `data`. */
export function inicioSemana(data: DataISO): DataISO {
  const diaSemana = utc(data).getUTCDay() || 7;
  return somarDias(data, 1 - diaSemana);
}

export function semDado(precisaDe: CampoId[], texto = 'ainda sem registro'): Meta {
  return {
    zona: 'sem-dado',
    valor: null,
    faixa: null,
    posicao: null,
    texto,
    proximoPasso: 'registre para ver onde você está',
    precisaDe,
  };
}

/** Dia mais recente em que `dias[i][campo] !== undefined` (`null` conta como registrado). */
export function ultimoDiaCom<K extends keyof Dia>(dias: Dia[], campo: K): Dia | undefined {
  return dias.find((d) => d[campo] !== undefined);
}

/** Dias com `data` entre `hoje − (n − 1)` e `hoje`, inclusive. */
export function diasUltimos(ctx: Contexto, n: number): Dia[] {
  const hoje = hojeISO(ctx);
  const limite = somarDias(hoje, -(n - 1));
  return ctx.dias.filter((d) => d.data >= limite && d.data <= hoje);
}

export function eventosUltimos(ctx: Contexto, n: number): EventoTreino[] {
  const hoje = hojeISO(ctx);
  const limite = somarDias(hoje, -(n - 1));
  return ctx.eventos.filter((e) => e.data >= limite && e.data <= hoje);
}

/** Sessões de `tipo` na semana ISO corrente (segunda-feira até hoje). */
export function contarSessoes(eventos: EventoTreino[], tipo: EventoTreino['tipo'], ctx: Contexto): number {
  const hoje = hojeISO(ctx);
  const segunda = inicioSemana(hoje);
  return eventos.filter((e) => e.tipo === tipo && e.data >= segunda && e.data <= hoje).length;
}

/** `ctx.semana` quando ela é a revisão da semana ISO de hoje; senão `undefined`. */
export function semanaAtual(ctx: Contexto): Semana | undefined {
  if (!ctx.semana) return undefined;
  return ctx.semana.semana === semanaISO(hojeISO(ctx)) ? ctx.semana : undefined;
}

/** Para espalhar na Meta: `{ deDia }` quando o dia não é hoje, `{}` quando é. */
export function deDiaSeNaoHoje(ctx: Contexto, dia: Dia): { deDia?: DataISO } {
  return dia.data === hojeISO(ctx) ? {} : { deDia: dia.data };
}

export function aplicarSeguranca(id: AcaoId, perfil: Perfil, meta: Meta): Meta {
  const aviso = avisoSeguranca(id, perfil);
  return aviso === undefined ? meta : { ...meta, seguranca: aviso };
}
