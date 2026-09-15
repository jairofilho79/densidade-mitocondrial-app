import { aplicarSeguranca, deDiaSeNaoHoje, fmt, semDado, ultimoDiaCom } from './_util';
import type { AcaoMeta, Zona } from './tipos';

export const andeDepoisDoJantar: AcaoMeta = {
  id: 'ande-depois-do-jantar',
  aplica: () => true,
  meta(ctx) {
    const dia = ultimoDiaCom(ctx.dias, 'minPosJantar');
    const m = dia?.minPosJantar;
    if (dia === undefined || m === undefined) return semDado(['dia.minPosJantar']);

    const zona: Zona = m >= 10 ? 'meta' : m > 0 ? 'atencao' : 'pouco';
    const proximoPasso =
      m >= 10
        ? 'manter; se quiser, até 30 min'
        : m > 0
          ? `chegar a ${fmt(Math.min(10, m + 5))} min (mais 5 que da última vez)`
          : '5 minutos de pé andando na sala, hoje';

    return aplicarSeguranca('ande-depois-do-jantar', ctx.perfil, {
      zona,
      valor: m,
      faixa: { pouco: 0, meta: 10, demais: 30 },
      posicao: m >= 10 ? 0.5 : m > 0 ? 0.25 : 0.06,
      texto: `${fmt(m)} min depois do jantar`,
      proximoPasso,
      ...deDiaSeNaoHoje(ctx, dia),
    });
  },
};
