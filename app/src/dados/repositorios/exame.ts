import type { Exame } from '@/dominio/tipos';
import { db } from '@/dados/db';

/** Mais recente primeiro. */
export function listarExames(): Promise<Exame[]> {
  return db.exame.orderBy('data').reverse().toArray();
}

/** Merge por data: registrar só a hba1c num exame já existente não apaga a glicemia. */
export function salvarExame(e: Omit<Exame, 'atualizadoEm'>): Promise<Exame> {
  return db.transaction('rw', db.exame, async () => {
    const atual = await db.exame.get(e.data);
    const novo: Exame = { ...atual, ...e, atualizadoEm: new Date().toISOString() };
    await db.exame.put(novo);
    return novo;
  });
}

export function ultimoExame(): Promise<Exame | undefined> {
  return db.exame.orderBy('data').last();
}
