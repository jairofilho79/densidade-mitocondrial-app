import { sonoFomeCafe } from '@/dominio/tendencias/sonoFomeCafe';
import type { Frase } from '@/dominio/tendencias/sonoFomeCafe';
import type { Campo } from '@/dominio/campos';
import { CAMPOS } from '@/dominio/campos';
import { useContexto } from '@/ui/hooks/useContexto';
import { ConviteRegistro } from '@/ui/componentes/ConviteRegistro';
import './telas.css';

const TIPO_ROTULO: Record<Frase['tipo'], string> = {
  'sono-fome': 'sono → fome',
  'sono-comer-sem-fome': 'sono → comer sem fome',
  'cafe-sono': 'café → sono',
};

export function Tendencias() {
  const { ctx, carregando } = useContexto();
  if (carregando || !ctx) return <p className="carregando">Carregando…</p>;

  const t = sonoFomeCafe(ctx.dias, ctx.perfil);
  const semCafe = ctx.perfil.cafe === 'nao';

  return (
    <section className="tela tendencias">
      <header>
        <p className="eyebrow">só com os seus dias · sem teste estatístico</p>
        <h1>Tendências</h1>
        <p className="sub">
          {semCafe
            ? 'Você não toma café, então sua tendência é sono × fome: como as noites curtas mudam a fome e o comer sem fome do dia seguinte.'
            : 'Sono × fome × café: como as noites curtas mudam a fome do dia seguinte, e como o horário do café muda o sono.'}
        </p>
      </header>

      {t.pronta ? (
        <>
          <p className="baseline">baseline da fome (dias com sono ≥ 7 h): {t.baseline}</p>
          <ul className="frases">
            {t.frases.map((f) => (
              <li key={f.tipo}>
                <span className="eyebrow">{TIPO_ROTULO[f.tipo]}</span>
                <p>{f.texto}</p>
                <span className="n">
                  n = {f.n}
                  {f.nComparacao !== undefined && ` · comparação n = ${f.nComparacao}`}
                </span>
              </li>
            ))}
          </ul>
          <p className="sub">Comparação sempre com você mesmo, nunca com tabela. O n é o número de dias que entrou na conta.</p>
        </>
      ) : (
        <section className="painel">
          <p>Faltam {t.faltam} check-ins para a tendência aparecer.</p>
          <p className="sub">{t.oQueVaiDizer}</p>
          <ConviteRegistro
            campos={t.precisaDe.map((id) => CAMPOS.find((c) => c.id === id)).filter((c): c is Campo => c !== undefined)}
          />
        </section>
      )}
    </section>
  );
}
