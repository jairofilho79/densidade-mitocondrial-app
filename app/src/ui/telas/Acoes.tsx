import { metasAplicaveis } from '@/dominio/metas';
import { medidas } from '@/dominio/medidas';
import { acaoDoCatalogo } from '@/dominio/catalogo';
import type { AcaoId, Grupo, AcaoCatalogo } from '@/dominio/catalogo/tipos';
import { useContexto } from '@/ui/hooks/useContexto';
import { CardAcao } from '@/ui/componentes/CardAcao';
import { CartaoMedida } from '@/ui/componentes/CartaoMedida';
import './telas.css';

const GRUPOS: Grupo[] = ['Movimento', 'Sono e ritmo', 'Alimentação', 'Corpo e medida'];
const MEDIDAS_NAO_CARD: AcaoId[] = ['meca-a-cintura', 'panturrilha-preensao'];
const HABITOS: AcaoId[] = ['anote-o-sono', 'pergunte-a-fome'];

function Habito({ acao }: { acao: AcaoCatalogo }) {
  return (
    <div className="hab" data-habito={acao.id}>
      <div className="t">{acao.titulo}</div>
      <div><b>gatilho</b> · {acao.gatilho}</div>
      <div><b>2 minutos</b> · {acao.acao_minima}</div>
      <p>{acao.descricao}</p>
      <div><b>registra</b> · {acao.registro.filter((r) => r !== '—').join(' → ')}</div>
    </div>
  );
}

export function Acoes() {
  const { ctx, carregando } = useContexto();
  if (carregando || !ctx) return <p className="carregando">Carregando…</p>;

  const todas = metasAplicaveis(ctx).filter((x) => !MEDIDAS_NAO_CARD.includes(x.acao.id) && !HABITOS.includes(x.acao.id));
  const porGrupo = GRUPOS.map((g) => ({ grupo: g, itens: todas.filter((x) => x.acao.grupo === g) })).filter((g) => g.itens.length > 0);
  const listaMedidas = medidas(ctx);

  return (
    <section className="tela acoes">
      <header>
        <p className="eyebrow">catálogo · com os seus números</p>
        <h1>Ações</h1>
        <p className="sub">Cada ação tem um gatilho, uma versão de dois minutos e uma meta pessoal — pouco, meta, demais — com o próximo passo a partir de onde você está.</p>
      </header>

      <section className="secao">
        <div className="grupo-h"><h2>Medidas</h2><span className="n">{listaMedidas.length}</span></div>
        <p className="sub">Instrumentos, não ações: o que você mede para saber se as ações estão funcionando. Sempre contra o seu próprio baseline.</p>
        <div className="medidas">
          {listaMedidas.map((m) => <CartaoMedida key={m.id} m={m} />)}
        </div>
      </section>

      {porGrupo.map((g) => (
        <section className="secao" key={g.grupo}>
          <div className="grupo-h"><h2>{g.grupo}</h2><span className="n">{g.itens.length} ações</span></div>
          <div className="cards">
            {g.itens.map((x) => <CardAcao key={x.acao.id} acao={x.acao} meta={x.meta} />)}
          </div>
        </section>
      ))}

      <section className="secao">
        <div className="grupo-h"><h2>Hábitos de registro</h2></div>
        <p className="sub">Sem número e sem meta — são o que faz os outros números existirem.</p>
        <div className="habitos">
          {HABITOS.map((id) => <Habito key={id} acao={acaoDoCatalogo(id)} />)}
        </div>
      </section>
    </section>
  );
}
