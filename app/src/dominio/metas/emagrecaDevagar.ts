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

    const idealBruto = 0.005 * w; // 0,5 % por semana — limiar real, sem arredondar
    const maxBruto = 0.01 * w; // 1 % — limiar real, sem arredondar
    const ideal = r1(idealBruto); // só para exibição (faixa, texto)
    const max = r1(maxBruto); // só para exibição (faixa, texto)
    const dl = r1(w0 - w); // perda (positivo = emagreceu)

    // Zona decidida contra os limiares sem arredondar: r1 antes da comparação
    // classificaria 0,5 kg como 'meta' a 90 kg (0,45 → 0,5), quando na
    // verdade já passou do limiar de 0,5 %.
    const zona: Zona = dl <= 0 ? 'pouco' : dl <= idealBruto ? 'meta' : dl <= maxBruto ? 'atencao' : 'demais';
    const delta = dl === 0 ? 'peso estável' : `${dl > 0 ? '−' : '+'}${Math.abs(dl)} kg`;
    const proximoPasso =
      dl <= 0
        ? 'peso estável: não é problema; se quer perder, o déficit moderado está nas Medidas'
        : dl <= idealBruto
          ? 'ritmo certo — panturrilha estável confirma que é gordura'
          : 'rápido demais: não cortar mais nada esta semana; manter proteína e força';

    return aplicarSeguranca('emagreca-devagar', ctx.perfil, {
      zona,
      valor: dl,
      faixa: { pouco: 0, meta: ideal, demais: max },
      posicao: dl <= 0 ? 0.15 : pos(dl, 0, maxBruto),
      texto: `${delta} esta semana (meta até ${ideal} kg)`,
      proximoPasso,
    });
  },
};
