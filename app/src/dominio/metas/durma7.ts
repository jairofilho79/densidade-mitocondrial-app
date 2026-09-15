import { horaParaMin, minParaHora, pos, r1 } from '../derivados';
import { aplicarSeguranca, deDiaSeNaoHoje, semDado } from './_util';
import type { AcaoMeta, Zona } from './tipos';

export const durma7: AcaoMeta = {
  id: 'durma-7',
  aplica: () => true,
  meta(ctx) {
    const hs = ctx.derivados.sonoHoras;
    const dia = ctx.dias.find((d) => d.deitou !== undefined && d.levantou !== undefined);
    if (hs === null || dia === undefined) return semDado(['dia.deitou', 'dia.levantou']);

    const zona: Zona = hs < 6 ? 'pouco' : hs < 7 ? 'atencao' : hs <= 8.5 ? 'meta' : 'atencao';
    const deitarIdeal = minParaHora(horaParaMin(ctx.perfil.levantar) - 450); // levantar − 7 h 30
    const proximoPasso =
      hs < 7
        ? `deitar 15 min antes por uma semana, até chegar às ${deitarIdeal}`
        : hs > 8.5
          ? 'mais de 8,5 h: manter o horário e anotar como acordou'
          : 'manter o horário; anotar a variação';

    return aplicarSeguranca('durma-7', ctx.perfil, {
      zona,
      valor: r1(hs),
      faixa: { pouco: 6, meta: 7, demais: 8.5 },
      posicao: pos(hs, 7, 8),
      texto: `${r1(hs)} h de sono (${r1(hs + 0.33)} h na cama)`,
      proximoPasso,
      ...deDiaSeNaoHoje(ctx, dia),
    });
  },
};
