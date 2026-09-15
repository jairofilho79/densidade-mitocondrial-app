// Ponto de entrada do catálogo. `acoes.json` é gerado por scripts/sync-catalogo.mjs —
// nunca edite a cópia; edite docs/brain/acoes/acoes.json e rode `pnpm sync-catalogo`.
import acoesJson from './acoes.json';
import type { AcaoCatalogo, AcaoId, Catalogo } from './tipos';

export const catalogo: Catalogo = acoesJson as Catalogo;

export function acaoDoCatalogo(id: AcaoId): AcaoCatalogo {
  const acao = catalogo.acoes.find((a) => a.id === id);
  if (!acao) throw new Error(`Ação '${id}' não existe no catálogo.`);
  return acao;
}
