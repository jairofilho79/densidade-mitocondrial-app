import { pos } from '../derivados';
import { aplicarSeguranca, contarSessoes7, eventosUltimos, fmt, semDado, semanaAtual } from './_util';
import type { AcaoMeta, Zona } from './tipos';

export const some150: AcaoMeta = {
  id: 'some-150',
  aplica: () => true,
  meta(ctx) {
    const revisao = semanaAtual(ctx);
    let total: number | undefined;

    if (revisao?.minAtiv !== undefined) {
      const tiros = revisao.sessoesTiros ?? contarSessoes7(ctx, 'tiros');
      total = revisao.minAtiv + tiros * 20;
    } else if (ctx.eventos.length > 0) {
      const recentes = eventosUltimos(ctx, 7);
      const moderado = recentes.filter((e) => e.tipo === 'moderado').reduce((s, e) => s + e.minutos, 0);
      const tiros = recentes.filter((e) => e.tipo === 'tiros').length;
      total = moderado + tiros * 20;
    }
    const { fc60, fc70 } = ctx.derivados;
    const vals = fc60 === null || fc70 === null ? undefined : { fc60, fc70 };
    if (total === undefined) return semDado(['semana.minAtiv'], 'nenhum treino registrado', vals);

    const t = total;
    const zona: Zona = t < 150 ? 'pouco' : t <= 300 ? 'meta' : t <= 600 ? 'atencao' : 'demais';
    const proximoPasso =
      t < 150
        ? `faltam ${fmt(150 - t)} min: a caminhada pós-jantar de 10 min × 5 dias fecha ${fmt(Math.min(50, 150 - t))}`
        : t <= 300
          ? 'manter; se quiser mais, até 300 ainda rende'
          : 'acima de 300 o retorno para de crescer — ok, sem ganho extra';

    return aplicarSeguranca('some-150', ctx.perfil, {
      zona,
      valor: t,
      faixa: { pouco: 150, meta: 300, demais: 600 },
      posicao: pos(t, 150, 300),
      texto: `${fmt(t)} min/sem (tiros contam em dobro)`,
      proximoPasso,
      vals,
    });
  },
};
