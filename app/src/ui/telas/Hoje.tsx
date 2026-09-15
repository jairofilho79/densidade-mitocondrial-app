import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import type { Campo } from '@/dominio/campos';
import { CAMPOS_SOBRE_ONTEM, camposDe } from '@/dominio/campos';
import { METAS, acoesEmFoco, metasAplicaveis } from '@/dominio/metas';
import type { Dia, EventoTreino, EventoRefeicao } from '@/dominio/tipos';
import type { AcaoId } from '@/dominio/catalogo/tipos';
import { salvarDia } from '@/dados/repositorios/dia';
import { registrarTreino, registrarRefeicao, refeicoesEntre } from '@/dados/repositorios/eventos';
import { hojeISO, ontem } from '@/dados/datas';
import { useContexto } from '@/ui/hooks/useContexto';
import { useDia } from '@/ui/hooks/useDia';
import { CampoRegistro } from '@/ui/componentes/CampoRegistro';
import { ConviteRegistro } from '@/ui/componentes/ConviteRegistro';
import { CardAcao } from '@/ui/componentes/CardAcao';
import { chaveDe, horaAgora, formatarData } from '@/ui/formato';
import './telas.css';

type ParcialDia = Partial<Omit<Dia, 'data' | 'atualizadoEm'>>;

/** Ações que não viram card (são medidas ou hábitos de registro). */
const SEM_CARD: AcaoId[] = ['meca-a-cintura', 'panturrilha-preensao', 'anote-o-sono', 'pergunte-a-fome'];

function numeroOuNada(t: string): number | undefined {
  if (t.trim() === '') return undefined;
  const n = parseFloat(t.replace(',', '.'));
  return Number.isNaN(n) ? undefined : n;
}

interface FormTreinoProps { data: string; aoFechar: () => void; }

function FormTreino({ data, aoFechar }: FormTreinoProps) {
  const [tipo, setTipo] = useState<EventoTreino['tipo']>('tiros');
  const [minutos, setMinutos] = useState('');
  const [tiros, setTiros] = useState('');
  const [tiroTravou, setTiroTravou] = useState('');
  const [rpe, setRpe] = useState('');
  const [fc1min, setFc1min] = useState('');
  const [calor, setCalor] = useState(false);
  const [jejum, setJejum] = useState(false);
  const min = numeroOuNada(minutos);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (min === undefined || min <= 0) return;
    const base: Omit<EventoTreino, 'id' | 'atualizadoEm'> = { data, hora: horaAgora(), tipo, minutos: min };
    if (tipo === 'tiros') {
      const t = numeroOuNada(tiros); if (t !== undefined) base.tiros = t;
      const tt = numeroOuNada(tiroTravou); if (tt !== undefined) base.tiroTravou = tt;
      const r = numeroOuNada(rpe); if (r !== undefined) base.rpe = r;
      const fc = numeroOuNada(fc1min); if (fc !== undefined) base.fc1min = fc;
      base.calor = calor;
      base.jejum = jejum;
    }
    await registrarTreino(base);
    aoFechar();
  }

  return (
    <form className="painel mini-form" onSubmit={enviar}>
      <div className="ph"><span className="k">Treinei</span></div>
      <div className="grid">
        <div className="field">
          <label htmlFor="t-tipo">Tipo</label>
          <select id="t-tipo" value={tipo} onChange={(e) => setTipo(e.target.value as EventoTreino['tipo'])}>
            <option value="tiros">Tiros</option>
            <option value="forca">Força</option>
            <option value="moderado">Moderado (caminhada, bike leve)</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="t-min">Minutos</label>
          <input id="t-min" type="number" inputMode="numeric" min="1" max="600" value={minutos} onChange={(e) => setMinutos(e.target.value)} />
        </div>
        {tipo === 'tiros' && (
          <>
            <div className="field">
              <label htmlFor="t-tiros">Quantos tiros</label>
              <input id="t-tiros" type="number" inputMode="numeric" min="1" max="30" value={tiros} onChange={(e) => setTiros(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="t-travou">Travou em qual tiro (se travou)</label>
              <input id="t-travou" type="number" inputMode="numeric" min="1" max="30" value={tiroTravou} onChange={(e) => setTiroTravou(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="t-rpe">Esforço da sessão (RPE 0–10)</label>
              <input id="t-rpe" type="number" inputMode="numeric" min="0" max="10" value={rpe} onChange={(e) => setRpe(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="t-fc">FC 1 min depois do último tiro (bpm)</label>
              <input id="t-fc" type="number" inputMode="numeric" min="30" max="250" value={fc1min} onChange={(e) => setFc1min(e.target.value)} />
            </div>
            <div className="opcoes">
              <label><input type="checkbox" checked={calor} onChange={(e) => setCalor(e.target.checked)} />Estava calor</label>
              <label><input type="checkbox" checked={jejum} onChange={(e) => setJejum(e.target.checked)} />Em jejum</label>
            </div>
          </>
        )}
      </div>
      <div className="botoes">
        <button type="submit" className="botao primario" disabled={min === undefined || min <= 0}>Registrar treino</button>
        <button type="button" className="botao" onClick={aoFechar}>Cancelar</button>
      </div>
    </form>
  );
}

interface FormRefeicaoProps { data: string; aoFechar: () => void; }

function FormRefeicao({ data, aoFechar }: FormRefeicaoProps) {
  const [hora, setHora] = useState(horaAgora());
  const [proteinaG, setProteinaG] = useState('');
  const [fibraG, setFibraG] = useState('');
  const [cozinhada, setCozinhada] = useState(false);
  const [comecouPelaFibra, setComecouPelaFibra] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (hora === '') return;
    const r: Omit<EventoRefeicao, 'id' | 'atualizadoEm'> = { data, hora, cozinhada, comecouPelaFibra };
    const p = numeroOuNada(proteinaG); if (p !== undefined) r.proteinaG = p;
    const f = numeroOuNada(fibraG); if (f !== undefined) r.fibraG = f;
    await registrarRefeicao(r);

    // proteinaG/fibraG do dia = soma das refeições do dia (spec §3)
    const refeicoes = await refeicoesEntre(data, data);
    const parcial: ParcialDia = {};
    if (refeicoes.some((x) => x.proteinaG !== undefined)) parcial.proteinaG = refeicoes.reduce((s, x) => s + (x.proteinaG ?? 0), 0);
    if (refeicoes.some((x) => x.fibraG !== undefined)) parcial.fibraG = refeicoes.reduce((s, x) => s + (x.fibraG ?? 0), 0);
    if (Object.keys(parcial).length > 0) await salvarDia(data, parcial);
    aoFechar();
  }

  return (
    <form className="painel mini-form" onSubmit={enviar}>
      <div className="ph"><span className="k">Comi</span><span className="sub">Só o que souber. Gramas pelo rótulo ou app de dieta.</span></div>
      <div className="grid">
        <div className="field">
          <label htmlFor="r-hora">Hora</label>
          <input id="r-hora" type="time" value={hora} onChange={(e) => setHora(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="r-prot">Proteína (g)</label>
          <input id="r-prot" type="number" inputMode="decimal" min="0" max="300" value={proteinaG} onChange={(e) => setProteinaG(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="r-fibra">Fibra (g)</label>
          <input id="r-fibra" type="number" inputMode="decimal" min="0" max="100" value={fibraG} onChange={(e) => setFibraG(e.target.value)} />
        </div>
        <div className="opcoes">
          <label><input type="checkbox" checked={cozinhada} onChange={(e) => setCozinhada(e.target.checked)} />Feita de ingredientes</label>
          <label><input type="checkbox" checked={comecouPelaFibra} onChange={(e) => setComecouPelaFibra(e.target.checked)} />Comecei pela fibra</label>
        </div>
      </div>
      <div className="botoes">
        <button type="submit" className="botao primario">Registrar refeição</button>
        <button type="button" className="botao" onClick={aoFechar}>Cancelar</button>
      </div>
    </form>
  );
}

export function Hoje() {
  const { ctx, carregando } = useContexto();
  const hoje = hojeISO();
  const dia = useDia(hoje);
  const diaOntem = useDia(ontem(hoje));
  const [mais, setMais] = useState(false);
  const [formAberto, setFormAberto] = useState<'treino' | 'refeicao' | null>(null);

  if (carregando || !ctx) return <p className="carregando">Carregando…</p>;

  const perfil = ctx.perfil;
  const treinouOntem = ctx.eventos.some((e) => e.data === ontem(hoje));
  // Única condição por id na UI: depende de eventos, e Campo.condicao só vê o perfil.
  const nivel1 = camposDe('dia', perfil, 1).filter((c) => !(c.id === 'dia.moveu' && treinouOntem));
  const nivel2 = camposDe('dia', perfil, 2).filter((c) => c.nivel === 2);

  const parado = METAS['nunca-dois-dias'].meta(ctx);
  const foco = acoesEmFoco(ctx, 3);
  const faltam = 3 - foco.length;
  const semDado = faltam > 0
    ? metasAplicaveis(ctx)
        .filter((x) => x.meta.zona === 'sem-dado' && !SEM_CARD.includes(x.acao.id))
        .filter((x) => !foco.some((f) => f.acao.id === x.acao.id))
        .slice(0, faltam)
    : [];
  const emFoco = [...foco, ...semDado];

  // Convenção de dia-calendário (contratos): os 12 campos de CAMPOS_SOBRE_ONTEM
  // falam do dia anterior e vivem em dia[ontem]; os demais vivem em dia[hoje].
  function registroDe(c: Campo): Dia | undefined {
    return CAMPOS_SOBRE_ONTEM.includes(c.id) ? diaOntem : dia;
  }

  function valorDe(c: Campo): unknown {
    const registro = registroDe(c);
    return registro ? (registro as unknown as Record<string, unknown>)[chaveDe(c)] : undefined;
  }

  function gravar(c: Campo, v: unknown) {
    const data = CAMPOS_SOBRE_ONTEM.includes(c.id) ? ontem(hoje) : hoje;
    void salvarDia(data, { [chaveDe(c)]: v } as ParcialDia);
  }

  async function levantei() {
    await salvarDia(hoje, { levantadas: (dia?.levantadas ?? 0) + 1 });
  }

  return (
    <section className="tela hoje">
      <header>
        <p className="eyebrow">{formatarData(hoje)}</p>
        <h1>Hoje</h1>
      </header>

      <section className="painel">
        <div className="ph">
          <h2>Check-in da manhã</h2>
          <span className="sub">Cada campo diz de que dia fala.</span>
        </div>
        <div className="grid">
          {nivel1.map((c) => (
            <CampoRegistro
              key={c.id}
              campo={c}
              valor={valorDe(c)}
              onChange={(v) => gravar(c, v)}
              sufixo={CAMPOS_SOBRE_ONTEM.includes(c.id) ? '· ontem' : '· hoje'}
            />
          ))}
        </div>
        {mais ? (
          <>
            <ConviteRegistro campos={nivel2} />
            <div className="grid">
              {nivel2.map((c) => (
                <CampoRegistro
                  key={c.id}
                  campo={c}
                  valor={valorDe(c)}
                  onChange={(v) => gravar(c, v)}
                  sufixo={CAMPOS_SOBRE_ONTEM.includes(c.id) ? '· ontem' : '· hoje'}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="botoes">
            <button type="button" className="botao" onClick={() => setMais(true)}>Quero registrar mais</button>
          </div>
        )}
      </section>

      <section className="secao">
        <h2>Aconteceu agora</h2>
        <div className="eventos">
          <button type="button" className="botao" aria-pressed={formAberto === 'treino'} onClick={() => setFormAberto(formAberto === 'treino' ? null : 'treino')}>Treinei</button>
          <button type="button" className="botao" aria-pressed={formAberto === 'refeicao'} onClick={() => setFormAberto(formAberto === 'refeicao' ? null : 'refeicao')}>Comi</button>
          <button type="button" className="botao" onClick={levantei}>Levantei</button>
        </div>
        <p className="levantadas">levantei {dia?.levantadas ?? 0} vez(es) hoje</p>
        {formAberto === 'treino' && <FormTreino data={hoje} aoFechar={() => setFormAberto(null)} />}
        {formAberto === 'refeicao' && <FormRefeicao data={hoje} aoFechar={() => setFormAberto(null)} />}
      </section>

      <section className="painel">
        <h2>Dias parado</h2>
        <div className={`parado zona-${parado.zona}`}>
          <div className="n">{ctx.derivados.diasParado}<small>dia(s) seguido(s)</small></div>
          <div>
            <p>{parado.texto}</p>
            <p className="sub">{parado.proximoPasso}</p>
          </div>
        </div>
      </section>

      <section className="secao">
        <div className="grupo-h">
          <h2>Em foco</h2>
          <Link to="/acoes" className="n">ver todas</Link>
        </div>
        <div className="cards">
          {emFoco.map((x) => <CardAcao key={x.acao.id} acao={x.acao} meta={x.meta} compacto />)}
        </div>
      </section>
    </section>
  );
}
