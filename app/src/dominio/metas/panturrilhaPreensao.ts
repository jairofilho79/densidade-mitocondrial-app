import { aplicarSeguranca, fmt, semDado } from './_util';
import type { AcaoMeta } from './tipos';

/** Hábito de medida mensal: aparece como Medida na UI. Meta = mediu a panturrilha no mês mais recente. */
export const panturrilhaPreensao: AcaoMeta = {
  id: 'panturrilha-preensao',
  aplica: () => true,
  meta(ctx) {
    const { pantCorte, pantGrave, preensaoCorte } = ctx.derivados;
    const vals = { pant_corte: pantCorte, pant_grave: pantGrave, preensao_corte: preensaoCorte };

    const panturrilha = ctx.mes?.panturrilha;
    if (ctx.mes === undefined || panturrilha === undefined) {
      return semDado(['mes.panturrilha'], 'sem medida este mês', vals);
    }
    const preensao = ctx.mes.preensao;
    const texto =
      preensao === undefined
        ? `panturrilha ${fmt(panturrilha)} cm registrada (${ctx.mes.mes})`
        : `panturrilha ${fmt(panturrilha)} cm e preensão ${fmt(preensao)} kg registradas (${ctx.mes.mes})`;
    return aplicarSeguranca('panturrilha-preensao', ctx.perfil, {
      zona: 'meta',
      valor: panturrilha,
      faixa: null,
      posicao: null,
      texto,
      proximoPasso: 'medir de novo na primeira segunda do próximo mês',
      vals,
    });
  },
};
