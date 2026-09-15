import type { DataISO, EventoRefeicao, EventoTreino } from '@/dominio/tipos';
import { db } from '@/dados/db';

/** Mais recente primeiro: data desc, depois hora desc. */
function maisRecentePrimeiro<T extends { data: DataISO; hora: string }>(a: T, b: T): number {
  if (a.data !== b.data) return a.data < b.data ? 1 : -1;
  if (a.hora !== b.hora) return a.hora < b.hora ? 1 : -1;
  return 0;
}

export async function registrarTreino(e: Omit<EventoTreino, 'id' | 'atualizadoEm'>): Promise<EventoTreino> {
  const evento: EventoTreino = { ...e, id: crypto.randomUUID(), atualizadoEm: new Date().toISOString() };
  await db.eventoTreino.add(evento);
  return evento;
}

export async function registrarRefeicao(e: Omit<EventoRefeicao, 'id' | 'atualizadoEm'>): Promise<EventoRefeicao> {
  const evento: EventoRefeicao = { ...e, id: crypto.randomUUID(), atualizadoEm: new Date().toISOString() };
  await db.eventoRefeicao.add(evento);
  return evento;
}

export async function treinosEntre(de: DataISO, ate: DataISO): Promise<EventoTreino[]> {
  const lista = await db.eventoTreino.where('data').between(de, ate, true, true).toArray();
  return lista.sort(maisRecentePrimeiro);
}

export async function refeicoesEntre(de: DataISO, ate: DataISO): Promise<EventoRefeicao[]> {
  const lista = await db.eventoRefeicao.where('data').between(de, ate, true, true).toArray();
  return lista.sort(maisRecentePrimeiro);
}
