import type { Campo } from '@/dominio/campos';
import type { Zona } from '@/dominio/metas/tipos';
import type { DataISO, Hora } from '@/dominio/tipos';

/** 'dia.passos' → 'passos' — a chave dentro do objeto da tabela. */
export function chaveDe(c: Campo): string {
  return c.id.slice(c.id.indexOf('.') + 1);
}

/** ['a', 'b', 'c'] → 'a, b e c' */
export function listar(itens: string[]): string {
  if (itens.length <= 1) return itens.join('');
  return `${itens.slice(0, -1).join(', ')} e ${itens[itens.length - 1]}`;
}

export const ROTULO_ZONA: Record<Zona, string> = {
  pouco: 'pouco',
  atencao: 'perto',
  meta: 'na meta',
  demais: 'demais',
  'sem-dado': 'sem dado',
};

export function horaAgora(agora: Date = new Date()): Hora {
  const h = String(agora.getHours()).padStart(2, '0');
  const m = String(agora.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

function aoMeioDia(d: DataISO): Date {
  return new Date(`${d}T12:00:00`);
}

export function primeiraSegundaDoMes(d: DataISO): boolean {
  const dt = aoMeioDia(d);
  return dt.getDay() === 1 && dt.getDate() <= 7;
}

export function diasEntre(de: DataISO, ate: DataISO): number {
  const ms = aoMeioDia(ate).getTime() - aoMeioDia(de).getTime();
  return Math.round(ms / 86_400_000);
}

export function formatarData(d: DataISO): string {
  const [a, m, dia] = d.split('-');
  return `${dia}/${m}/${a}`;
}

/** "2026-09" → "setembro de 2026" (mês por extenso, pt-BR). */
export function formatarMes(m: string): string {
  const [ano, mes] = m.split('-').map(Number);
  const d = new Date(Date.UTC(ano, mes - 1, 1));
  return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}
