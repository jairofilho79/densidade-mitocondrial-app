import { aplicarSeguranca, deDiaSeNaoHoje, semDado, ultimoDiaCom } from './_util';
import type { AcaoMeta, Zona } from './tipos';

export const comidaDeVerdade: AcaoMeta = {
  id: 'comida-de-verdade',
  aplica: () => true,
  meta(ctx) {
    const dia = ultimoDiaCom(ctx.dias, 'refeicoesCozinhadas');
    const n = dia?.refeicoesCozinhadas;
    if (dia === undefined || n === undefined) return semDado(['dia.refeicoesCozinhadas']);

    const zona: Zona = n >= 2 ? 'meta' : n === 1 ? 'atencao' : 'pouco';

    return aplicarSeguranca('comida-de-verdade', ctx.perfil, {
      zona,
      valor: n,
      faixa: { pouco: 0, meta: 2, demais: 3 },
      posicao: n >= 2 ? 0.55 : n === 1 ? 0.25 : 0.06,
      texto: `${n} de 3 refeições de ingredientes`,
      proximoPasso: n >= 2 ? 'manter' : 'uma refeição a mais de ingredientes: a mais fácil é o café da manhã',
      ...deDiaSeNaoHoje(ctx, dia),
    });
  },
};
