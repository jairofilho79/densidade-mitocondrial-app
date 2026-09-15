import { aplicarSeguranca, fmt, semDado } from './_util';
import type { AcaoMeta } from './tipos';

/** Hábito de medida: aparece como Medida (whtr) na UI, não como card. Meta = mediu na semana mais recente. */
export const mecaACintura: AcaoMeta = {
  id: 'meca-a-cintura',
  aplica: () => true,
  meta(ctx) {
    const altura = ctx.perfil.altura;
    const corteCintura = ctx.derivados.corteCintura;
    const vals = { cintura_ideal: Math.round(altura / 2), altura, corte_cintura: corteCintura };

    const cintura = ctx.semana?.cintura;
    if (ctx.semana === undefined || cintura === undefined) {
      return semDado(['semana.cintura'], 'sem medida esta semana', vals);
    }
    return aplicarSeguranca('meca-a-cintura', ctx.perfil, {
      zona: 'meta',
      valor: cintura,
      faixa: null,
      posicao: null,
      texto: `cintura registrada: ${fmt(cintura)} cm`,
      proximoPasso: 'medir de novo na próxima segunda',
      vals: { ...vals, cintura },
    });
  },
};
