import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

  // CRITICAL (fix wave, item 1): salvar o perfil pela primeira vez levava de volta
  // para /perfil, porque a Guarda ainda via `semPerfil` no instante do navigate('/').
  test('sem perfil: preencher e salvar leva a Hoje', async () => {
    render(<App />);
    expect(await screen.findByRole('heading', { name: 'Seu perfil' })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Peso (kg)'), { target: { value: '90' } });
    fireEvent.change(screen.getByLabelText('Altura (cm)'), { target: { value: '175' } });
    fireEvent.change(screen.getByLabelText('Idade (anos)'), { target: { value: '40' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar perfil' }));

    expect(await screen.findByRole('heading', { name: 'Hoje' })).toBeInTheDocument();
    expect(window.location.hash).toBe('#/');
  });

  test('com perfil: editar e salvar de novo volta para Hoje', async () => {
    await salvarPerfil(PERFIL);
    render(<App />);
    expect(await screen.findByRole('heading', { name: 'Hoje' })).toBeInTheDocument();

    window.location.hash = '#/perfil';
    expect(await screen.findByRole('heading', { name: 'Seu perfil' })).toBeInTheDocument();
    // Espera o formulário carregar o perfil salvo (peso 90) antes de editar — mudar
    // antes disso seria sobrescrito quando o efeito de pré-preenchimento rodar.
    await waitFor(() => expect(screen.getByLabelText('Peso (kg)')).toHaveValue(90));
    fireEvent.change(screen.getByLabelText('Peso (kg)'), { target: { value: '91' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar perfil' }));

    expect(await screen.findByRole('heading', { name: 'Hoje' })).toBeInTheDocument();
  });
});
