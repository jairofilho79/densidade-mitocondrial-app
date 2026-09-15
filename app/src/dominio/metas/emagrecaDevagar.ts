import { pos, r1 } from '../derivados';
import { aplicarSeguranca, semDado } from './_util';
import type { AcaoMeta, Zona } from './tipos';

export const emagrecaDevagar: AcaoMeta = {
  id: 'emagreca-devagar',
  aplica: () => true,
  meta(ctx) {
    const w = ctx.derivados.pesoMedioSemana;
    const w0 = ctx.derivados.pesoMedioSemanaAnterior;
    if (w === null || w0 === null) return semDado(['dia.peso'], 'precisa do peso em duas semanas seguidas');

    const ideal = r1(0.005 * w); // 0,5 % por semana
    const max = r1(0.01 * w); // 1 %
    const dl = r1(w0 - w); // perda (positivo = emagreceu)

    const zona: Zona = dl <= 0 ? 'pouco' : dl <= ideal ? 'meta' : dl <= max ? 'atencao' : 'demais';
    const delta = dl === 0 ? 'peso estável' : `${dl > 0 ? '−' : '+'}${Math.abs(dl)} kg`;
    const proximoPasso =
      dl <= 0
        ? 'peso estável: não é problema; se quer perder, o déficit moderado está nas Medidas'
        : dl <= ideal
          ? 'ritmo certo — panturrilha estável confirma que é gordura'
          : 'rápido demais: não cortar mais nada esta semana; manter proteína e força';

    return aplicarSeguranca('emagreca-devagar', ctx.perfil, {
      zona,
      valor: dl,
      faixa: { pouco: 0, meta: ideal, demais: max },
      posicao: dl <= 0 ? 0.15 : pos(dl, 0, max),
      texto: `${delta} esta semana (meta até ${ideal} kg)`,
      proximoPasso,
    });
  },
};
