import { horaParaMin, minParaHora, r1 } from '../derivados';
import { aplicarSeguranca, deDiaSeNaoHoje, fmt, horasAntesDeDeitar, passo15min, semDado, ultimoDiaCom } from './_util';
import type { AcaoMeta, Zona } from './tipos';

export const janteCedo: AcaoMeta = {
  id: 'jante-cedo',
  aplica: () => true,
  meta(ctx) {
    const ideal = minParaHora(horaParaMin(ctx.perfil.deitar) - 180); // 3 h antes
    const vals = { deitar: ctx.perfil.deitar, jantar_ideal: ideal };

    const dia = ultimoDiaCom(ctx.dias, 'jantarFim');
    const jantar = dia?.jantarFim;
    if (dia === undefined || jantar === undefined) return semDado(['dia.jantarFim'], undefined, vals);

    const dh = horasAntesDeDeitar(jantar, ctx.perfil.deitar);
    const zona: Zona = dh < 0 ? 'demais' : dh >= 3 ? 'meta' : dh >= 1 ? 'atencao' : 'demais';

    let proximoPasso: string;
    let posicao: number;
    if (zona === 'meta') {
      proximoPasso = 'manter';
      posicao = 0.5;
    } else {
      const { hora: alvo, minutos } = passo15min(jantar, ideal, 'antes');
      proximoPasso = `terminar o jantar ${fmt(minutos)} min mais cedo esta semana: até ${alvo} (a meta é até ${ideal})`;
      posicao = dh < 0 ? 0.98 : dh >= 1 ? 0.72 : 0.9;
    }
    const texto = dh < 0 ? `depois do horário de deitar (${fmt(-dh)} h)` : `jantar termina ${fmt(dh)} h antes de deitar`;

    return aplicarSeguranca('jante-cedo', ctx.perfil, {
      zona,
      valor: r1(dh),
      faixa: { pouco: 3, meta: 3, demais: 1 },
      posicao,
      texto,
      proximoPasso,
      vals,
      ...deDiaSeNaoHoje(ctx, dia),
    });
  },
};
