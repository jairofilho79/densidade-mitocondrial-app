import { horaParaMin, minParaHora, r1 } from '../derivados';
import type { Dia, Hora } from '../tipos';
import { aplicarSeguranca, deDiaSeNaoHoje, diasUltimos, fmt, horasAntesDeDeitar, passo15min, semDado } from './_util';
import type { AcaoMeta, Faixa, Zona } from './tipos';

const FAIXA: Faixa = { pouco: 9, meta: 9, demais: 6 }; // horas antes de deitar

export const ultimoCafe: AcaoMeta = {
  id: 'ultimo-cafe',
  aplica: (perfil) => perfil.cafe !== 'nao',
  meta(ctx) {
    const deitarMin = horaParaMin(ctx.perfil.deitar);
    const corte = minParaHora(deitarMin - 540); // 9 h antes
    const esporadico = ctx.perfil.cafe === 'as-vezes';
    const vals = { deitar: ctx.perfil.deitar, corte_cafe: corte };

    // Só os últimos 7 dias; undefined = não registrou, null = não tomou.
    const registrados = diasUltimos(ctx, 7).filter((d) => d.ultimoCafe !== undefined);
    if (registrados.length === 0) return semDado(['dia.ultimoCafe'], undefined, vals);

    const comCafe = registrados.flatMap((d): Array<{ dia: Dia; hora: Hora }> =>
      d.ultimoCafe ? [{ dia: d, hora: d.ultimoCafe }] : [],
    );
    if (comCafe.length === 0) {
      return aplicarSeguranca('ultimo-cafe', ctx.perfil, {
        zona: 'meta',
        valor: null,
        faixa: FAIXA,
        posicao: 0.5,
        texto: 'sem café nesta semana',
        proximoPasso: `se um dia tomar, antes das ${corte}`,
        vals,
      });
    }

    const { dia, hora } = comCafe[0]; // o mais recente
    const dh = horasAntesDeDeitar(hora, ctx.perfil.deitar);
    const zona: Zona = dh < 0 ? 'demais' : dh >= 9 ? 'meta' : dh >= 6 ? 'atencao' : 'demais';

    let proximoPasso: string;
    let posicao: number;
    if (zona === 'meta') {
      proximoPasso = 'manter';
      posicao = 0.5;
    } else {
      const { hora: alvo, minutos } = passo15min(hora, corte, 'antes');
      proximoPasso = `último café ${fmt(minutos)} min mais cedo: até ${alvo} (a meta é antes das ${corte})`;
      posicao = dh < 0 ? 0.98 : dh >= 6 ? 0.72 : 0.9;
    }
    const texto =
      dh < 0
        ? `depois do horário de deitar (${fmt(-dh)} h)`
        : esporadico
          ? `nos dias em que tomar, antes das ${corte} — último: ${fmt(dh)} h antes de deitar`
          : `último café ${fmt(dh)} h antes de deitar`;

    return aplicarSeguranca('ultimo-cafe', ctx.perfil, {
      zona,
      valor: r1(dh),
      faixa: FAIXA,
      posicao,
      texto,
      proximoPasso,
      vals,
      ...deDiaSeNaoHoje(ctx, dia),
    });
  },
};
