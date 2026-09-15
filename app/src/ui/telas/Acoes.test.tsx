import { beforeEach, describe, expect, test } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { Acoes } from './Acoes';
import { renderComContexto } from '@/test/render';
import { salvarPerfil } from '@/dados/repositorios/perfil';
import { apagarTudo } from '@/dados/exportImport';
import { PERFIL, PERFIL_SEM_CAFE } from '@/test/fixtures';

beforeEach(async () => {
  await apagarTudo();
});

function renderizar() {
  return renderComContexto(<Acoes />);
}

describe('Ações', () => {
  test('perfil com café mostra ultimo-cafe; medidas e hábitos aparecem; cintura e panturrilha não são cards', async () => {
    await salvarPerfil(PERFIL);
    const { container } = renderizar();
    await screen.findByRole('heading', { name: 'Ações' });
    await waitFor(() => expect(container.querySelector('[data-acao="ultimo-cafe"]')).not.toBeNull());
    expect(container.querySelector('[data-acao="meca-a-cintura"]')).toBeNull();
    expect(container.querySelector('[data-acao="panturrilha-preensao"]')).toBeNull();
    expect(container.querySelector('[data-medida="imc"]')).not.toBeNull();
    expect(screen.getByRole('heading', { name: 'Hábitos de registro' })).toBeInTheDocument();
    expect(container.querySelector('[data-habito="anote-o-sono"]')).not.toBeNull();
    expect(container.querySelector('[data-habito="pergunte-a-fome"]')).not.toBeNull();
    expect(screen.getByRole('heading', { name: 'Movimento' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Corpo e medida' })).toBeInTheDocument();
  });

  test('perfil café "nao" não mostra ultimo-cafe', async () => {
    await salvarPerfil(PERFIL_SEM_CAFE);
    const { container } = renderizar();
    await screen.findByRole('heading', { name: 'Ações' });
    await waitFor(() => expect(container.querySelector('[data-acao="seis-mil-passos"]')).not.toBeNull());
    expect(container.querySelector('[data-acao="ultimo-cafe"]')).toBeNull();
    expect(container.querySelector('[data-acao="se-beber"]')).toBeNull();
  });
});
