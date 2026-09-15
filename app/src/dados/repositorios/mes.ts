import type { Mes, MesISO } from '@/dominio/tipos';
import { db } from '@/dados/db';

export function lerMes(m: MesISO): Promise<Mes | undefined> {
  return db.mes.get(m);
}

export function salvarMes(m: MesISO, parcial: Partial<Omit<Mes, 'mes' | 'atualizadoEm'>>): Promise<Mes> {
  return db.transaction('rw', db.mes, async () => {
    const atual = await db.mes.get(m);
    const novo: Mes = { ...atual, ...parcial, mes: m, atualizadoEm: new Date().toISOString() };
    await db.mes.put(novo);
    return novo;
  });
}

export function mesMaisRecente(): Promise<Mes | undefined> {
  return db.mes.orderBy('mes').last();
}
