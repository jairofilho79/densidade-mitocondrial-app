import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { ContextoProvider } from '@/ui/hooks/useContexto';

/**
 * Envolve `ui` em MemoryRouter + ContextoProvider — usar para renderizar uma
 * tela isoladamente nos testes (qualquer tela que use `useContexto()` precisa
 * do provider; fora dele o hook lança).
 */
export function renderComContexto(ui: ReactElement) {
  return render(
    <MemoryRouter>
      <ContextoProvider>{ui}</ContextoProvider>
    </MemoryRouter>,
  );
}
