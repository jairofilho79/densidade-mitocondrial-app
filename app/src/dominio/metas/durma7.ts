import { horaParaMin, minParaHora, pos, r1 } from '../derivados';
import { aplicarSeguranca, deDiaSeNaoHoje, fmt, semDado } from './_util';
import type { AcaoMeta, Zona } from './tipos';

export const durma7: AcaoMeta = {
  id: 'durma-7',
  aplica: () => true,
  meta(ctx) {
    const deitarIdeal = minParaHora(horaParaMin(ctx.perfil.levantar) - 450); // levantar − 7 h 30
    const vals = { levantar: ctx.perfil.levantar, deitar_ideal: deitarIdeal };

    const hs = ctx.derivados.sonoHoras;
    const dia = ctx.dias.find((d) => d.deitou !== undefined && d.levantou !== undefined);
    if (hs === null || dia === undefined) return semDado(['dia.deitou', 'dia.levantou'], undefined, vals);

    // 8,5 h é fronteira, não limite: acima disso continua 'meta' (sem sinal claro de custo), só muda o texto.
    const zona: Zona = hs < 6 ? 'pouco' : hs < 7 ? 'atencao' : 'meta';
    const proximoPasso =
      hs < 7
        ? `deitar 15 min antes por uma semana, até chegar às ${deitarIdeal}`
        : hs > 8.5
          ? 'manter'
          : 'manter o horário; anotar a variação';
    const texto =
      `${fmt(hs)} h de sono (${fmt(hs + 0.33)} h na cama)` +
      (hs > 8.5 ? ' — mais de 8,5 h: sem sinal claro de custo (fronteira)' : '');

    return aplicarSeguranca('durma-7', ctx.perfil, {
      zona,
      valor: r1(hs),
      faixa: { pouco: 6, meta: 7, demais: 8.5 },
      posicao: pos(hs, 7, 8),
      texto,
      proximoPasso,
      vals,
      ...deDiaSeNaoHoje(ctx, dia),
    });
  },
};
