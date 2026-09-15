import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { CardAcao } from './CardAcao';
import type { ReactElement } from 'react';
import { acaoDoCatalogo } from '@/dominio/catalogo';
import type { Meta } from '@/dominio/metas/tipos';

const acao = acaoDoCatalogo('seis-mil-passos');
const meta: Meta = {
  zona: 'atencao',
  valor: 3500,
  faixa: { pouco: 2000, meta: 5000, demais: 10000 },
  posicao: 0.4,
  texto: '3500 passos/dia',
  proximoPasso: 'meta desta semana: 4500 passos/dia (+500)',
  vals: { prox_passos: 4500 },
};

function renderizar(ui: ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('CardAcao', () => {
  test('mostra título, gatilho, ação mínima, texto da meta e próximo passo', () => {
    renderizar(<CardAcao acao={acao} meta={meta} />);
    expect(screen.getByRole('heading', { name: acao.titulo })).toBeInTheDocument();
    expect(screen.getByText(acao.gatilho)).toBeInTheDocument();
    expect(screen.getByText(acao.acao_minima)).toBeInTheDocument();
    expect(screen.getByText('3500 passos/dia')).toBeInTheDocument();
    expect(screen.getByText(meta.proximoPasso)).toBeInTheDocument();
    expect(screen.getByText(acao.descricao)).toBeInTheDocument();
    expect(screen.getByText(acao.evidencia.fontes)).toBeInTheDocument();
  });

  test('faixa.ideal interpolado com meta.vals aparece sem chaves abertas (fix wave, item 19+22)', () => {
    renderizar(<CardAcao acao={acao} meta={meta} />);
    // faixa.ideal do catálogo: "5–7 mil/dia; se você está abaixo, a meta desta semana é {prox_passos} (seu baseline + 500 por semana)"
    expect(screen.getByText(/a meta desta semana é 4500/)).toBeInTheDocument();
    expect(screen.queryByText(/\{prox_passos\}/)).toBeNull();
  });

  test('seguranca substitui o próximo passo', () => {
    renderizar(<CardAcao acao={acao} meta={{ ...meta, seguranca: 'Você marcou pressão no perfil — converse com quem te acompanha antes de mudar isso.' }} />);
    expect(screen.getByText(/converse com quem te acompanha/)).toBeInTheDocument();
    expect(screen.queryByText(meta.proximoPasso)).toBeNull();
  });

  test('compacto esconde descrição, afeta e evidência', () => {
    renderizar(<CardAcao acao={acao} meta={meta} compacto />);
    expect(screen.queryByText(acao.descricao)).toBeNull();
    expect(screen.queryByText(acao.afeta.processo)).toBeNull();
    expect(screen.queryByText(acao.evidencia.fontes)).toBeNull();
  });

  test('sem-dado mostra o convite com os campos de precisaDe; esconde a linha de faixa com placeholder aberto', () => {
    renderizar(<CardAcao acao={acao} meta={{ zona: 'sem-dado', valor: null, faixa: null, posicao: null, texto: '', proximoPasso: '', precisaDe: ['dia.passos'] }} />);
    expect(screen.getByText(/^Registre .* e eu te digo onde você está em/)).toBeInTheDocument();
    // faixa.ideal do catálogo tem {prox_passos}, que depende do dado ausente — sem vals, some.
    expect(screen.queryByText(/\{prox_passos\}/)).toBeNull();
    expect(screen.queryByText(/prox_passos/)).toBeNull();
  });

  test('sem-dado com campo semanal: o convite pede treino ou a revisão de segunda', () => {
    renderizar(
      <CardAcao
        acao={acao}
        meta={{ zona: 'sem-dado', valor: null, faixa: null, posicao: null, texto: '', proximoPasso: '', precisaDe: ['semana.sessoesTiros'] }}
      />,
    );
    expect(screen.getByText('registre um treino ou a revisão de segunda.')).toBeInTheDocument();
  });

  test('deDia aparece quando o valor não é de hoje', () => {
    renderizar(<CardAcao acao={acao} meta={{ ...meta, deDia: '2026-09-12' }} />);
    expect(screen.getByText(/de 12\/09\/2026/)).toBeInTheDocument();
  });
});
