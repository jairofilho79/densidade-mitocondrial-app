import { derivar, type Derivados } from '../derivados';
import type { DataISO, Dia, EventoTreino, Mes, Perfil, Semana, SemanaISO } from '../tipos';
import { dataISO } from './_util';
import type { Contexto } from './tipos';

/** Quinta-feira, 17/09/2026, 09:00 (hora local). Semana ISO 2026-W38 = segunda 14 a domingo 20. */
export const AGORA = new Date(2026, 8, 17, 9, 0, 0);
export const HOJE: DataISO = '2026-09-17';
export const ONTEM: DataISO = '2026-09-16';
export const SEMANA: SemanaISO = '2026-W38';

export const perfilBase: Perfil = {
  peso: 90,
  altura: 175,
  idade: 40,
  sexo: 'H',
  levantar: '06:30',
  deitar: '23:30',
  cafe: 'diario',
  alcool: 'as-vezes',
  remedios: [],
  fuma: 'nao',
  examesQueTem: [],
  atualizadoEm: '2026-09-14T08:00:00.000Z',
};

export function diaBase(data: DataISO, parcial: Partial<Omit<Dia, 'data'>> = {}): Dia {
  return { data, atualizadoEm: `${data}T08:00:00.000Z`, ...parcial };
}

let contadorEvento = 0;
export function eventoBase(
  data: DataISO,
  tipo: EventoTreino['tipo'],
  minutos = 20,
  parcial: Partial<EventoTreino> = {},
): EventoTreino {
  contadorEvento += 1;
  return {
    id: `ev-${contadorEvento}`,
    data,
    hora: '07:00',
    tipo,
    minutos,
    atualizadoEm: `${data}T08:00:00.000Z`,
    ...parcial,
  };
}

export function semanaBase(parcial: Partial<Semana> = {}): Semana {
  return { semana: SEMANA, atualizadoEm: '2026-09-14T08:00:00.000Z', ...parcial };
}

export function mesBase(parcial: Partial<Mes> = {}): Mes {
  return { mes: '2026-09', atualizadoEm: '2026-09-07T08:00:00.000Z', ...parcial };
}

export interface CtxParcial extends Partial<Omit<Contexto, 'derivados'>> {
  derivados?: Partial<Derivados>;
}

/** Monta um Contexto real (com `derivar()` do plano 01); `derivados` parcial sobrescreve por cima. */
export function ctxBase(parcial: CtxParcial = {}): Contexto {
  const perfil = parcial.perfil ?? perfilBase;
  const agora = parcial.agora ?? AGORA;
  const hojeData = dataISO(agora);

  const dias = [...(parcial.dias ?? [])];
  const hojeParcial = parcial.hoje;
  if (hojeParcial && !dias.some((d) => d.data === hojeParcial.data)) dias.push(hojeParcial);
  dias.sort((a, b) => (a.data < b.data ? 1 : a.data > b.data ? -1 : 0)); // mais recente primeiro

  const hoje = parcial.hoje ?? dias.find((d) => d.data === hojeData);
  const eventos = [...(parcial.eventos ?? [])].sort((a, b) => (a.data < b.data ? 1 : a.data > b.data ? -1 : 0));
  const semana = parcial.semana;

  const derivados: Derivados = {
    ...derivar(perfil, dias, eventos, semana, hojeData),
    ...(parcial.derivados ?? {}),
  };

  return {
    perfil,
    hoje,
    dias,
    eventos,
    refeicoes: parcial.refeicoes ?? [],
    semana,
    mes: parcial.mes,
    derivados,
    agora,
  };
}
