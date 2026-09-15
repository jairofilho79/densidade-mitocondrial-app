import type { Perfil } from '@/dominio/tipos';

export const PERFIL: Omit<Perfil, 'atualizadoEm'> = {
  peso: 90,
  altura: 175,
  idade: 40,
  sexo: 'H',
  levantar: '06:30',
  deitar: '23:30',
  cafe: 'diario',
  alcool: 'nao',
  remedios: [],
  fuma: 'nao',
  examesQueTem: [],
};

export const PERFIL_SEM_CAFE: Omit<Perfil, 'atualizadoEm'> = { ...PERFIL, cafe: 'nao' };
