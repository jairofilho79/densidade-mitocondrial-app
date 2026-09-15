import { beforeEach, describe, expect, test } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { Exames } from './Exames';
import { salvarPerfil } from '@/dados/repositorios/perfil';
import { listarExames } from '@/dados/repositorios/exame';
import { apagarTudo } from '@/dados/exportImport';
import { PERFIL } from '@/test/fixtures';

beforeEach(async () => {
  await apagarTudo();
});

describe('Exames', () => {
  test('salvar grava e lista', async () => {
    await salvarPerfil(PERFIL);
    const { container } = render(<MemoryRouter><Exames /></MemoryRouter>);
    await screen.findByRole('heading', { name: 'Exames' });
    const input = await waitFor(() => {
      const x = container.querySelector('[data-campo="exame.glicemia"] input') as HTMLInputElement | null;
      expect(x).not.toBeNull();
      return x!;
    });
    fireEvent.change(screen.getByLabelText('Data do exame'), { target: { value: '2026-09-01' } });
    fireEvent.change(input, { target: { value: '95' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar exame' }));
    await waitFor(async () => {
      const lista = await listarExames();
      expect(lista).toHaveLength(1);
      expect(lista[0].glicemia).toBe(95);
      expect(lista[0].data).toBe('2026-09-01');
    });
    expect(await screen.findByText('01/09/2026')).toBeInTheDocument();
  });

  // fix wave, item 8: exames que a pessoa disse que costuma ter (perfil.examesQueTem)
  // aparecem primeiro; os demais ganham uma pista de que não estão na lista dela.
  test('examesQueTem: o campo da lista aparece primeiro', async () => {
    await salvarPerfil({ ...PERFIL, examesQueTem: ['hba1c'] });
    const { container } = render(<MemoryRouter><Exames /></MemoryRouter>);
    await screen.findByRole('heading', { name: 'Exames' });
    const primeiro = await waitFor(() => {
      const el = container.querySelector('.grid [data-campo]');
      expect(el).not.toBeNull();
      return el!;
    });
    expect(primeiro).toHaveAttribute('data-campo', 'exame.hba1c');
    const outro = container.querySelector('[data-campo="exame.glicemia"]');
    expect(outro?.textContent).toMatch(/não está na sua lista/);
  });
});
