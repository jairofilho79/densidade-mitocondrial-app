import Dexie, { type Table } from 'dexie';
import type { DataISO, Dia, EventoRefeicao, EventoTreino, Exame, Mes, MesISO, Perfil, Semana, SemanaISO } from '@/dominio/tipos';

/**
 * Uma tabela por cadência, chaves naturais (data, semana ISO, mês) onde existem.
 * Índices secundários só em `data` dos eventos (consulta por janela de dias).
 * Migrações futuras: acrescente `this.version(2).stores({...}).upgrade(...)` ABAIXO da version(1), nunca edite a 1.
 */
export class FornalhaDB extends Dexie {
  perfil!: Table<Perfil & { id: 'me' }, 'me'>;
  dia!: Table<Dia, DataISO>;
  eventoTreino!: Table<EventoTreino, string>;
  eventoRefeicao!: Table<EventoRefeicao, string>;
  semana!: Table<Semana, SemanaISO>;
  mes!: Table<Mes, MesISO>;
  exame!: Table<Exame, DataISO>;

  constructor() {
    super('fornalha');
    this.version(1).stores({
      perfil: 'id',
      dia: 'data',
      eventoTreino: 'id, data',
      eventoRefeicao: 'id, data',
      semana: 'semana',
      mes: 'mes',
      exame: 'data',
    });
  }
}

export const db = new FornalhaDB();
