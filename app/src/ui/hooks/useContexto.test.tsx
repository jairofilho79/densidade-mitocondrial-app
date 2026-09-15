import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { ContextoProvider, useContexto } from './useContexto';
import { usePerfil } from './usePerfil';
import { useDia } from './useDia';
import * as contexto from '@/dados/contexto';
import { salvarPerfil } from '@/dados/repositorios/perfil';
import { salvarDia } from '@/dados/repositorios/dia';
import { apagarTudo } from '@/dados/exportImport';
import { hojeISO, somarDias } from '@/dados/datas';
import { PERFIL } from '@/test/fixtures';

beforeEach(async () => {
  await apagarTudo();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('useContexto', () => {
  test('sem perfil → semPerfil; ao salvar perfil, entrega o contexto', async () => {
    const { result } = renderHook(() => useContexto(), { wrapper: ContextoProvider });
    expect(result.current.carregando).toBe(true);

    await waitFor(() => expect(result.current.semPerfil).toBe(true));
    expect(result.current.ctx).toBeUndefined();

    await salvarPerfil(PERFIL);

    await waitFor(() => expect(result.current.ctx?.perfil.peso).toBe(90));
    expect(result.current.semPerfil).toBe(false);
    expect(result.current.carregando).toBe(false);
  });

  test('recalcula quando o dia muda', async () => {
    await salvarPerfil(PERFIL);
    const { result } = renderHook(() => useContexto(), { wrapper: ContextoProvider });
    await waitFor(() => expect(result.current.ctx).toBeDefined());

    await salvarDia(hojeISO(), { passos: 4321 });

    await waitFor(() => expect(result.current.ctx?.hoje?.passos).toBe(4321));
  });

  test('atualiza hoje quando a aba volta a ficar visível num dia diferente', async () => {
    await salvarPerfil(PERFIL);
    const espiao = vi.spyOn(contexto, 'montarContexto');
    renderHook(() => useContexto(), { wrapper: ContextoProvider });
    await waitFor(() => expect(espiao).toHaveBeenCalledWith(hojeISO()));

    const amanha = somarDias(hojeISO(), 1);
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(`${amanha}T08:00:00`));
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    document.dispatchEvent(new Event('visibilitychange'));

    await waitFor(() => expect(espiao).toHaveBeenCalledWith(amanha));
  });
});

describe('usePerfil e useDia', () => {
  test('acompanham as gravações', async () => {
    const perfil = renderHook(() => usePerfil());
    const dia = renderHook(() => useDia(hojeISO()));
    expect(perfil.result.current).toBeUndefined();

    await salvarPerfil(PERFIL);
    await salvarDia(hojeISO(), { copos: 3 });

    await waitFor(() => expect(perfil.result.current?.altura).toBe(175));
    await waitFor(() => expect(dia.result.current?.copos).toBe(3));
  });
});
