import { aplicarSeguranca, diasUltimos, semDado, semanaAtual } from './_util';
import type { AcaoMeta, Zona } from './tipos';

export const seBeber: AcaoMeta = {
  id: 'se-beber',
  aplica: (perfil) => perfil.alcool !== 'nao',
  meta(ctx) {
    let n = semanaAtual(ctx)?.alcoolDoses;
    if (n === undefined) {
      const comRegistro = diasUltimos(ctx, 7).filter((d) => d.alcoolDoses !== undefined);
      if (comRegistro.length > 0) n = comRegistro.reduce((s, d) => s + (d.alcoolDoses ?? 0), 0); // null = não bebeu
    }
    if (n === undefined) return semDado(['dia.alcoolDoses']);

    const zona: Zona = n === 0 ? 'meta' : n <= 7 ? 'atencao' : 'demais';
    const proximoPasso =
      n === 0
        ? 'zero — manter'
        : n <= 7
          ? 'dentro da faixa; nunca nas horas antes de deitar'
          : 'uma dose a menos por semana, começando pelas da noite';

    return aplicarSeguranca('se-beber', ctx.perfil, {
      zona,
      valor: n,
      faixa: { pouco: 0, meta: 7, demais: 7 },
      posicao: n === 0 ? 0.12 : n <= 7 ? 0.5 : 0.9,
      texto: `${n} doses/sem`,
      proximoPasso,
    });
  },
};
