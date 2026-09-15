import { aplicarSeguranca, fmt, semDado, semanaAtual, somaUltimos7 } from './_util';
import type { AcaoMeta, Zona } from './tipos';

export const troqueODoce: AcaoMeta = {
  id: 'troque-o-doce',
  aplica: () => true,
  meta(ctx) {
    const n = semanaAtual(ctx)?.docesSemana ?? somaUltimos7(ctx, 'bebidaDoce');
    if (n === undefined) return semDado(['dia.bebidaDoce']);

    const zona: Zona = n < 1 ? 'meta' : n <= 3 ? 'atencao' : 'demais';
    const proximoPasso = n === 0 ? 'manter' : `trocar ${fmt(Math.min(n, 2))} por semana por água com gás ou fruta inteira`;

    return aplicarSeguranca('troque-o-doce', ctx.perfil, {
      zona,
      valor: n,
      faixa: { pouco: 0, meta: 1, demais: 3 },
      posicao: n === 0 ? 0.1 : n <= 3 ? 0.5 : 0.9,
      texto: `${fmt(n)} bebidas doces/sem`,
      proximoPasso,
    });
  },
};
