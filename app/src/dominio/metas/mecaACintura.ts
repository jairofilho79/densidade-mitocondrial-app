import { aplicarSeguranca, semDado } from './_util';
import type { AcaoMeta } from './tipos';

/** Hábito de medida: aparece como Medida (whtr) na UI, não como card. Meta = mediu na semana mais recente. */
export const mecaACintura: AcaoMeta = {
  id: 'meca-a-cintura',
  aplica: () => true,
  meta(ctx) {
    const cintura = ctx.semana?.cintura;
    if (ctx.semana === undefined || cintura === undefined) {
      return semDado(['semana.cintura'], 'sem medida esta semana');
    }
    return aplicarSeguranca('meca-a-cintura', ctx.perfil, {
      zona: 'meta',
      valor: cintura,
      faixa: null,
      posicao: null,
      texto: `cintura ${cintura} cm registrada (${ctx.semana.semana})`,
      proximoPasso: 'medir de novo na próxima segunda',
    });
  },
};
