import { useState } from 'react';
import { Link } from 'react-router';
import { exportar, importar, apagarTudo } from '@/dados/exportImport';
import fronteira from '@/ui/fronteira.json';
import './telas.css';

interface ItemFronteira { titulo: string; resumo: string; }
const FRONTEIRA: ItemFronteira[] = fronteira;

export function Ajustes() {
  const [json, setJson] = useState('');
  const [copiado, setCopiado] = useState(false);
  const [entrada, setEntrada] = useState('');
  const [resultado, setResultado] = useState<{ ok: true; texto: string } | { ok: false; motivo: string } | null>(null);
  const [entendi, setEntendi] = useState(false);
  const [apagado, setApagado] = useState(false);
  const [erroExportar, setErroExportar] = useState<string | null>(null);

  async function gerar() {
    try {
      const x = await exportar();
      setJson(JSON.stringify(x, null, 2));
      setCopiado(false);
      setErroExportar(null);
    } catch {
      setErroExportar('Não foi possível ler os dados neste navegador.');
    }
  }

  async function copiar() {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(json);
      setCopiado(true);
    }
  }

  function baixar() {
    if (typeof URL.createObjectURL !== 'function') return;
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fornalha-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function importarJson() {
    let obj: unknown;
    try {
      obj = JSON.parse(entrada);
    } catch {
      setResultado({ ok: false, motivo: 'JSON malformado: não consegui ler o texto colado.' });
      return;
    }
    try {
      const r = await importar(obj);
      if (r.ok) {
        const partes = Object.entries(r.contagem).map(([tabela, n]) => `${tabela}: ${n}`);
        setResultado({ ok: true, texto: `Importado. ${partes.join(' · ')}` });
        setEntrada('');
      } else {
        setResultado({ ok: false, motivo: r.motivo });
      }
    } catch {
      setResultado({ ok: false, motivo: 'Não foi possível gravar os dados neste navegador.' });
    }
  }

  async function apagar() {
    if (!entendi) return;
    await apagarTudo();
    setEntendi(false);
    setApagado(true);
  }

  return (
    <section className="tela ajustes">
      <header>
        <h1>Ajustes</h1>
        <p className="sub">Seus dados ficam só neste aparelho. Exportar é o único jeito de levá-los a outro lugar — ou de mostrar a quem te acompanha.</p>
      </header>

      <section className="painel">
        <div className="ph"><span className="k">Exportar</span></div>
        <div className="botoes">
          <button type="button" className="botao primario" onClick={gerar}>Gerar JSON</button>
          {json && <button type="button" className="botao" onClick={copiar}>{copiado ? 'Copiado' : 'Copiar'}</button>}
          {json && typeof URL.createObjectURL === 'function' && <button type="button" className="botao" onClick={baixar}>Baixar arquivo</button>}
        </div>
        {json && (
          <div className="field">
            <label htmlFor="aj-export">JSON exportado</label>
            <textarea id="aj-export" readOnly value={json} onFocus={(e) => e.currentTarget.select()} />
          </div>
        )}
        {erroExportar && <p className="erro" role="alert">{erroExportar}</p>}
      </section>

      <section className="painel">
        <div className="ph"><span className="k">Importar</span><span className="sub">Junta com o que já existe: o registro mais recente vence.</span></div>
        <div className="field">
          <label htmlFor="aj-import">Cole aqui o JSON exportado</label>
          <textarea id="aj-import" value={entrada} onChange={(e) => setEntrada(e.target.value)} />
        </div>
        <div className="botoes">
          <button type="button" className="botao primario" onClick={importarJson} disabled={entrada.trim() === ''}>Importar</button>
        </div>
        {resultado && (resultado.ok
          ? <p className="sucesso" role="status">{resultado.texto}</p>
          : <p className="erro" role="alert">{resultado.motivo}</p>)}
      </section>

      <section className="painel">
        <div className="ph"><span className="k">Apagar tudo</span></div>
        <label className="opcoes">
          <input type="checkbox" checked={entendi} onChange={(e) => setEntendi(e.target.checked)} />
          Entendi que isso apaga tudo neste aparelho e não tem volta.
        </label>
        <div className="botoes">
          <button type="button" className="botao perigo" disabled={!entendi} onClick={apagar}>Apagar tudo</button>
        </div>
        {apagado && <p className="sucesso" role="status">Tudo apagado. <Link to="/perfil">Começar de novo</Link>.</p>}
      </section>

      <section className="secao">
        <h2>Fronteira</h2>
        <p className="sub">O que a ciência ainda está discutindo. O app não afirma nada disto — mostra como curiosidade, com a fonte, para você saber o que ficou de fora e por quê.</p>
        <ul className="fronteira">
          {FRONTEIRA.map((f) => (
            <li key={f.titulo}>
              <span className="t">{f.titulo}</span>
              <p>{f.resumo}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="secao">
        <h2>Sobre</h2>
        <p className="sub">Este diário não prescreve: reúne evidência consolidada e mostra causa → efeito; a decisão é sua e de quem te acompanha.</p>
        <p className="sub">Compara você com você mesmo — nunca com tabela quando o dado é do seu corpo.</p>
        <p className="sub">Só vira afirmação o que passou na triagem Núcleo; o resto está na Fronteira acima. <Link to="/perfil">Editar perfil</Link>.</p>
      </section>
    </section>
  );
}
