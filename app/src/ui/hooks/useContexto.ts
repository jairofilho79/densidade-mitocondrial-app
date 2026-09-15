import { useEffect, useState } from 'react';
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
export function useContexto(): EstadoContexto {
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
