import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import type { Perfil as PerfilTipo, Sexo, Hora } from '@/dominio/tipos';
import type { Contexto } from '@/dominio/metas/tipos';
import { camposDe } from '@/dominio/campos';
import { derivar } from '@/dominio/derivados';
import { medidas, type MedidaResultado } from '@/dominio/medidas';
import { salvarPerfil } from '@/dados/repositorios/perfil';
import { hojeISO } from '@/dados/datas';
import { usePerfil } from '@/ui/hooks/usePerfil';
import { useContexto } from '@/ui/hooks/useContexto';
import { CartaoMedida } from '@/ui/componentes/CartaoMedida';
import { chaveDe } from '@/ui/formato';
import './telas.css';

type PerfilSemData = Omit<PerfilTipo, 'atualizadoEm'>;

interface Form {
  peso: string;
  altura: string;
  idade: string;
  sexo: Sexo;
  levantar: Hora;
  deitar: Hora;
  cafe: PerfilTipo['cafe'];
  alcool: PerfilTipo['alcool'];
  remedios: PerfilTipo['remedios'];
  fuma: PerfilTipo['fuma'];
  parouEm: string;
  examesQueTem: string[];
}

const FORM_VAZIO: Form = {
  peso: '', altura: '', idade: '', sexo: 'H', levantar: '06:30', deitar: '23:00',
  cafe: 'diario', alcool: 'nao', remedios: [], fuma: 'nao', parouEm: '', examesQueTem: [],
};

const REMEDIOS: Array<{ id: PerfilTipo['remedios'][number]; rotulo: string }> = [
  { id: 'glicemia', rotulo: 'Glicemia ou diabetes' },
  { id: 'pressao', rotulo: 'Pressão' },
  { id: 'tireoide', rotulo: 'Tireoide' },
  { id: 'outro', rotulo: 'Outro de uso contínuo' },
];

function deFormato(p: PerfilTipo): Form {
  return {
    peso: String(p.peso), altura: String(p.altura), idade: String(p.idade), sexo: p.sexo,
    levantar: p.levantar, deitar: p.deitar, cafe: p.cafe, alcool: p.alcool, remedios: p.remedios,
    fuma: p.fuma, parouEm: p.parouEm ?? '', examesQueTem: p.examesQueTem,
  };
}

/** null quando peso/altura/idade ainda não são números válidos. */
function paraPerfil(f: Form): PerfilSemData | null {
  const peso = parseFloat(f.peso.replace(',', '.'));
  const altura = parseFloat(f.altura.replace(',', '.'));
  const idade = parseInt(f.idade, 10);
  if (!(peso > 0) || !(altura > 0) || !(idade > 0)) return null;
  if (f.levantar === '' || f.deitar === '') return null;
  return {
    peso, altura, idade, sexo: f.sexo, levantar: f.levantar, deitar: f.deitar,
    cafe: f.cafe, alcool: f.alcool, remedios: f.remedios, fuma: f.fuma,
    ...(f.fuma === 'parou' && f.parouEm !== '' ? { parouEm: f.parouEm } : {}),
    examesQueTem: f.examesQueTem,
  };
}

const PERFIL_BASE: PerfilTipo = {
  peso: 0, altura: 0, idade: 0, sexo: 'H', levantar: '06:30', deitar: '23:00', cafe: 'nao',
  alcool: 'nao', remedios: [], fuma: 'nao', examesQueTem: [], atualizadoEm: '',
};

function alternar<T>(lista: T[], item: T): T[] {
  return lista.includes(item) ? lista.filter((x) => x !== item) : [...lista, item];
}

export function Perfil() {
  const salvo = usePerfil();
  const { carregando, semPerfil } = useContexto();
  const navigate = useNavigate();
  const [form, setForm] = useState<Form>(FORM_VAZIO);
  const [carregado, setCarregado] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [pediuSalvar, setPediuSalvar] = useState(false);

  useEffect(() => {
    if (salvo && !carregado) {
      setForm(deFormato(salvo));
      setCarregado(true);
    }
  }, [salvo, carregado]);

  // A Guarda em App.tsx e esta tela agora leem o MESMO useContexto() (fix wave
  // round 2, item 1): usePerfil() é uma useLiveQuery independente, e com
  // latência assíncrona do IndexedDB ela podia resolver antes da consulta que
  // a Guarda usa, navegando cedo demais — a Guarda ainda via semPerfil e
  // devolvia para /perfil. Esperar !semPerfil && !carregando do contexto
  // compartilhado garante que a Guarda já deixou de redirecionar no mesmo
  // render em que Perfil decide navegar.
  useEffect(() => {
    if (pediuSalvar && !carregando && !semPerfil) navigate('/');
  }, [pediuSalvar, carregando, semPerfil, navigate]);

  const parcial = paraPerfil(form);
  const perfilTmp: PerfilTipo = parcial ? { ...parcial, atualizadoEm: '' } : PERFIL_BASE;
  const hoje = hojeISO();
  const ctx: Contexto | null = parcial
    ? {
        perfil: perfilTmp, hoje: undefined, dias: [], eventos: [], refeicoes: [], semana: undefined, mes: undefined,
        derivados: derivar(perfilTmp, [], [], undefined, hoje), agora: new Date(),
      }
    : null;
  // Só as medidas que dependem exclusivamente do perfil (as demais precisam de
  // dados de dia/semana/mês que este formulário não tem).
  const MEDIDAS_DO_PERFIL: ReadonlyArray<MedidaResultado['id']> = ['imc', 'fc_max', 'rmr', 'agua'];
  const medidasAoVivo = ctx ? medidas(ctx).filter((m) => MEDIDAS_DO_PERFIL.includes(m.id)) : [];
  const examesOpcoes = camposDe('exame', perfilTmp).map((c) => ({ id: chaveDe(c), rotulo: c.rotulo }));

  function campo<K extends keyof Form>(k: K, v: Form[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function salvar(e: FormEvent) {
    e.preventDefault();
    if (!parcial) return;
    setSalvando(true);
    await salvarPerfil(parcial);
    setSalvando(false);
    setPediuSalvar(true);
  }

  return (
    <section className="tela perfil">
      <header>
        <p className="eyebrow">uma vez · editável depois</p>
        <h1>Seu perfil</h1>
        <p className="sub">Só o que as fórmulas precisam. Fica neste aparelho; nada sai daqui.</p>
        {!carregando && semPerfil && (
          <p className="sub">Tenho um backup? <Link to="/ajustes">Importar</Link></p>
        )}
      </header>

      <form onSubmit={salvar}>
        <fieldset>
          <legend>Corpo</legend>
          <div className="grid">
            <div className="field">
              <label htmlFor="p-peso">Peso (kg)</label>
              <input id="p-peso" type="number" inputMode="decimal" step="0.1" min="20" max="400" value={form.peso} onChange={(e) => campo('peso', e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="p-altura">Altura (cm)</label>
              <input id="p-altura" type="number" inputMode="numeric" min="100" max="250" value={form.altura} onChange={(e) => campo('altura', e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="p-idade">Idade (anos)</label>
              <input id="p-idade" type="number" inputMode="numeric" min="10" max="120" value={form.idade} onChange={(e) => campo('idade', e.target.value)} />
            </div>
          </div>
          <span className="rotulo" id="sexo-rotulo">Sexo</span>
          <div className="opcoes" role="radiogroup" aria-labelledby="sexo-rotulo">
            <label><input type="radio" name="sexo" checked={form.sexo === 'H'} onChange={() => campo('sexo', 'H')} />Homem</label>
            <label><input type="radio" name="sexo" checked={form.sexo === 'M'} onChange={() => campo('sexo', 'M')} />Mulher</label>
          </div>
        </fieldset>

        <fieldset>
          <legend>Ritmo</legend>
          <div className="grid">
            <div className="field">
              <label htmlFor="p-levantar">Hora que levanta</label>
              <input id="p-levantar" type="time" value={form.levantar} onChange={(e) => campo('levantar', e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="p-deitar">Hora que deita</label>
              <input id="p-deitar" type="time" value={form.deitar} onChange={(e) => campo('deitar', e.target.value)} />
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>Hábitos</legend>
          <div className="grid">
            <div className="field">
              <label htmlFor="p-cafe">Café ou chá com cafeína</label>
              <select id="p-cafe" value={form.cafe} onChange={(e) => campo('cafe', e.target.value as Form['cafe'])}>
                <option value="nao">Não tomo</option>
                <option value="as-vezes">Às vezes</option>
                <option value="diario">Todo dia</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="p-alcool">Álcool</label>
              <select id="p-alcool" value={form.alcool} onChange={(e) => campo('alcool', e.target.value as Form['alcool'])}>
                <option value="nao">Não bebo</option>
                <option value="as-vezes">Às vezes</option>
                <option value="regular">Regularmente</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="p-fuma">Fuma?</label>
              <select id="p-fuma" value={form.fuma} onChange={(e) => campo('fuma', e.target.value as Form['fuma'])}>
                <option value="nao">Não</option>
                <option value="sim">Sim</option>
                <option value="parou">Parei</option>
              </select>
            </div>
            {form.fuma === 'parou' && (
              <div className="field">
                <label htmlFor="p-parouEm">Parou em</label>
                <input id="p-parouEm" type="date" value={form.parouEm} onChange={(e) => campo('parouEm', e.target.value)} />
              </div>
            )}
          </div>
        </fieldset>

        <fieldset>
          <legend>Remédios de uso contínuo</legend>
          <p className="sub">Não muda nenhuma meta — só troca o próximo passo por "converse com quem te acompanha" onde faz diferença.</p>
          <div className="opcoes">
            {REMEDIOS.map((r) => (
              <label key={r.id}>
                <input type="checkbox" checked={form.remedios.includes(r.id)} onChange={() => campo('remedios', alternar(form.remedios, r.id))} />
                {r.rotulo}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>Exames que você costuma ter</legend>
          <p className="sub">Só para saber o que pedir na tela de exames.</p>
          <div className="opcoes">
            {examesOpcoes.map((ex) => (
              <label key={ex.id}>
                <input type="checkbox" checked={form.examesQueTem.includes(ex.id)} onChange={() => campo('examesQueTem', alternar(form.examesQueTem, ex.id))} />
                {ex.rotulo}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="botoes">
          <button type="submit" className="botao primario" disabled={!parcial || salvando}>Salvar perfil</button>
        </div>
        {!parcial && <p className="sub">Preencha peso, altura e idade para salvar.</p>}
      </form>

      <section className="secao">
        <h2>Medidas</h2>
        <p className="sub">Calculadas com o que você digitou acima, em tempo real.</p>
        {medidasAoVivo.length === 0
          ? <p className="sub">Preencha peso, altura e idade para ver IMC, FC máxima, gasto de repouso e meta de água.</p>
          : <div className="medidas">{medidasAoVivo.map((m) => <CartaoMedida key={m.id} m={m} />)}</div>}
      </section>
    </section>
  );
}
