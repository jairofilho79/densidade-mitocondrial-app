import { aplicarSeguranca, deDiaSeNaoHoje, fmt, semDado, ultimoDiaCom } from './_util';
import type { AcaoMeta, Zona } from './tipos';

export const levanteACada30: AcaoMeta = {
  id: 'levante-a-cada-30',
  aplica: () => true,
  meta(ctx) {
    const dia = ultimoDiaCom(ctx.dias, 'maiorBloco');
    const b = dia?.maiorBloco;
    if (dia === undefined || b === undefined) return semDado(['dia.maiorBloco']);

    const zona: Zona = b <= 30 ? 'meta' : b <= 60 ? 'atencao' : 'pouco';
    const levantadas = ctx.hoje?.levantadas;
    const texto = `maior bloco: ${fmt(b)} min` + (levantadas === undefined ? '' : ` · levantou ${fmt(levantadas)}× hoje`);
    const proximoPasso = b <= 30 ? 'manter' : `um alarme em ${fmt(Math.max(30, b - 30))} min esta semana; depois em 30`;

    return aplicarSeguranca('levante-a-cada-30', ctx.perfil, {
      zona,
      valor: b,
      faixa: { pouco: 60, meta: 30, demais: 30 },
      posicao: b <= 30 ? 0.5 : b <= 60 ? 0.25 : 0.08,
      texto,
      proximoPasso,
      ...deDiaSeNaoHoje(ctx, dia),
    });
  },
};
