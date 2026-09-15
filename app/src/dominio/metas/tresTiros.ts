import { pos } from '../derivados';
import { aplicarSeguranca, contarSessoes, semDado, semanaAtual } from './_util';
import type { AcaoMeta, Zona } from './tipos';

export const tresTiros: AcaoMeta = {
  id: 'tres-tiros',
  aplica: () => true,
  meta(ctx) {
    const revisao = semanaAtual(ctx);
    const n =
      revisao?.sessoesTiros ??
      (ctx.eventos.length > 0 ? contarSessoes(ctx.eventos, 'tiros', ctx) : undefined);
    if (n === undefined) return semDado(['semana.sessoesTiros'], 'nenhum treino registrado');

    const zona: Zona = n < 2 ? 'pouco' : n <= 3 ? 'meta' : n <= 4 ? 'atencao' : 'demais';
    const proximoPasso =
      n < 2
        ? 'mais 1 sessão esta semana; se o máximo não dá, tiros a 70% já contam'
        : n <= 3
          ? 'manter o protocolo fixo e registrar o RPE'
          : 'tirar 1 sessão e ver se o RPE cai';

    return aplicarSeguranca('tres-tiros', ctx.perfil, {
      zona,
      valor: n,
      faixa: { pouco: 2, meta: 3, demais: 5 },
      posicao: pos(n, 2, 3),
      texto: `${n} ${n === 1 ? 'sessão' : 'sessões'}/sem`,
      proximoPasso,
    });
  },
};
