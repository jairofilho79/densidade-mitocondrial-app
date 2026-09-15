import { horaParaMin, horasEntre, minParaHora, r1 } from '../derivados';
import { aplicarSeguranca, deDiaSeNaoHoje, semDado, ultimoDiaCom } from './_util';
import type { AcaoMeta, Zona } from './tipos';

export const janteCedo: AcaoMeta = {
  id: 'jante-cedo',
  aplica: () => true,
  meta(ctx) {
    const dia = ultimoDiaCom(ctx.dias, 'jantarFim');
    const jantar = dia?.jantarFim;
    if (dia === undefined || jantar === undefined) return semDado(['dia.jantarFim']);

    const ideal = minParaHora(horaParaMin(ctx.perfil.deitar) - 180); // 3 h antes
    const dh = horasEntre(jantar, ctx.perfil.deitar);
    const zona: Zona = dh >= 3 ? 'meta' : dh >= 1 ? 'atencao' : 'demais';

    const passoMin = Math.min(15, Math.round((3 - dh) * 60));
    const alvo = minParaHora(horaParaMin(jantar) - passoMin);
    const proximoPasso =
      zona === 'meta'
        ? 'manter'
        : `terminar o jantar ${passoMin} min mais cedo esta semana: até ${alvo} (a meta é até ${ideal})`;

    return aplicarSeguranca('jante-cedo', ctx.perfil, {
      zona,
      valor: r1(dh),
      faixa: { pouco: 3, meta: 3, demais: 1 },
      posicao: dh >= 3 ? 0.5 : dh >= 1 ? 0.72 : 0.9,
      texto: `jantar termina ${r1(dh)} h antes de deitar`,
      proximoPasso,
      ...deDiaSeNaoHoje(ctx, dia),
    });
  },
};
