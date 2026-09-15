import { aplicarSeguranca, semDado } from './_util';
import type { AcaoMeta } from './tipos';

/** Hábito de registro: não tem número nem faixa. Meta = registrou hoje. */
export const anoteOSono: AcaoMeta = {
  id: 'anote-o-sono',
  aplica: () => true,
  meta(ctx) {
    const hoje = ctx.hoje;
    if (hoje === undefined || hoje.deitou === undefined || hoje.levantou === undefined) {
      return semDado(['dia.deitou', 'dia.levantou'], 'sem registro hoje');
    }
    return aplicarSeguranca('anote-o-sono', ctx.perfil, {
      zona: 'meta',
      valor: null,
      faixa: null,
      posicao: null,
      texto: 'registrado',
      proximoPasso: 'manter o registro diário',
    });
  },
};
