import { useLiveQuery } from 'dexie-react-hooks';
import type { Perfil } from '@/dominio/tipos';
import { lerPerfil } from '@/dados/repositorios/perfil';

/** undefined enquanto carrega ou quando não há perfil. */
export function usePerfil(): Perfil | undefined {
  return useLiveQuery(() => lerPerfil(), []);
}
