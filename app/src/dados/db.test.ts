// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { db } from './db';

describe('FornalhaDB', () => {
  it('abre e tem as 7 tabelas com as chaves dos contratos', async () => {
    await db.open();
    expect(db.isOpen()).toBe(true);
    expect(db.verno).toBe(1);
    const tabelas = db.tables.map((t) => t.name).sort();
    expect(tabelas).toEqual(['dia', 'eventoRefeicao', 'eventoTreino', 'exame', 'mes', 'perfil', 'semana']);
    expect(db.perfil.schema.primKey.keyPath).toBe('id');
    expect(db.dia.schema.primKey.keyPath).toBe('data');
    expect(db.eventoTreino.schema.primKey.keyPath).toBe('id');
    expect(db.eventoTreino.schema.indexes.map((i) => i.keyPath)).toEqual(['data']);
    expect(db.eventoRefeicao.schema.indexes.map((i) => i.keyPath)).toEqual(['data']);
    expect(db.semana.schema.primKey.keyPath).toBe('semana');
    expect(db.mes.schema.primKey.keyPath).toBe('mes');
    expect(db.exame.schema.primKey.keyPath).toBe('data');
  });

  it('grava e lê um dia', async () => {
    await db.dia.put({ data: '2026-09-14', passos: 6000, atualizadoEm: '2026-09-14T08:00:00.000Z' });
    const dia = await db.dia.get('2026-09-14');
    expect(dia?.passos).toBe(6000);
  });
});
