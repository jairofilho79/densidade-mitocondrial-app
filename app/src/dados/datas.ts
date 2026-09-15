import { somarDias } from '@/dominio/derivados';
import type { DataISO, MesISO, SemanaISO } from '@/dominio/tipos';

export { somarDias } from '@/dominio/derivados';

const DIA_MS = 86_400_000;

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** "YYYY-MM-DD" → timestamp UTC da meia-noite desse dia. Nunca use `new Date(string)` aqui: viraria o dia em fuso negativo. */
function utcDe(d: DataISO): number {
  const [ano, mes, dia] = d.split('-').map(Number);
  return Date.UTC(ano, mes - 1, dia);
}

function isoDe(utcMs: number): DataISO {
  return new Date(utcMs).toISOString().slice(0, 10);
}

/** Data local do aparelho (o dia que a pessoa vive), não UTC. */
export function hojeISO(agora: Date = new Date()): DataISO {
  return `${agora.getFullYear()}-${pad2(agora.getMonth() + 1)}-${pad2(agora.getDate())}`;
}

export function ontem(d: DataISO): DataISO {
  return somarDias(d, -1);
}

export function mesISO(d: DataISO): MesISO {
  return d.slice(0, 7);
}

/** Segunda-feira da semana 1 do ano ISO `ano`: a semana que contém 4 de janeiro. */
function segundaDaSemana1(ano: number): number {
  const jan4 = Date.UTC(ano, 0, 4);
  const diaDaSemana = (new Date(jan4).getUTCDay() + 6) % 7; // segunda = 0 … domingo = 6
  return jan4 - diaDaSemana * DIA_MS;
}

/** ISO 8601: a semana começa na segunda; o ano ISO é o ano da quinta-feira daquela semana. */
export function semanaISO(d: DataISO): SemanaISO {
  const t = utcDe(d);
  const diaDaSemana = (new Date(t).getUTCDay() + 6) % 7;
  const quinta = t - diaDaSemana * DIA_MS + 3 * DIA_MS;
  const anoISO = new Date(quinta).getUTCFullYear();
  const semana = Math.round((quinta - segundaDaSemana1(anoISO)) / (7 * DIA_MS)) + 1;
  return `${anoISO}-W${pad2(semana)}`;
}

export function segundaDaSemana(s: SemanaISO): DataISO {
  const [ano, semana] = s.split('-W').map(Number);
  return isoDe(segundaDaSemana1(ano) + (semana - 1) * 7 * DIA_MS);
}

/** Semana ISO anterior à de `hoje` — usada pela revisão de segunda (tela Segunda, plano 04). */
export function semanaAnteriorISO(hoje: DataISO): SemanaISO {
  return semanaISO(somarDias(hoje, -7));
}
