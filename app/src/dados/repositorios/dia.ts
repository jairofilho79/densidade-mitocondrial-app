import type { DataISO, Dia } from '@/dominio/tipos';
import { db } from '@/dados/db';
import { somarDias } from '@/dados/datas';

export function lerDia(data: DataISO): Promise<Dia | undefined> {
  return db.dia.get(data);
}

/** Merge com o registro existente; `undefined` num campo do parcial apaga o campo (volta a "não registrou"). */
export function salvarDia(data: DataISO, parcial: Partial<Omit<Dia, 'data' | 'atualizadoEm'>>): Promise<Dia> {
  return db.transaction('rw', db.dia, async () => {
    const atual = await db.dia.get(data);
    const novo: Dia = { ...atual, ...parcial, data, atualizadoEm: new Date().toISOString() };
    await db.dia.put(novo);
    return novo;
  });
}

/** Os dias registrados na janela [ate − (n − 1), ate], mais recente primeiro. Dias sem registro não aparecem. */
export async function diasRecentes(ate: DataISO, n: number): Promise<Dia[]> {
  const de = somarDias(ate, -(n - 1));
  const dias = await db.dia.where('data').between(de, ate, true, true).toArray();
  return dias.sort((a, b) => (a.data < b.data ? 1 : -1));
}
