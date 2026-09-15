import type { MedidaResultado } from '@/dominio/medidas';
import { catalogo } from '@/dominio/catalogo';
import { fmt } from '@/dominio/metas/_util';
import { ROTULO_ZONA } from '@/ui/formato';
import './componentes.css';

export interface CartaoMedidaProps {
  m: MedidaResultado;
}

export function CartaoMedida({ m }: CartaoMedidaProps) {
  const cat = catalogo.medidas.find((x) => x.id === m.id);
  const status = m.zona === 'neutra' ? (m.valor === null ? 'preencha o perfil' : 'referência') : ROTULO_ZONA[m.zona];
  return (
    <div className={`med zona-${m.zona}`} data-medida={m.id}>
      <div className="t">
        <span>{cat?.titulo ?? m.id}</span>
        {cat && <span className="ev">{cat.grau}</span>}
      </div>
      <div className="big">
        {m.valor === null ? '—' : fmt(m.valor)}
        {m.unidade && <small>{m.unidade}</small>}
      </div>
      <div className={`st ${m.zona}`}>{status}</div>
      {m.texto && <p className="meta-l">{m.texto}</p>}
      {m.zonas.length > 0 && (
        <ul className="zonas-m">
          {m.zonas.map((z, i) => (
            <li key={i}><i className={z.tom} />{z.rotulo}</li>
          ))}
        </ul>
      )}
      {cat && (
        <details>
          <summary>como · para quê</summary>
          <div className="how">
            <b>como</b> {cat.como}<br />
            <b>para quê</b> {cat.para_que}<br />
            <b>muda em</b> {cat.muda}<br />
            <span className="ev">{cat.fontes}</span>
          </div>
        </details>
      )}
    </div>
  );
}
