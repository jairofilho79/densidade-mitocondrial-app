import type { Perfil } from '@/dominio/tipos';
import { db } from '@/dados/db';

const CHAVE = 'me' as const;

export async function lerPerfil(): Promise<Perfil | undefined> {
  const linha = await db.perfil.get(CHAVE);
  if (!linha) return undefined;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- separa o id interno da tabela
  const { id, ...perfil } = linha;
  return perfil;
}

export async function salvarPerfil(p: Omit<Perfil, 'atualizadoEm'>): Promise<Perfil> {
  const perfil: Perfil = { ...p, atualizadoEm: new Date().toISOString() };
  await db.perfil.put({ ...perfil, id: CHAVE });
  return perfil;
}
