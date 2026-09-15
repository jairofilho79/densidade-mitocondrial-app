import type { Faixa, Zona } from '@/dominio/metas/tipos';
import { fmt } from '@/dominio/metas/_util';
import { ROTULO_ZONA } from '@/ui/formato';
import './componentes.css';

export interface BarraZonaProps {
  zona: Zona;
  posicao: number | null;
  faixa: Faixa | null;
}

/** Só desenha o marcador em `posicao` — nunca assume a meta no meio da barra (0,5). */
export function BarraZona({ zona, posicao, faixa }: BarraZonaProps) {
  const semDado = zona === 'sem-dado';
  const mostraMarcador = posicao !== null && !semDado;
  const pct = mostraMarcador ? Math.round(Math.min(1, Math.max(0, posicao)) * 100) : 0;
  return (
    <div className={`barra zona-${zona}`} role="img" aria-label={`Zona: ${ROTULO_ZONA[zona]}`}>
      <i className={semDado ? 'nd' : 'p'}>{faixa && <span className="rotulo">{fmt(faixa.pouco)}</span>}</i>
      <i className={semDado ? 'nd' : 'i'}>{faixa && <span className="rotulo">{fmt(faixa.meta)}</span>}</i>
      <i className={semDado ? 'nd' : 'd'}>{faixa && <span className="rotulo">{fmt(faixa.demais)}</span>}</i>
      {mostraMarcador && <span className="voce" style={{ left: `${pct}%` }} />}
    </div>
  );
}
