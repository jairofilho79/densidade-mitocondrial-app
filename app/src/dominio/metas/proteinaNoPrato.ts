import { pos, r1 } from '../derivados';
import { aplicarSeguranca, deDiaSeNaoHoje, fmt, semDado, ultimoDiaCom } from './_util';
import type { AcaoMeta, Zona } from './tipos';

export const proteinaNoPrato: AcaoMeta = {
  id: 'proteina-no-prato',
  aplica: () => true,
  meta(ctx) {
    const w = ctx.perfil.peso;
    if (!w) return semDado(['perfil.peso'], 'precisa do peso no perfil');

    const pouco = Math.round(0.8 * w);
    const lo = Math.round(1.2 * w);
    const hi = Math.round(1.6 * w);
    const max = Math.round(2.2 * w);
    const vals = { peso: w, prot_pouco: pouco, prot_min: lo, prot_max: hi, prot_max2: max };

    const dia = ultimoDiaCom(ctx.dias, 'proteinaG');
    const g = dia?.proteinaG;
    if (dia === undefined || g === undefined) return semDado(['dia.proteinaG'], undefined, vals);

    const zona: Zona = g < pouco ? 'pouco' : g < lo ? 'atencao' : g <= max ? 'meta' : 'demais';
    const proximoPasso =
      g < lo
        ? `mais 10 g/dia (${fmt(Math.min(g + 10, lo))} g): um ovo ≈ 6 g, 100 g de frango ≈ 30 g, uma dose de whey ≈ 25 g`
        : g > max
          ? 'acima do que traz benefício; pode reduzir'
          : 'na meta';

    return aplicarSeguranca('proteina-no-prato', ctx.perfil, {
      zona,
      valor: g,
      faixa: { pouco, meta: lo, demais: max },
      posicao: pos(g, lo, hi),
      texto: `${fmt(g)} g/dia (${fmt(r1(g / w))} g/kg)`,
      proximoPasso,
      vals,
      ...deDiaSeNaoHoje(ctx, dia),
    });
  },
};
