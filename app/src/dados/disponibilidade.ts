import { db } from '@/dados/db';

/**
 * Spec §9: com IndexedDB indisponível (modo privado, cota, bloqueio) a app mostra uma mensagem única
 * na abertura, explicando que este navegador não permite guardar dados e sugerindo abrir fora do
 * modo privado. Contrato: a v1 não tem modo em memória (fora do escopo, spec §1) — esta função só
 * responde a pergunta; nunca lança.
 */
export async function indexedDbDisponivel(): Promise<boolean> {
  if (typeof globalThis.indexedDB === 'undefined') return false;
  try {
    await db.open();
    return true;
  } catch {
    return false;
  }
}
