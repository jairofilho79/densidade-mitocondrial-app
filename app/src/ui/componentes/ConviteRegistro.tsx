import type { Campo } from '@/dominio/campos';
import type { AcaoId } from '@/dominio/catalogo/tipos';
import { acaoDoCatalogo } from '@/dominio/catalogo';
import { listar } from '@/ui/formato';
import './componentes.css';

export interface ConviteRegistroProps {
  campos: Campo[];
  /** true quando os campos só desbloqueiam ações semanais (tres-tiros, levante-peso, some-150, troque-o-doce, se-beber). */
  semanal?: boolean;
  /** Títulos de reserva quando `campos` vem vazio no caso semanal (o CardAcao preenche com o título da própria ação). */
  titulos?: string[];
}

function titulosDesbloqueados(campos: Campo[]): string[] {
  const ids: AcaoId[] = [];
  for (const c of campos) for (const id of c.desbloqueia) if (!ids.includes(id)) ids.push(id);
  return ids.map((id) => acaoDoCatalogo(id).titulo);
}

/** "Registre X e Y e eu te digo onde você está em A e B." (ADR-002) */
export function ConviteRegistro({ campos, semanal = false, titulos }: ConviteRegistroProps) {
  if (semanal) {
    const nomes = titulosDesbloqueados(campos);
    const alvos = nomes.length > 0 ? nomes : (titulos ?? []);
    const frase = alvos.length > 0
      ? `Registre um treino (botão Treinei) ou a revisão de segunda e eu te digo onde você está em ${listar(alvos)}.`
      : 'Registre um treino (botão Treinei) ou a revisão de segunda.';
    return <p className="convite">{frase}</p>;
  }
  if (campos.length === 0) return null;
  const rotulos = campos.map((c) => c.rotulo.toLowerCase());
  const titulosDesbloqueio = titulosDesbloqueados(campos);
  const frase = titulosDesbloqueio.length > 0
    ? `Registre ${listar(rotulos)} e eu te digo onde você está em ${listar(titulosDesbloqueio)}.`
    : `Registre ${listar(rotulos)}.`;
  return <p className="convite">{frase}</p>;
}
