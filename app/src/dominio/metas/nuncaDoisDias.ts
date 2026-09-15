import { aplicarSeguranca, semDado } from './_util';
import type { AcaoMeta, Zona } from './tipos';

export const nuncaDoisDias: AcaoMeta = {
  id: 'nunca-dois-dias',
  aplica: () => true,
  meta(ctx) {
    if (ctx.dias.length === 0 && ctx.eventos.length === 0) {
      return semDado(['dia.moveu'], 'ainda sem registro de movimento');
    }
    const n = ctx.derivados.diasParado;
    const zona: Zona = n <= 1 ? 'meta' : n <= 2 ? 'atencao' : 'pouco';
    const custo =
      n >= 4 ? ' — 4+ dias: já mensurável em citrato sintase' : n >= 2 ? ' — 48 h: transcritos já mudam' : '';

    return aplicarSeguranca('nunca-dois-dias', ctx.perfil, {
      zona,
      valor: n,
      faixa: { pouco: 3, meta: 1, demais: 1 },
      posicao: n <= 1 ? 0.45 : n <= 2 ? 0.25 : 0.06,
      texto: `${n} dia(s) seguido(s) parado${custo}`,
      proximoPasso: n <= 1 ? 'contador zerado' : '10 minutos de caminhada hoje zeram o contador',
    });
  },
};
