import { pos } from '../derivados';
import { aplicarSeguranca, contarSessoes7, fmt, semDado, semanaAtual } from './_util';
import type { AcaoMeta, Zona } from './tipos';

export const levantePeso: AcaoMeta = {
  id: 'levante-peso',
  aplica: () => true,
  meta(ctx) {
    const revisao = semanaAtual(ctx);
    const n =
      revisao?.sessoesForca ??
      (ctx.eventos.length > 0 ? contarSessoes7(ctx, 'forca') : undefined);
    if (n === undefined) return semDado(['semana.sessoesForca'], 'nenhum treino registrado');

    const zona: Zona = n < 1 ? 'pouco' : n < 2 ? 'atencao' : n <= 3 ? 'meta' : 'demais';
    const proximoPasso =
      n < 2
        ? 'uma sessão de 20 min em casa nesta semana: agachamento, flexão, remada'
        : n <= 3
          ? 'anotar repetições até falhar num exercício fixo'
          : 'garantir 48 h entre sessões do mesmo grupo';

    return aplicarSeguranca('levante-peso', ctx.perfil, {
      zona,
      valor: n,
      faixa: { pouco: 1, meta: 2, demais: 3 },
      posicao: pos(n, 2, 3),
      texto: `${fmt(n)} ${n === 1 ? 'sessão' : 'sessões'}/sem`,
      proximoPasso,
    });
  },
};
