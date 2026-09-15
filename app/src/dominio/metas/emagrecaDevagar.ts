import { pos, r1 } from '../derivados';
import { aplicarSeguranca, fmt, semDado } from './_util';
import type { AcaoMeta, Zona } from './tipos';

export const emagrecaDevagar: AcaoMeta = {
  id: 'emagreca-devagar',
  aplica: () => true,
  meta(ctx) {
    const w = ctx.derivados.pesoMedioSemana;
    const w0 = ctx.derivados.pesoMedioSemanaAnterior;

    const idealBruto = w === null ? null : 0.005 * w; // 0,5 % por semana — limiar real, sem arredondar
    const maxBruto = w === null ? null : 0.01 * w; // 1 % — limiar real, sem arredondar
    const vals =
      w === null || idealBruto === null || maxBruto === null
        ? undefined
        : { peso: w, perda_ideal: fmt(idealBruto, 2), perda_max: fmt(maxBruto, 2) };

    if (w === null || w0 === null || idealBruto === null || maxBruto === null) {
      return semDado(['dia.peso'], 'precisa do peso em duas semanas seguidas', vals);
    }

    const dl = r1(w0 - w); // perda (positivo = emagreceu)

    // Zona decidida contra os limiares sem arredondar: comparar com dl (já r1) contra idealBruto/maxBruto
    // sem arredondar — r1(idealBruto) classificaria 0,5 kg como 'meta' a 90 kg (0,45 → 0,5), quando na
    // verdade já passou do limiar de 0,5 %.
    const zona: Zona = dl < 0 ? 'atencao' : dl === 0 ? 'pouco' : dl <= idealBruto ? 'meta' : dl <= maxBruto ? 'atencao' : 'demais';

    const idealFmt = fmt(idealBruto, 2);
    let texto: string;
    let deltaPeso: string;
    let proximoPasso: string;
    if (dl < 0) {
      deltaPeso = `+${fmt(-dl)} kg`;
      texto = 'a balança engana nas primeiras semanas — água do glicogênio; olhe a média de 2–3 semanas';
      proximoPasso = 'manter o plano; comparar a média da próxima semana';
    } else if (dl === 0) {
      deltaPeso = 'peso estável';
      texto = `peso estável esta semana (meta até ${idealFmt} kg)`;
      proximoPasso = 'peso estável: não é problema; se quer perder, o déficit moderado está nas Medidas';
    } else {
      deltaPeso = `−${fmt(dl)} kg`;
      texto = `${deltaPeso} esta semana (meta até ${idealFmt} kg)`;
      proximoPasso =
        dl <= idealBruto
          ? 'ritmo certo — panturrilha estável confirma que é gordura'
          : dl <= maxBruto
            ? 'um pouco rápido: manter proteína e força; não cortar mais nada'
            : 'rápido demais: não cortar mais nada esta semana; manter proteína e força';
    }

    return aplicarSeguranca('emagreca-devagar', ctx.perfil, {
      zona,
      valor: dl,
      faixa: { pouco: 0, meta: idealBruto, demais: maxBruto },
      posicao: dl < 0 ? 0.05 : dl === 0 ? 0.15 : pos(dl, 0, maxBruto),
      texto,
      proximoPasso,
      vals: { peso: w, perda_ideal: idealFmt, perda_max: fmt(maxBruto, 2), delta_peso: deltaPeso },
    });
  },
};
