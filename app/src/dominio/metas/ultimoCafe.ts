import { horaParaMin, horasEntre, minParaHora, r1 } from '../derivados';
import type { Dia, Hora } from '../tipos';
import { aplicarSeguranca, deDiaSeNaoHoje, diasUltimos, semDado } from './_util';
import type { AcaoMeta, Faixa, Zona } from './tipos';

const FAIXA: Faixa = { pouco: 9, meta: 9, demais: 6 }; // horas antes de deitar

export const ultimoCafe: AcaoMeta = {
  id: 'ultimo-cafe',
  aplica: (perfil) => perfil.cafe !== 'nao',
  meta(ctx) {
    const deitarMin = horaParaMin(ctx.perfil.deitar);
    const corte = minParaHora(deitarMin - 540); // 9 h antes
    const esporadico = ctx.perfil.cafe === 'as-vezes';

    // Só os últimos 7 dias; undefined = não registrou, null = não tomou.
    const registrados = diasUltimos(ctx, 7).filter((d) => d.ultimoCafe !== undefined);
    if (registrados.length === 0) return semDado(['dia.ultimoCafe']);

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
      });
    }

    const { dia, hora } = comCafe[0]; // o mais recente
    const dh = horasEntre(hora, ctx.perfil.deitar);
    const zona: Zona = dh >= 9 ? 'meta' : dh >= 6 ? 'atencao' : 'demais';

    const passoMin = Math.min(15, Math.round((9 - dh) * 60));
    const alvo = minParaHora(horaParaMin(hora) - passoMin);
    const proximoPasso =
      zona === 'meta' ? 'manter' : `último café ${passoMin} min mais cedo: até ${alvo} (a meta é antes das ${corte})`;
    const texto = esporadico
      ? `nos dias em que tomar, antes das ${corte} — último: ${r1(dh)} h antes de deitar`
      : `último café ${r1(dh)} h antes de deitar`;

    return aplicarSeguranca('ultimo-cafe', ctx.perfil, {
      zona,
      valor: r1(dh),
      faixa: FAIXA,
      posicao: dh >= 9 ? 0.5 : dh >= 6 ? 0.72 : 0.9,
      texto,
      proximoPasso,
      ...deDiaSeNaoHoje(ctx, dia),
    });
  },
};
