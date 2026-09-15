import type { Perfil } from '@/dominio/tipos';
import { db } from '@/dados/db';

/** Apaga e reabre o banco. Use em `beforeEach` de todo teste de dados/. */
export async function limparBanco(): Promise<void> {
  await db.delete();
  await db.open();
}

export const PERFIL_TESTE: Omit<Perfil, 'atualizadoEm'> = {
  peso: 80,
  altura: 175,
  idade: 40,
  sexo: 'H',
  levantar: '07:00',
  deitar: '23:00',
  cafe: 'diario',
  alcool: 'as-vezes',
  remedios: [],
  fuma: 'nao',
  examesQueTem: [],
};
