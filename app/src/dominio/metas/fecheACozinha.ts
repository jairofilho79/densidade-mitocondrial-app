import { horaParaMin, horasEntre, minParaHora, pos, r1, somarDias } from '../derivados';
import { aplicarSeguranca, fmt, hojeISO, passo15min, semDado } from './_util';
import type { AcaoMeta, Zona } from './tipos';

interface Par {
  D: string;
  jantarFim: string;
  primeiraRefeicao: string;
}

/** O dia D mais recente (≤ hoje) com primeiraRefeicao cujo D−1 tem jantarFim. `ctx.dias` vem do mais recente ao mais antigo. */
function parMaisRecente(ctx: { dias: Array<{ data: string; primeiraRefeicao?: string; jantarFim?: string }> }, hoje: string): Par | undefined {
  const porData = new Map(ctx.dias.map((d) => [d.data, d]));
  for (const dia of ctx.dias) {
    if (dia.data > hoje || dia.primeiraRefeicao === undefined) continue;
    const anterior = porData.get(somarDias(dia.data, -1));
    if (anterior?.jantarFim === undefined) continue;
    return { D: dia.data, jantarFim: anterior.jantarFim, primeiraRefeicao: dia.primeiraRefeicao };
  }
  return undefined;
}

export const fecheACozinha: AcaoMeta = {
  id: 'feche-a-cozinha',
  aplica: () => true,
  meta(ctx) {
    const hoje = hojeISO(ctx);
    const par = parMaisRecente(ctx, hoje);
    if (par === undefined) return semDado(['dia.jantarFim', 'dia.primeiraRefeicao']);

    // Para hoje, reaproveita derivados.jejumHoras (mesmo cálculo); para outro dia D, calcula direto.
    const h = par.D === hoje && ctx.derivados.jejumHoras !== null ? ctx.derivados.jejumHoras : r1(horasEntre(par.jantarFim, par.primeiraRefeicao));

    const zona: Zona = h < 12 ? 'pouco' : h < 14 ? 'atencao' : h <= 16 ? 'meta' : h < 20 ? 'atencao' : 'demais';
    let proximoPasso: string;
    if (h < 14) {
      const alvoJantar = minParaHora(horaParaMin(par.primeiraRefeicao) - 14 * 60);
      const { hora: novoJantar, minutos } = passo15min(par.jantarFim, alvoJantar, 'antes');
      proximoPasso = `fechar a cozinha ${fmt(minutos)} min mais cedo: até ${novoJantar} (a meta é 14 h de jejum)`;
    } else if (h <= 16) {
      proximoPasso = 'manter; bater a proteína na janela';
    } else if (h < 20) {
      proximoPasso = `você está em ${fmt(h)} h — mais que o testado; se a proteína não fecha, encurte para 16`;
    } else {
      proximoPasso = 'reduzir: acima de 24 h repetido perde músculo';
    }

    return aplicarSeguranca('feche-a-cozinha', ctx.perfil, {
      zona,
      valor: r1(h),
      faixa: { pouco: 12, meta: 14, demais: 20 },
      posicao: pos(h, 14, 16),
      texto: `${fmt(h)} h de jejum`,
      proximoPasso,
      vals: { jantar: par.jantarFim, primeira: par.primeiraRefeicao, jejum_h: r1(h) },
      ...(par.D === hoje ? {} : { deDia: par.D }),
    });
  },
};
