import type { DataISO, EventoRefeicao, EventoTreino } from '@/dominio/tipos';
import { db } from '@/dados/db';

/** Mais recente primeiro: data desc, depois hora desc. */
function maisRecentePrimeiro<T extends { data: DataISO; hora: string }>(a: T, b: T): number {
  if (a.data !== b.data) return a.data < b.data ? 1 : -1;
  if (a.hora !== b.hora) return a.hora < b.hora ? 1 : -1;
  return 0;
}

/** Fallback do id: uuid v4 construído a partir de 16 bytes aleatórios (RFC 4122 §4.4). */
function uuidV4ViaGetRandomValues(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // versão 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variante 10xx
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** ids UUID v4; usa `crypto.randomUUID` quando existe, com fallback via `getRandomValues` (Safari/WebKit mais antigos). */
function novoId(): string {
  return crypto.randomUUID?.() ?? uuidV4ViaGetRandomValues();
}

export async function registrarTreino(e: Omit<EventoTreino, 'id' | 'atualizadoEm'>): Promise<EventoTreino> {
  const evento: EventoTreino = { ...e, id: novoId(), atualizadoEm: new Date().toISOString() };
  await db.eventoTreino.add(evento);
  return evento;
}

export async function registrarRefeicao(e: Omit<EventoRefeicao, 'id' | 'atualizadoEm'>): Promise<EventoRefeicao> {
  const evento: EventoRefeicao = { ...e, id: novoId(), atualizadoEm: new Date().toISOString() };
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
