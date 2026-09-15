// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/dados/db';
import { indexedDbDisponivel } from './disponibilidade';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('indexedDbDisponivel', () => {
  it('true quando o banco abre (fake-indexeddb)', async () => {
    expect(await indexedDbDisponivel()).toBe(true);
    expect(db.isOpen()).toBe(true);
  });

  it('false quando não existe indexedDB no ambiente', async () => {
    vi.stubGlobal('indexedDB', undefined);
    expect(await indexedDbDisponivel()).toBe(false);
  });

  it('false quando db.open() rejeita, sem lançar', async () => {
    vi.spyOn(db, 'open').mockRejectedValueOnce(new Error('bloqueado'));
    await expect(indexedDbDisponivel()).resolves.toBe(false);
  });
});
