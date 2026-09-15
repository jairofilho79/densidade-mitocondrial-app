import { db } from '@/dados/db';

/**
 * Spec §9: com IndexedDB indisponível (modo privado, cota, bloqueio) a app mostra uma mensagem única
 * na abertura e segue em memória na sessão. Esta função só responde a pergunta; nunca lança.
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
