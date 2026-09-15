import { pos, r1 } from '../derivados';
import { aplicarSeguranca, deDiaSeNaoHoje, fmt, hojeISO, semDado, ultimoDiaCom } from './_util';
import type { AcaoMeta, Zona } from './tipos';

export const bebaPelaSede: AcaoMeta = {
  id: 'beba-pela-sede',
  aplica: () => true,
  meta(ctx) {
    const cm = ctx.derivados.coposMeta;
    const hoje = hojeISO(ctx);
    const minTreinoDia = ctx.eventos.filter((e) => e.data === hoje).reduce((s, e) => s + e.minutos, 0);
    const vals = { copos_meta: cm, agua_meta: ctx.derivados.aguaMetaL, min_treino_dia: minTreinoDia };

    const dia = ultimoDiaCom(ctx.dias, 'copos');
    const n = dia?.copos;
    if (dia === undefined || n === undefined) return semDado(['dia.copos'], undefined, vals);

    const zona: Zona = n < cm * 0.6 ? 'pouco' : n < cm ? 'atencao' : n <= cm * 1.8 ? 'meta' : 'atencao';
    const passo = Math.min(cm - n, 2);
    const proximoPasso =
      n < cm
        ? `mais ${fmt(passo)} copo(s) hoje: um ao acordar e um a cada pausa de 30 min (referência ${fmt(cm)})`
        : n > cm * 1.8
          ? 'bem acima da referência — beba pela sede'
          : 'na referência — a urina clara confirma';

    return aplicarSeguranca('beba-pela-sede', ctx.perfil, {
      zona,
      valor: n,
      faixa: { pouco: Math.round(cm * 0.6), meta: cm, demais: Math.round(cm * 1.8) },
      posicao: pos(n, cm, cm * 1.5),
      texto: `${fmt(n)} copos ≈ ${fmt(r1(n * 0.25))} L · referência ${fmt(cm)} copos`,
      proximoPasso,
      vals,
      ...deDiaSeNaoHoje(ctx, dia),
    });
  },
};
