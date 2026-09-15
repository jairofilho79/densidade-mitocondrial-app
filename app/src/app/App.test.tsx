import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from './App';
import { salvarPerfil } from '@/dados/repositorios/perfil';
import { apagarTudo } from '@/dados/exportImport';
import * as disponibilidade from '@/dados/disponibilidade';
import { PERFIL } from '@/test/fixtures';

beforeEach(async () => {
  await apagarTudo();
  window.location.hash = '';
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('App', () => {
  test('sem perfil, abre na tela de perfil', async () => {
    render(<App />);
    expect(await screen.findByRole('heading', { name: 'Seu perfil' })).toBeInTheDocument();
    expect(window.location.hash).toBe('#/perfil');
  });

  test('com perfil, abre em Hoje e tem a nav com 5 itens', async () => {
    await salvarPerfil(PERFIL);
    render(<App />);
    expect(await screen.findByRole('heading', { name: 'Hoje' })).toBeInTheDocument();
    const nav = screen.getByRole('navigation', { name: 'Principal' });
    const links = nav.querySelectorAll('a');
    expect(links).toHaveLength(5);
    expect(Array.from(links).map((a) => a.textContent)).toEqual(['Hoje', 'Ações', 'Segunda', 'Tendências', 'Ajustes']);
  });

  test('IndexedDB indisponível: mensagem única, sem nav nem rotas', async () => {
    vi.spyOn(disponibilidade, 'indexedDbDisponivel').mockResolvedValue(false);
    render(<App />);
    expect(await screen.findByRole('alert')).toHaveTextContent(/não permite guardar dados/);
    expect(screen.queryByRole('navigation')).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Hoje' })).toBeNull();
  });
});
