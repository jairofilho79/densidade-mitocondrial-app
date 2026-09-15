import { beforeEach, describe, expect, test } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { Segunda } from './Segunda';
import { salvarPerfil } from '@/dados/repositorios/perfil';
import { registrarTreino } from '@/dados/repositorios/eventos';
import { lerSemana } from '@/dados/repositorios/semana';
import { salvarExame } from '@/dados/repositorios/exame';
import { apagarTudo } from '@/dados/exportImport';
import { hojeISO, semanaAnteriorISO, somarDias } from '@/dados/datas';
import { PERFIL } from '@/test/fixtures';

beforeEach(async () => {
  await apagarTudo();
});

function renderizar() {
  return render(<MemoryRouter><Segunda /></MemoryRouter>);
}

describe('Segunda', () => {
  test('pré-preenche sessões de tiros a partir dos eventos da semana passada (não da corrente)', async () => {
    await salvarPerfil(PERFIL);
    // mesmo dia da semana, 7 dias atrás: garantidamente dentro de semanaAnteriorISO(hoje) (fix wave, item 22).
    await registrarTreino({ data: somarDias(hojeISO(), -7), hora: '07:00', tipo: 'tiros', minutos: 8, tiros: 3 });
    const { container } = renderizar();
    await screen.findByRole('heading', { name: 'Segunda' });
    await waitFor(() => {
      const input = container.querySelector('[data-campo="semana.sessoesTiros"] input') as HTMLInputElement | null;
      expect(input).not.toBeNull();
      expect(input!.value).toBe('1');
    });
  });

  test('salvar grava a semana anterior (não a corrente)', async () => {
    await salvarPerfil(PERFIL);
    const { container } = renderizar();
    await screen.findByRole('heading', { name: 'Segunda' });
    const input = await waitFor(() => {
      const x = container.querySelector('[data-campo="semana.cintura"] input') as HTMLInputElement | null;
      expect(x).not.toBeNull();
      return x!;
    });
    fireEvent.change(input, { target: { value: '100' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar semana' }));
    await waitFor(async () => expect((await lerSemana(semanaAnteriorISO(hojeISO())))?.cintura).toBe(100));
  });

  test('sem exames, mostra o aviso com link para /exames', async () => {
    await salvarPerfil(PERFIL);
    renderizar();
    const link = await screen.findByRole('link', { name: /registrar exames/i });
    expect(link).toHaveAttribute('href', '/exames');
  });

  test('com exame recente, não mostra o aviso', async () => {
    await salvarPerfil(PERFIL);
    await salvarExame({ data: somarDias(hojeISO(), -10), glicemia: 92 });
    renderizar();
    await screen.findByRole('heading', { name: 'Segunda' });
    await waitFor(() => expect(screen.queryByRole('link', { name: /registrar exames/i })).toBeNull());
  });

  test('mostra os campos do mês quando não há mês corrente', async () => {
    await salvarPerfil(PERFIL);
    const { container } = renderizar();
    await screen.findByRole('heading', { name: 'Segunda' });
    await waitFor(() => expect(container.querySelector('[data-campo="mes.panturrilha"]')).not.toBeNull());
  });
});
