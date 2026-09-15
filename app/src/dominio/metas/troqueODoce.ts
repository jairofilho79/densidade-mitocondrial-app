import { aplicarSeguranca, diasUltimos, semDado, semanaAtual } from './_util';
import type { AcaoMeta, Zona } from './tipos';

export const troqueODoce: AcaoMeta = {
  id: 'troque-o-doce',
  aplica: () => true,
  meta(ctx) {
    let n = semanaAtual(ctx)?.docesSemana;
    if (n === undefined) {
      const comRegistro = diasUltimos(ctx, 7).filter((d) => d.bebidaDoce !== undefined);
      if (comRegistro.length > 0) n = comRegistro.reduce((s, d) => s + (d.bebidaDoce ?? 0), 0);
    }
    if (n === undefined) return semDado(['dia.bebidaDoce']);

    const zona: Zona = n < 1 ? 'meta' : n <= 3 ? 'atencao' : 'demais';
    const proximoPasso = n === 0 ? 'manter' : `trocar ${Math.min(n, 2)} por semana por água com gás ou fruta inteira`;

    return aplicarSeguranca('troque-o-doce', ctx.perfil, {
      zona,
      valor: n,
      faixa: { pouco: 0, meta: 1, demais: 3 },
      posicao: n === 0 ? 0.1 : n <= 3 ? 0.5 : 0.9,
      texto: `${n} bebidas doces/sem`,
      proximoPasso,
    });
  },
};
