import { useState, type FormEvent } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { camposDe } from '@/dominio/campos';
import type { Exame } from '@/dominio/tipos';
import { listarExames, salvarExame } from '@/dados/repositorios/exame';
import { hojeISO } from '@/dados/datas';
import { usePerfil } from '@/ui/hooks/usePerfil';
import { CampoRegistro } from '@/ui/componentes/CampoRegistro';
import { chaveDe, formatarData } from '@/ui/formato';
import './telas.css';

type Valores = Record<string, unknown>;

export function Exames() {
  const perfil = usePerfil();
  const exames = useLiveQuery(() => listarExames(), []);
  const [data, setData] = useState(hojeISO());
  const [form, setForm] = useState<Valores>({});
  const [salvo, setSalvo] = useState(false);

  if (!perfil || exames === undefined) return <p className="carregando">Carregando…</p>;

  const campos = camposDe('exame', perfil);
  const temAlgo = Object.values(form).some((v) => v !== undefined);

  async function salvar(e: FormEvent) {
    e.preventDefault();
    if (data === '' || !temAlgo) return;
    const valores: Valores = {};
    for (const [k, v] of Object.entries(form)) if (v !== undefined) valores[k] = v;
    await salvarExame({ data, ...valores } as Omit<Exame, 'atualizadoEm'>);
    setForm({});
    setSalvo(true);
  }

  return (
    <section className="tela exames">
      <header>
        <p className="eyebrow">a cada 12 semanas</p>
        <h1>Exames</h1>
        <p className="sub">Só o que tiver. O app nunca compara com tabela; compara com o seu exame anterior.</p>
      </header>

      <form className="painel" onSubmit={salvar}>
        <div className="grid">
          <div className="field">
            <label htmlFor="ex-data">Data do exame</label>
            <input id="ex-data" type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </div>
          {campos.map((c) => (
            <CampoRegistro key={c.id} campo={c} valor={form[chaveDe(c)]} onChange={(v) => setForm({ ...form, [chaveDe(c)]: v })} />
          ))}
        </div>
        <div className="botoes">
          <button type="submit" className="botao primario" disabled={data === '' || !temAlgo}>Salvar exame</button>
        </div>
        {salvo && <p className="sucesso" role="status">Exame salvo.</p>}
      </form>

      <section className="secao">
        <h2>Histórico</h2>
        {exames.length === 0 ? (
          <p className="sub">Nenhum exame registrado.</p>
        ) : (
          <div className="tabela-scroll">
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  {campos.map((c) => <th key={c.id}>{c.rotulo}{c.unidade ? ` (${c.unidade})` : ''}</th>)}
                </tr>
              </thead>
              <tbody>
                {exames.map((ex) => (
                  <tr key={ex.data}>
                    <td>{formatarData(ex.data)}</td>
                    {campos.map((c) => {
                      const v = (ex as unknown as Record<string, unknown>)[chaveDe(c)];
                      return <td key={c.id}>{v === undefined || v === null ? '—' : String(v)}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}
