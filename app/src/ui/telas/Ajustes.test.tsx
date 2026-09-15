import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { Ajustes } from './Ajustes';
import { salvarPerfil, lerPerfil } from '@/dados/repositorios/perfil';
import { salvarDia } from '@/dados/repositorios/dia';
import { apagarTudo, exportar } from '@/dados/exportImport';
import * as exportImportModulo from '@/dados/exportImport';
import { PERFIL } from '@/test/fixtures';
import fronteira from '@/ui/fronteira.json';

beforeEach(async () => {
  await apagarTudo();
});

afterEach(() => {
  vi.restoreAllMocks();
});

function renderizar() {
  return render(<MemoryRouter><Ajustes /></MemoryRouter>);
}

describe('Ajustes', () => {
  test('import com JSON malformado mostra o motivo e não altera nada', async () => {
    await salvarPerfil(PERFIL);
    renderizar();
    fireEvent.change(screen.getByLabelText('Cole aqui o JSON exportado'), { target: { value: '{ não é json' } });
    fireEvent.click(screen.getByRole('button', { name: 'Importar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/JSON malformado/);
    expect((await lerPerfil())?.peso).toBe(90);
  });

  test('import com versão desconhecida mostra o motivo vindo do domínio', async () => {
    renderizar();
    fireEvent.change(screen.getByLabelText('Cole aqui o JSON exportado'), { target: { value: '{"versao": 99}' } });
    fireEvent.click(screen.getByRole('button', { name: 'Importar' }));
    const alerta = await screen.findByRole('alert');
    expect(alerta.textContent).not.toBe('');
  });

  test('import com sucesso mostra a contagem por tabela', async () => {
    await salvarPerfil(PERFIL);
    await salvarDia('2026-09-14', { passos: 5000 });
    const exportado = await exportar();
    await apagarTudo();
    renderizar();
    fireEvent.change(screen.getByLabelText('Cole aqui o JSON exportado'), { target: { value: JSON.stringify(exportado) } });
    fireEvent.click(screen.getByRole('button', { name: 'Importar' }));
    const status = await screen.findByRole('status');
    expect(status).toHaveTextContent(/perfil: 1/);
    expect(status).toHaveTextContent(/dia: 1/);
  });

  test('falha de storage ao importar mostra alerta e não derruba a tela', async () => {
    await salvarPerfil(PERFIL);
    const exportado = await exportar();
    vi.spyOn(exportImportModulo, 'importar').mockRejectedValueOnce(new Error('quota'));
    renderizar();
    fireEvent.change(screen.getByLabelText('Cole aqui o JSON exportado'), { target: { value: JSON.stringify(exportado) } });
    fireEvent.click(screen.getByRole('button', { name: 'Importar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível gravar os dados neste navegador.');
  });

  test('falha de storage ao exportar mostra alerta e não derruba a tela', async () => {
    vi.spyOn(exportImportModulo, 'exportar').mockRejectedValueOnce(new Error('quota'));
    renderizar();
    fireEvent.click(screen.getByRole('button', { name: 'Gerar JSON' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível ler os dados neste navegador.');
  });

  test('exportar mostra o JSON com o perfil', async () => {
    await salvarPerfil(PERFIL);
    renderizar();
    fireEvent.click(screen.getByRole('button', { name: 'Gerar JSON' }));
    const area = (await screen.findByLabelText('JSON exportado')) as HTMLTextAreaElement;
    await waitFor(() => expect(area.value).toContain('"versao": 1'));
    expect(area.value).toContain('"peso": 90');
  });

  test('apagar tudo exige o "entendi"', async () => {
    await salvarPerfil(PERFIL);
    renderizar();
    const botao = screen.getByRole('button', { name: 'Apagar tudo' });
    expect(botao).toBeDisabled();
    fireEvent.click(screen.getByLabelText(/Entendi que isso apaga tudo/));
    expect(botao).toBeEnabled();
    fireEvent.click(botao);
    await waitFor(async () => expect(await lerPerfil()).toBeUndefined());
  });

  test('falha de storage ao apagar mostra alerta e não derruba a tela', async () => {
    vi.spyOn(exportImportModulo, 'apagarTudo').mockRejectedValueOnce(new Error('quota'));
    renderizar();
    fireEvent.click(screen.getByLabelText(/Entendi que isso apaga tudo/));
    fireEvent.click(screen.getByRole('button', { name: 'Apagar tudo' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível apagar os dados neste navegador.');
  });

  test('lista a Fronteira', () => {
    renderizar();
    expect(screen.getByRole('heading', { name: 'Fronteira' })).toBeInTheDocument();
    expect(screen.getByText(fronteira[0].titulo)).toBeInTheDocument();
    expect(fronteira.length).toBeGreaterThanOrEqual(6);
  });
});
