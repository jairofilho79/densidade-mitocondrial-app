import { useLiveQuery } from 'dexie-react-hooks';
import type { DataISO, Dia } from '@/dominio/tipos';
import { lerDia } from '@/dados/repositorios/dia';

export function useDia(data: DataISO): Dia | undefined {
  return useLiveQuery(() => lerDia(data), [data]);
}
