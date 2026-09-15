import { pos } from '../derivados';
import { aplicarSeguranca, deDiaSeNaoHoje, fmt, semDado, ultimoDiaCom } from './_util';
import type { AcaoMeta, Zona } from './tipos';

export const fibraNoPrato: AcaoMeta = {
  id: 'fibra-no-prato',
  aplica: () => true,
  meta(ctx) {
    const dia = ultimoDiaCom(ctx.dias, 'fibraG');
    const g = dia?.fibraG;
    if (dia === undefined || g === undefined) return semDado(['dia.fibraG']);

    const zona: Zona = g < 15 ? 'pouco' : g < 25 ? 'atencao' : g <= 40 ? 'meta' : 'demais';
    const proximoPasso =
      g < 25
        ? `mais 5 g/dia (${fmt(Math.min(g + 5, 25))} g): uma concha de feijão ≈ 7 g, aveia 40 g ≈ 4 g; suba devagar`
        : g > 40
          ? 'acima de 40 g não há ganho extra'
          : 'na meta';

    return aplicarSeguranca('fibra-no-prato', ctx.perfil, {
      zona,
      valor: g,
      faixa: { pouco: 15, meta: 25, demais: 40 },
      posicao: pos(g, 25, 29),
      texto: `${fmt(g)} g/dia`,
      proximoPasso,
      ...deDiaSeNaoHoje(ctx, dia),
    });
  },
};
