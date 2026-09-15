import { beforeEach, describe, expect, test } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { Hoje } from './Hoje';
import { camposDe } from '@/dominio/campos';
import { salvarPerfil } from '@/dados/repositorios/perfil';
import { lerDia } from '@/dados/repositorios/dia';
import { registrarTreino } from '@/dados/repositorios/eventos';
import { apagarTudo } from '@/dados/exportImport';
import { hojeISO, ontem } from '@/dados/datas';
import { PERFIL, PERFIL_SEM_CAFE } from '@/test/fixtures';

beforeEach(async () => {
  await apagarTudo();
});

function renderizar() {
  return render(<MemoryRouter><Hoje /></MemoryRouter>);
}

async function esperarCheckin() {
  await screen.findByRole('heading', { name: 'Check-in da manhã' });
}

describe('Hoje — check-in', () => {
  // O número de campos vem do registro (plano 01), não de um literal: o spec §3
  // lista 9 campos de nível 1 com café (8 sem), e o enunciado deste plano fala
  // em 7/6. Comparar com camposDe() é o que garante que a tela é gerada do registro.
  test('renderiza todos os campos de nível 1 do perfil com café diário', async () => {
    const perfil = await salvarPerfil(PERFIL);
    const { container } = renderizar();
    await esperarCheckin();
    const esperado = camposDe('dia', perfil, 1).length;
    await waitFor(() => expect(container.querySelectorAll('[data-campo]')).toHaveLength(esperado));
    expect(container.querySelector('[data-campo="dia.ultimoCafe"]')).not.toBeNull();
  });

  test('perfil sem café tem um campo a menos e não pergunta o último café', async () => {
    const perfil = await salvarPerfil(PERFIL_SEM_CAFE);
    const { container } = renderizar();
    await esperarCheckin();
    const esperado = camposDe('dia', perfil, 1).length;
    await waitFor(() => expect(container.querySelectorAll('[data-campo]')).toHaveLength(esperado));
    expect(container.querySelector('[data-campo="dia.ultimoCafe"]')).toBeNull();
    expect(esperado).toBe(camposDe('dia', { ...perfil, cafe: 'diario' }, 1).length - 1);
  });

  test('moveu some quando houve treino ontem', async () => {
    await salvarPerfil(PERFIL);
    await registrarTreino({ data: ontem(hojeISO()), hora: '18:00', tipo: 'moderado', minutos: 20 });
    const { container } = renderizar();
    await esperarCheckin();
    await waitFor(() => expect(container.querySelectorAll('[data-campo]').length).toBeGreaterThan(0));
    expect(container.querySelector('[data-campo="dia.moveu"]')).toBeNull();
  });

  test('clicar Sim em comiSemFome grava no dia de hoje', async () => {
    await salvarPerfil(PERFIL);
    const { container } = renderizar();
    await esperarCheckin();
    const el = await waitFor(() => {
      const x = container.querySelector('[data-campo="dia.comiSemFome"]');
      expect(x).not.toBeNull();
      return x as HTMLElement;
    });
    fireEvent.click(within(el).getByRole('button', { name: 'Sim' }));
    await waitFor(async () => expect((await lerDia(hojeISO()))?.comiSemFome).toBe(true));
  });

  test('preencher passos grava no dia de ontem, não no de hoje', async () => {
    await salvarPerfil(PERFIL);
    const { container } = renderizar();
    await esperarCheckin();
    const el = await waitFor(() => {
      const x = container.querySelector('[data-campo="dia.passos"]');
      expect(x).not.toBeNull();
      return x as HTMLElement;
    });
    fireEvent.change(within(el).getByLabelText(/Passos de ontem/), { target: { value: '6200' } });
    await waitFor(async () => expect((await lerDia(ontem(hojeISO())))?.passos).toBe(6200));
    expect((await lerDia(hojeISO()))?.passos).toBeUndefined();
  });

  test('Quero registrar mais abre o nível 2 com o convite', async () => {
    const perfil = await salvarPerfil(PERFIL);
    const { container } = renderizar();
    await esperarCheckin();
    fireEvent.click(screen.getByRole('button', { name: 'Quero registrar mais' }));
    expect(screen.getAllByText(/^Registre .* e eu te digo onde você está em/).length).toBeGreaterThan(0);
    const total = camposDe('dia', perfil, 2).length;
    await waitFor(() => expect(container.querySelectorAll('[data-campo]')).toHaveLength(total));
  });
});

describe('Hoje — eventos', () => {
  test('Levantei incrementa levantadas', async () => {
    await salvarPerfil(PERFIL);
    renderizar();
    const botao = await screen.findByRole('button', { name: 'Levantei' });
    fireEvent.click(botao);
    await waitFor(async () => expect((await lerDia(hojeISO()))?.levantadas).toBe(1));
    fireEvent.click(botao);
    await waitFor(async () => expect((await lerDia(hojeISO()))?.levantadas).toBe(2));
  });

  test('Comi grava a refeição e soma proteína no dia', async () => {
    await salvarPerfil(PERFIL);
    renderizar();
    fireEvent.click(await screen.findByRole('button', { name: 'Comi' }));
    fireEvent.change(screen.getByLabelText('Proteína (g)'), { target: { value: '30' } });
    fireEvent.click(screen.getByRole('button', { name: 'Registrar refeição' }));
    await waitFor(async () => expect((await lerDia(hojeISO()))?.proteinaG).toBe(30));
  });

  test('mostra o contador de dias parado e três ações em foco', async () => {
    await salvarPerfil(PERFIL);
    const { container } = renderizar();
    await screen.findByRole('heading', { name: 'Dias parado' });
    await waitFor(() => expect(container.querySelectorAll('article.card')).toHaveLength(3));
  });
});
