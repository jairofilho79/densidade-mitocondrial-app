import type { Semana, SemanaISO } from '@/dominio/tipos';
import { mediana } from '@/dominio/derivados';
import { db } from '@/dados/db';
import { segundaDaSemana, somarDias } from '@/dados/datas';

export function lerSemana(s: SemanaISO): Promise<Semana | undefined> {
  return db.semana.get(s);
}

export function salvarSemana(s: SemanaISO, parcial: Partial<Omit<Semana, 'semana' | 'atualizadoEm'>>): Promise<Semana> {
  return db.transaction('rw', db.semana, async () => {
    const atual = await db.semana.get(s);
    const nova: Semana = { ...atual, ...parcial, semana: s, atualizadoEm: new Date().toISOString() };
    await db.semana.put(nova);
    return nova;
  });
}

/** A chave "YYYY-Www" ordena cronologicamente como texto (W01 … W53). */
export function semanaMaisRecente(): Promise<Semana | undefined> {
  return db.semana.orderBy('semana').last();
}

/**
 * Pré-preenchimento da revisão de segunda a partir dos eventos e dos dias da semana ISO.
 * Não grava: a pessoa confirma ou corrige na tela e só então `salvarSemana` é chamado.
 */
export async function preencherSemana(s: SemanaISO): Promise<Partial<Semana>> {
  const segunda = segundaDaSemana(s);
  const domingo = somarDias(segunda, 6);
  const [treinos, dias] = await Promise.all([
    db.eventoTreino.where('data').between(segunda, domingo, true, true).toArray(),
    db.dia.where('data').between(segunda, domingo, true, true).toArray(),
  ]);

  const parcial: Partial<Semana> = {
    sessoesTiros: treinos.filter((t) => t.tipo === 'tiros').length,
    sessoesForca: treinos.filter((t) => t.tipo === 'forca').length,
    minAtiv: treinos.filter((t) => t.tipo === 'moderado').reduce((soma, t) => soma + t.minutos, 0),
  };

  const doses = dias.map((d) => d.alcoolDoses).filter((v): v is number => typeof v === 'number'); // null = não bebeu, não soma
  if (doses.length > 0) parcial.alcoolDoses = doses.reduce((a, b) => a + b, 0);

  const doces = dias.map((d) => d.bebidaDoce).filter((v): v is number => typeof v === 'number');
  if (doces.length > 0) parcial.docesSemana = doces.reduce((a, b) => a + b, 0);

  const blocoTipico = mediana(dias.map((d) => d.maiorBloco).filter((v): v is number => typeof v === 'number'));
  if (blocoTipico !== null) parcial.maiorBlocoTipico = blocoTipico;

  return parcial;
}
