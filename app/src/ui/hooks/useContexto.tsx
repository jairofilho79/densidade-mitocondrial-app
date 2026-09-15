import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import type { Contexto } from '@/dominio/metas/tipos';
import { montarContexto } from '@/dados/contexto';
import { hojeISO } from '@/dados/datas';

export interface EstadoContexto {
  ctx: Contexto | undefined;
  carregando: boolean;
  semPerfil: boolean;
}

/**
 * Recalcula sempre que qualquer tabela muda: useLiveQuery observa todas as
 * consultas Dexie feitas dentro do callback, e montarContexto consulta seis
 * tabelas (exame não entra no Contexto). Gravou em qualquer uma, o contexto
 * recalcula.
 *
 * Também recalcula quando o dia vira: `hoje` fica em estado (inicializado uma
 * vez com `hojeISO()`) e só é reavaliado por um listener de `visibilitychange`
 * — se a aba ficou em segundo plano e a meia-noite passou nesse meio tempo, ao
 * voltar a ficar visível o listener percebe que `hojeISO()` mudou e atualiza o
 * estado; `hoje` entra como dependência do `useLiveQuery` para que a consulta
 * seja refeita com a nova data.
 */
function useContextoInterno(): EstadoContexto {
  const [hoje, setHoje] = useState(hojeISO());

  useEffect(() => {
    function verificarData() {
      if (document.visibilityState !== 'visible') return;
      const agora = hojeISO();
      setHoje((atual) => (atual === agora ? atual : agora));
    }
    document.addEventListener('visibilitychange', verificarData);
    return () => document.removeEventListener('visibilitychange', verificarData);
  }, []);

  const r = useLiveQuery(() => montarContexto(hoje), [hoje]);
  if (r === undefined) return { ctx: undefined, carregando: true, semPerfil: false };
  if ('semPerfil' in r) return { ctx: undefined, carregando: false, semPerfil: true };
  return { ctx: r, carregando: false, semPerfil: false };
}

const ContextoCtx = createContext<EstadoContexto | null>(null);

/**
 * Fonte única do Contexto para toda a árvore (fix wave round 2, item 1): antes,
 * a Guarda (App.tsx) e a tela Perfil liam duas useLiveQuery independentes —
 * com latência assíncrona do IndexedDB, elas podiam resolver em ticks
 * diferentes, e a Guarda via `semPerfil` um instante depois de Perfil já ter
 * decidido navegar, devolvendo para /perfil. Com um único provider, Guarda e
 * Perfil leem exatamente o mesmo valor no mesmo render — a virada para "tem
 * perfil" chega às duas ao mesmo tempo.
 */
export function ContextoProvider({ children }: { children: ReactNode }) {
  const estado = useContextoInterno();
  return <ContextoCtx.Provider value={estado}>{children}</ContextoCtx.Provider>;
}

export function useContexto(): EstadoContexto {
  const estado = useContext(ContextoCtx);
  if (estado === null) throw new Error('useContexto precisa ser usado dentro de <ContextoProvider>.');
  return estado;
}
