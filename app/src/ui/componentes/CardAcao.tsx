import { Link } from 'react-router';
import type { AcaoCatalogo } from '@/dominio/catalogo/tipos';
import type { Meta } from '@/dominio/metas/tipos';
import { interpolar } from '@/dominio/metas/_util';
import type { Campo } from '@/dominio/campos';
import { CAMPOS } from '@/dominio/campos';
import { BarraZona } from './BarraZona';
import { ConviteRegistro } from './ConviteRegistro';
import { ROTULO_ZONA, formatarData } from '@/ui/formato';
import './componentes.css';

export interface CardAcaoProps {
  acao: AcaoCatalogo;
  meta: Meta;
  compacto?: boolean;
}

export function CardAcao({ acao, meta, compacto = false }: CardAcaoProps) {
  const semDado = meta.zona === 'sem-dado';
  const precisaDe = meta.precisaDe ?? [];
  const camposFaltando = precisaDe
    .map((id) => CAMPOS.find((c) => c.id === id))
    .filter((c): c is Campo => c !== undefined);
  const faltaPerfil = precisaDe.some((id) => id.startsWith('perfil.'));
  // Ação semanal: precisaDe cita um campo `semana.*` (troque-o-doce, se-beber) ou não cita nenhum
  // dia.* mas depende de revisão semanal via eventos (tres-tiros, levante-peso, some-150 — nesses
  // três precisaDe é `semana.sessoesTiros`/`semana.sessoesForca`/`semana.minAtiv`, mesmo padrão).
  const semanal = precisaDe.some((id) => id.startsWith('semana.'));
  const vals = meta.vals ?? {};
  // Placeholder aberto ({chave}) só acontece quando a ação está sem-dado e a faixa depende
  // justamente do dado ausente (ver item 19: prox_passos, jejum_h, delta_peso, jantar, primeira) —
  // nesse caso a linha não tem informação útil para mostrar, então ela some.
  const temPlaceholderAberto = (texto: string) => semDado && /\{[a-z_0-9]+\}/.test(interpolar(texto, vals));

  return (
    <article className={`card zona-${meta.zona}${compacto ? ' compacto' : ''}`} data-acao={acao.id}>
      <header className="card-top">
        <h3>{acao.titulo}</h3>
        <div className="chips">
          <span className={`chip st ${meta.zona}`}>{ROTULO_ZONA[meta.zona]}</span>
          <span className="chip ev">{acao.evidencia.grau}</span>
        </div>
      </header>

      <div className="faixa">
        <BarraZona zona={meta.zona} posicao={meta.posicao} faixa={meta.faixa} />
        <ul className="faixa-catalogo">
          {!temPlaceholderAberto(acao.faixa.pouco) && <li><b>pouco</b> {interpolar(acao.faixa.pouco, vals)}</li>}
          {!temPlaceholderAberto(acao.faixa.ideal) && <li><b>ideal</b> {interpolar(acao.faixa.ideal, vals)}</li>}
          {!temPlaceholderAberto(acao.faixa.demais) && <li><b>demais</b> {interpolar(acao.faixa.demais, vals)}</li>}
          {acao.faixa.regra && !temPlaceholderAberto(acao.faixa.regra) && (
            <li className="regra">{interpolar(acao.faixa.regra, vals)}</li>
          )}
        </ul>
        {semDado ? (
          <>
            <ConviteRegistro campos={camposFaltando} semanal={semanal} />
            {faltaPerfil && (
              <p className="perfil-falta">
                <Link to="/perfil">Complete o perfil</Link> para esta ação ter meta.
              </p>
            )}
          </>
        ) : (
          <>
            <p className="voce-texto">
              <b>você · </b>{meta.texto}
              {meta.deDia && <span className="de-dia"> · de {formatarData(meta.deDia)}</span>}
            </p>
            {meta.seguranca ? <p className="seguranca">{meta.seguranca}</p> : <p className="prox">{meta.proximoPasso}</p>}
          </>
        )}
      </div>

      <div className="gat">
        <div><b>gatilho</b> · <span>{acao.gatilho}</span></div>
        <div><b>2 minutos</b> · <span>{acao.acao_minima}</span></div>
      </div>

      {!compacto && (
        <>
          <p className="descricao">{acao.descricao}</p>
          <div className="ipo">
            <div className="a"><b>input</b>{acao.afeta.input}</div>
            <div className="b"><b>processo</b>{acao.afeta.processo}</div>
            <div className="c"><b>output</b>{acao.afeta.output}</div>
          </div>
          <details>
            <summary>Evidência · {acao.evidencia.grau}</summary>
            <div className="det">
              <p>{acao.evidencia.fontes}</p>
              <p><b>Sinal de progresso:</b> {acao.sinal.output} — {acao.sinal.prazo}</p>
              {acao.seguranca && <p className="seg">{acao.seguranca}</p>}
            </div>
          </details>
        </>
      )}
    </article>
  );
}
