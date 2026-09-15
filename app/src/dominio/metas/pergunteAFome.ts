import { aplicarSeguranca, semDado } from './_util';
import type { AcaoMeta } from './tipos';

/** Hábito de registro: meta = respondeu hoje (fome 1–10 e "comi sem fome?"). */
export const pergunteAFome: AcaoMeta = {
  id: 'pergunte-a-fome',
  aplica: () => true,
  meta(ctx) {
    const hoje = ctx.hoje;
    if (hoje === undefined || hoje.fome === undefined || hoje.comiSemFome === undefined) {
      return semDado(['dia.fome', 'dia.comiSemFome'], 'sem registro hoje');
    }
    return aplicarSeguranca('pergunte-a-fome', ctx.perfil, {
      zona: 'meta',
      valor: null,
      faixa: null,
      posicao: null,
      texto: 'registrado',
      proximoPasso: 'manter o registro diário',
    });
  },
};
