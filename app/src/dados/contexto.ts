import type { DataISO } from '@/dominio/tipos';
import type { Contexto } from '@/dominio/metas/tipos';
import { derivar } from '@/dominio/derivados';
import { somarDias } from '@/dados/datas';
import { lerPerfil } from '@/dados/repositorios/perfil';
import { diasRecentes } from '@/dados/repositorios/dia';
import { refeicoesEntre, treinosEntre } from '@/dados/repositorios/eventos';
import { semanaMaisRecente } from '@/dados/repositorios/semana';
import { mesMaisRecente } from '@/dados/repositorios/mes';

const JANELA_DIAS = 28;

/**
 * Única ponte dados/ → dominio/: lê uma vez cada tabela na janela de 28 dias e calcula os derivados.
 * A UI reage a gravações via useLiveQuery (plano 04), chamando esta função de novo.
 */
export async function montarContexto(hoje: DataISO, agora: Date = new Date()): Promise<Contexto | { semPerfil: true }> {
  const perfil = await lerPerfil();
  if (!perfil) return { semPerfil: true };

  const inicio = somarDias(hoje, -(JANELA_DIAS - 1));
  const [dias, eventos, refeicoes, semana, mes] = await Promise.all([
    diasRecentes(hoje, JANELA_DIAS),
    treinosEntre(inicio, hoje),
    refeicoesEntre(inicio, hoje),
    semanaMaisRecente(),
    mesMaisRecente(),
  ]);

  return {
    perfil,
    hoje: dias[0]?.data === hoje ? dias[0] : undefined,
    dias,
    eventos,
    refeicoes,
    semana,
    mes,
    derivados: derivar(perfil, dias, eventos, semana, hoje),
    agora,
  };
}
