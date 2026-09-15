import type { CampoId } from '../campos';
import type { AcaoId } from '../catalogo/tipos';
import { horaParaMin, horasEntre, minParaHora, somarDias } from '../derivados';
import { avisoSeguranca } from '../seguranca';
import type { DataISO, Dia, EventoTreino, Hora, Perfil, Semana, SemanaISO } from '../tipos';
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

export function semDado(
  precisaDe: CampoId[],
  texto = 'ainda sem registro',
  vals?: Record<string, string | number>,
): Meta {
  return {
    zona: 'sem-dado',
    valor: null,
    faixa: null,
    posicao: null,
    texto,
    proximoPasso: 'registre para ver onde você está',
    precisaDe,
    vals,
  };
}

/** Número com vírgula decimal, sem zeros à direita desnecessários (`fmt(7.5)` → `"7,5"`, `fmt(2)` → `"2"`). */
export function fmt(n: number, casas = 1): string {
  let s = n.toFixed(casas);
  if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
  return s.replace('.', ',');
}

/** Substitui `{chave}` por `vals[chave]` (números via `fmt`); chaves ausentes ficam como estão. */
export function interpolar(texto: string, vals: Record<string, string | number>): string {
  return texto.replace(/\{([a-z_0-9]+)\}/g, (m, chave: string) => {
    if (!(chave in vals)) return m;
    const v = vals[chave];
    return typeof v === 'number' ? fmt(v) : v;
  });
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

/** Sessões de `tipo` nos últimos 7 dias (janela móvel; ver regra de precedência no contrato). */
export function contarSessoes7(ctx: Contexto, tipo: EventoTreino['tipo']): number {
  return eventosUltimos(ctx, 7).filter((e) => e.tipo === tipo).length;
}

/** Soma de `dia[campo]` (números; `null` conta como 0) nos últimos 7 dias; `undefined` se nenhum dia registrou o campo. */
export function somaUltimos7<K extends keyof Dia>(ctx: Contexto, campo: K): number | undefined {
  const registrados = diasUltimos(ctx, 7).filter((d) => d[campo] !== undefined);
  if (registrados.length === 0) return undefined;
  return registrados.reduce((soma, d) => {
    const v = d[campo];
    return soma + (typeof v === 'number' ? v : 0);
  }, 0);
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

/**
 * Horas de `hora` até `deitar`, com virada de meia-noite tratada pela janela de sono, não por um
 * corte fixo de 12 h (um café às 7h com deitar às 23h30 está 16,5 h antes, não "depois"):
 * se `hora` cai dentro de `[deitar, levantar)` — a pessoa já devia estar dormindo — o valor é
 * negativo (depois de deitar); senão é `horasEntre(hora, deitar)` normal.
 */
export function horasAntesDeDeitar(hora: Hora, deitar: Hora, levantar: Hora): number {
  const dentroDoSono = horasEntre(deitar, hora) < horasEntre(deitar, levantar);
  return dentroDoSono ? -horasEntre(deitar, hora) : horasEntre(hora, deitar);
}

/** Move `horaAtual` em direção a `horaAlvo` em no máximo 15 min (o menor entre 15 e o que falta). */
export function passo15min(horaAtual: Hora, horaAlvo: Hora, direcao: 'antes' | 'depois'): { hora: Hora; minutos: number } {
  const atualMin = horaParaMin(horaAtual);
  const alvoMin = horaParaMin(horaAlvo);
  const restam = direcao === 'antes' ? ((atualMin - alvoMin) % 1440 + 1440) % 1440 : ((alvoMin - atualMin) % 1440 + 1440) % 1440;
  const minutos = Math.min(15, restam);
  const hora = minParaHora(direcao === 'antes' ? atualMin - minutos : atualMin + minutos);
  return { hora, minutos };
}
