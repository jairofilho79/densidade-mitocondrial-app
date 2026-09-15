import { pos, r1 } from '../derivados';
import { aplicarSeguranca, deDiaSeNaoHoje, semDado, ultimoDiaCom } from './_util';
import type { AcaoMeta, Zona } from './tipos';

export const fecheACozinha: AcaoMeta = {
  id: 'feche-a-cozinha',
  aplica: () => true,
  meta(ctx) {
    const h = ctx.derivados.jejumHoras;
    if (h === null) return semDado(['dia.jantarFim', 'dia.primeiraRefeicao']);

    const zona: Zona = h < 12 ? 'pouco' : h < 14 ? 'atencao' : h <= 16 ? 'meta' : h < 20 ? 'atencao' : 'demais';
    const proximoPasso =
      h < 14
        ? `fechar a cozinha 15 min mais cedo, ou abrir 15 min mais tarde (faltam ${Math.ceil((14 - h) * 60)} min para 14 h)`
        : h <= 16
          ? 'manter; bater a proteína na janela'
          : h < 20
            ? `você está em ${r1(h)} h — mais que o testado; se a proteína não fecha, encurte para 16`
            : 'reduzir: acima de 24 h repetido perde músculo';

    const dia = ultimoDiaCom(ctx.dias, 'primeiraRefeicao');
    return aplicarSeguranca('feche-a-cozinha', ctx.perfil, {
      zona,
      valor: r1(h),
      faixa: { pouco: 12, meta: 14, demais: 20 },
      posicao: pos(h, 14, 16),
      texto: `${r1(h)} h de jejum`,
      proximoPasso,
      ...(dia ? deDiaSeNaoHoje(ctx, dia) : {}),
    });
  },
};
