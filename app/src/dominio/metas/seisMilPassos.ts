import { pos } from '../derivados';
import { aplicarSeguranca, deDiaSeNaoHoje, fmt, semDado, ultimoDiaCom } from './_util';
import type { AcaoMeta, Zona } from './tipos';

const META = 5000;

export const seisMilPassos: AcaoMeta = {
  id: 'seis-mil-passos',
  aplica: () => true,
  meta(ctx) {
    const dia = ultimoDiaCom(ctx.dias, 'passos');
    const n = dia?.passos;
    if (dia === undefined || n === undefined) return semDado(['dia.passos']);

    const zona: Zona = n < 2000 ? 'pouco' : n < META ? 'atencao' : 'meta';
    // Spec §6: +500 por semana (a PoC usava +1000); arredonda à centena e nunca passa da meta.
    const proximo = Math.min(META, Math.round((n + 500) / 100) * 100);
    const proximoPasso =
      n < META
        ? `meta desta semana: ${fmt(proximo)} passos/dia (+500)`
        : n <= 7000
          ? 'na meta; 7–10 mil ainda soma'
          : 'acima da inflexão — manter';

    return aplicarSeguranca('seis-mil-passos', ctx.perfil, {
      zona,
      valor: n,
      faixa: { pouco: 2000, meta: META, demais: 10000 },
      posicao: pos(n, 5000, 7000),
      texto: `${fmt(n)} passos/dia`,
      proximoPasso,
      vals: { prox_passos: proximo },
      ...deDiaSeNaoHoje(ctx, dia),
    });
  },
};
