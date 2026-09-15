import { aplicarSeguranca, diasUltimos, fmt, semDado, semanaAtual, somaUltimos7 } from './_util';
import type { AcaoMeta, Zona } from './tipos';

const ALCOOL_G = 98; // 7 doses/semana × 14 g

export const seBeber: AcaoMeta = {
  id: 'se-beber',
  aplica: (perfil) => perfil.alcool !== 'nao',
  meta(ctx) {
    const n = semanaAtual(ctx)?.alcoolDoses ?? somaUltimos7(ctx, 'alcoolDoses');
    const vals = { alcool_g: ALCOOL_G };
    if (n === undefined) return semDado(['dia.alcoolDoses'], undefined, vals);

    // 4+ doses numa noite é "demais" mesmo que a soma da semana esteja na faixa (regra de segurança).
    const diaExcesso = diasUltimos(ctx, 7).find((d) => typeof d.alcoolDoses === 'number' && d.alcoolDoses >= 4);

    let zona: Zona;
    let texto: string;
    let proximoPasso: string;
    if (diaExcesso) {
      zona = 'demais';
      texto = `4+ doses numa noite: ${fmt(diaExcesso.alcoolDoses as number)} dose(s) em ${diaExcesso.data}`;
      proximoPasso = 'uma dose a menos por semana, começando pelas da noite';
    } else if (n === 0) {
      zona = 'meta';
      texto = `${fmt(n)} doses/sem`;
      proximoPasso = 'zero — manter';
    } else if (n <= 7) {
      zona = 'meta';
      texto = `${fmt(n)} doses/sem`;
      proximoPasso = 'dentro da faixa; nunca nas horas antes de deitar';
    } else {
      zona = 'demais';
      texto = `${fmt(n)} doses/sem`;
      proximoPasso = 'uma dose a menos por semana, começando pelas da noite';
    }

    return aplicarSeguranca('se-beber', ctx.perfil, {
      zona,
      valor: n,
      faixa: { pouco: 0, meta: 7, demais: 7 },
      posicao: diaExcesso || n > 7 ? 0.9 : n === 0 ? 0.12 : 0.5,
      texto,
      proximoPasso,
      vals,
    });
  },
};
