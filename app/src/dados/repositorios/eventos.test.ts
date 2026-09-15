// @vitest-environment node
import { beforeEach, describe, expect, it } from 'vitest';
import { limparBanco } from '@/dados/testes/banco';
import { refeicoesEntre, registrarRefeicao, registrarTreino, treinosEntre } from './eventos';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

beforeEach(limparBanco);

describe('eventos de treino', () => {
  it('registrarTreino gera id uuid e atualizadoEm', async () => {
    const e = await registrarTreino({ data: '2026-09-14', hora: '18:00', tipo: 'tiros', minutos: 20, tiros: 4 });
    expect(e.id).toMatch(UUID);
    expect(e.atualizadoEm).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(e).toMatchObject({ data: '2026-09-14', hora: '18:00', tipo: 'tiros', minutos: 20, tiros: 4 });
  });

  it('dois registros no mesmo dia têm ids diferentes', async () => {
    const a = await registrarTreino({ data: '2026-09-14', hora: '07:00', tipo: 'forca', minutos: 30 });
    const b = await registrarTreino({ data: '2026-09-14', hora: '19:00', tipo: 'moderado', minutos: 40 });
    expect(a.id).not.toBe(b.id);
  });

  it('treinosEntre é inclusivo nas duas pontas e vem mais recente primeiro (data, depois hora)', async () => {
    await registrarTreino({ data: '2026-09-10', hora: '08:00', tipo: 'moderado', minutos: 30 });
    await registrarTreino({ data: '2026-09-12', hora: '07:00', tipo: 'forca', minutos: 30 });
    await registrarTreino({ data: '2026-09-12', hora: '19:00', tipo: 'tiros', minutos: 15 });
    await registrarTreino({ data: '2026-09-14', hora: '08:00', tipo: 'moderado', minutos: 30 });
    await registrarTreino({ data: '2026-09-15', hora: '08:00', tipo: 'moderado', minutos: 30 });
    await registrarTreino({ data: '2026-09-09', hora: '08:00', tipo: 'moderado', minutos: 30 });
    const lista = await treinosEntre('2026-09-10', '2026-09-14');
    expect(lista.map((e) => `${e.data} ${e.hora}`)).toEqual([
      '2026-09-14 08:00',
      '2026-09-12 19:00',
      '2026-09-12 07:00',
      '2026-09-10 08:00',
    ]);
  });
});

describe('eventos de refeição', () => {
  it('registrarRefeicao gera id e guarda comecouPelaFibra sem interpretar', async () => {
    const r = await registrarRefeicao({ data: '2026-09-14', hora: '12:30', proteinaG: 30, fibraG: 8, cozinhada: true, comecouPelaFibra: true });
    expect(r.id).toMatch(UUID);
    expect(r.comecouPelaFibra).toBe(true);
  });

  it('refeicoesEntre respeita a janela e a ordem', async () => {
    await registrarRefeicao({ data: '2026-09-13', hora: '08:00' });
    await registrarRefeicao({ data: '2026-09-14', hora: '08:00' });
    await registrarRefeicao({ data: '2026-09-14', hora: '13:00' });
    await registrarRefeicao({ data: '2026-09-16', hora: '08:00' });
    const lista = await refeicoesEntre('2026-09-14', '2026-09-15');
    expect(lista.map((r) => `${r.data} ${r.hora}`)).toEqual(['2026-09-14 13:00', '2026-09-14 08:00']);
  });
});
