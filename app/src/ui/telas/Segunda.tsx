import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import type { Campo } from '@/dominio/campos';
import { camposDe } from '@/dominio/campos';
import type { Semana, Mes } from '@/dominio/tipos';
import { lerSemana, salvarSemana, preencherSemana } from '@/dados/repositorios/semana';
import { lerMes, salvarMes } from '@/dados/repositorios/mes';
import { ultimoExame } from '@/dados/repositorios/exame';
import { hojeISO, semanaAnteriorISO, segundaDaSemana, somarDias, mesISO } from '@/dados/datas';
import { useContexto } from '@/ui/hooks/useContexto';
import { CampoRegistro } from '@/ui/componentes/CampoRegistro';
import { chaveDe, primeiraSegundaDoMes, diasEntre, formatarData } from '@/ui/formato';
import './telas.css';

type Valores = Record<string, unknown>;
type ParcialSemana = Partial<Omit<Semana, 'semana' | 'atualizadoEm'>>;
type ParcialMes = Partial<Omit<Mes, 'mes' | 'atualizadoEm'>>;

const DIAS_ENTRE_EXAMES = 84; // 12 semanas

function semIndefinidos(v: Valores): Valores {
  const out: Valores = {};
  for (const [k, x] of Object.entries(v)) if (x !== undefined) out[k] = x;
  return out;
}

function valoresDe(obj: object | null | undefined, campos: Campo[]): Valores {
  const out: Valores = {};
  if (!obj) return out;
  const r = obj as Record<string, unknown>;
  for (const c of campos) out[chaveDe(c)] = r[chaveDe(c)];
  return out;
}

export function Segunda() {
  const { ctx, carregando } = useContexto();
  const hoje = hojeISO();
  const sem = semanaAnteriorISO(hoje); // a revisão é sempre da semana anterior (fix wave, item 22)
  const inicioSem = segundaDaSemana(sem);
  const fimSem = somarDias(inicioSem, 6);
  const mes = mesISO(hoje);

  // null = carregou e não existe; undefined = ainda carregando
  const semanaSalva = useLiveQuery(() => lerSemana(sem).then((s) => s ?? null), [sem]);
  const mesSalvo = useLiveQuery(() => lerMes(mes).then((m) => m ?? null), [mes]);
  const ultimo = useLiveQuery(() => ultimoExame().then((e) => e ?? null), []);

  const [form, setForm] = useState<Valores | null>(null);
  const [formMes, setFormMes] = useState<Valores | null>(null);
  const [salvo, setSalvo] = useState<string | null>(null);

  const perfil = ctx?.perfil;
  const camposSemana = perfil ? camposDe('semana', perfil) : [];
  const camposMes = perfil ? camposDe('mes', perfil) : [];

  useEffect(() => {
    if (form !== null || semanaSalva === undefined || !perfil) return;
    let ativo = true;
    (async () => {
      const base = semanaSalva ?? (await preencherSemana(sem));
      if (ativo) setForm(valoresDe(base, camposDe('semana', perfil)));
    })();
    return () => { ativo = false; };
  }, [form, semanaSalva, sem, perfil]);

  useEffect(() => {
    if (formMes !== null || mesSalvo === undefined || !perfil) return;
    setFormMes(valoresDe(mesSalvo, camposDe('mes', perfil)));
  }, [formMes, mesSalvo, perfil]);

  if (carregando || !ctx || form === null || formMes === null || ultimo === undefined) {
    return <p className="carregando">Carregando…</p>;
  }

  const mostrarMes = primeiraSegundaDoMes(hoje) || mesSalvo === null;
  const lembrarExame = ultimo === null || diasEntre(ultimo.data, hoje) >= DIAS_ENTRE_EXAMES;
  const pesoMedio = ctx.derivados.pesoMedioSemana;

  async function salvarS(e: FormEvent) {
    e.preventDefault();
    await salvarSemana(sem, semIndefinidos(form!) as ParcialSemana);
    setSalvo('Semana salva.');
  }

  async function salvarM(e: FormEvent) {
    e.preventDefault();
    await salvarMes(mes, semIndefinidos(formMes!) as ParcialMes);
    setSalvo('Mês salvo.');
  }

  return (
    <section className="tela segunda">
      <header>
        <p className="eyebrow">Semana passada ({formatarData(inicioSem)}–{formatarData(fimSem)})</p>
        <h1>Segunda</h1>
        <p className="sub">Pré-preenchido com o que você registrou na semana passada. Confirme ou corrija.</p>
      </header>

      {lembrarExame && (
        <p className="aviso">
          {ultimo === null
            ? 'Você ainda não registrou exames. '
            : `Seu último exame foi em ${formatarData(ultimo.data)}, há ${diasEntre(ultimo.data, hoje)} dias. `}
          A cada 12 semanas vale repetir: <Link to="/exames">registrar exames</Link>.
        </p>
      )}

      <form className="painel" onSubmit={salvarS}>
        <div className="ph"><span className="k">Esta semana</span></div>
        <div className="grid">
          {camposSemana.map((c) => (
            <CampoRegistro key={c.id} campo={c} valor={form[chaveDe(c)]} onChange={(v) => setForm({ ...form, [chaveDe(c)]: v })} />
          ))}
        </div>
        <p className="leitura">
          {/* derivados.pesoMedioSemana continua sendo a média desta semana (hoje), não da revisão — rótulo explícito para não confundir com a semana passada acima */}
          média desta semana: <b>{pesoMedio === null ? '—' : `${pesoMedio} kg`}</b>
          {ctx.derivados.pesoMedioSemanaAnterior !== null && <> · semana anterior: <b>{ctx.derivados.pesoMedioSemanaAnterior} kg</b></>}
        </p>
        <div className="botoes">
          <button type="submit" className="botao primario">Salvar semana</button>
        </div>
      </form>

      {mostrarMes && (
        <form className="painel" onSubmit={salvarM}>
          <div className="ph"><span className="k">Primeira segunda do mês · {mes}</span><span className="sub">Panturrilha com a fita; preensão se tiver dinamômetro, senão repetições até falhar.</span></div>
          <div className="grid">
            {camposMes.map((c) => (
              <CampoRegistro key={c.id} campo={c} valor={formMes[chaveDe(c)]} onChange={(v) => setFormMes({ ...formMes, [chaveDe(c)]: v })} />
            ))}
          </div>
          <div className="botoes">
            <button type="submit" className="botao primario">Salvar mês</button>
          </div>
        </form>
      )}

      {salvo && <p className="sucesso" role="status">{salvo}</p>}
    </section>
  );
}
