import { aplicarSeguranca, semDado } from './_util';
import type { AcaoMeta } from './tipos';

/** Hábito de medida mensal: aparece como Medida na UI. Meta = mediu a panturrilha no mês mais recente. */
export const panturrilhaPreensao: AcaoMeta = {
  id: 'panturrilha-preensao',
  aplica: () => true,
  meta(ctx) {
    const panturrilha = ctx.mes?.panturrilha;
    if (ctx.mes === undefined || panturrilha === undefined) {
      return semDado(['mes.panturrilha'], 'sem medida este mês');
    }
    const preensao = ctx.mes.preensao;
    const texto =
      preensao === undefined
        ? `panturrilha ${panturrilha} cm registrada (${ctx.mes.mes})`
        : `panturrilha ${panturrilha} cm e preensão ${preensao} kg registradas (${ctx.mes.mes})`;
    return aplicarSeguranca('panturrilha-preensao', ctx.perfil, {
      zona: 'meta',
      valor: panturrilha,
      faixa: null,
      posicao: null,
      texto,
      proximoPasso: 'medir de novo na primeira segunda do próximo mês',
    });
  },
};
