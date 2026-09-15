import { describe, expect, test, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErroLimite } from './ErroLimite';

function Bomba(): never {
  throw new Error('falhou de propósito');
}

describe('ErroLimite', () => {
  test('captura o erro e mostra a mensagem única com botão Recarregar', () => {
    // O React loga o erro capturado no console; silenciar aqui evita ruído no output do teste.
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErroLimite>
        <Bomba />
      </ErroLimite>,
    );
    const alerta = screen.getByRole('alert');
    expect(alerta).toHaveTextContent(
      'Algo deu errado ao ler os dados neste navegador. Recarregue a página; se persistir, exporte seus dados em Ajustes.',
    );
    expect(screen.getByRole('button', { name: 'Recarregar' })).toBeInTheDocument();
  });

  test('sem erro, renderiza os filhos normalmente', () => {
    render(
      <ErroLimite>
        <p>tudo bem</p>
      </ErroLimite>,
    );
    expect(screen.getByText('tudo bem')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  test('Recarregar chama location.reload()', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const reload = vi.fn();
    const original = window.location;
    Object.defineProperty(window, 'location', { value: { ...original, reload }, writable: true });
    render(
      <ErroLimite>
        <Bomba />
      </ErroLimite>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Recarregar' }));
    expect(reload).toHaveBeenCalled();
    Object.defineProperty(window, 'location', { value: original, writable: true });
  });
});
