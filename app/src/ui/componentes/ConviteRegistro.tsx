import type { Campo } from '@/dominio/campos';
import type { AcaoId } from '@/dominio/catalogo/tipos';
import { acaoDoCatalogo } from '@/dominio/catalogo';
import { listar } from '@/ui/formato';
import './componentes.css';

export interface ConviteRegistroProps {
  campos: Campo[];
  /** true quando os campos só desbloqueiam ações semanais (tres-tiros, levante-peso, some-150, troque-o-doce, se-beber). */
  semanal?: boolean;
}

/** "Registre X e Y e eu te digo onde você está em A e B." (ADR-002) */
export function ConviteRegistro({ campos, semanal = false }: ConviteRegistroProps) {
  if (semanal) return <p className="convite">registre um treino ou a revisão de segunda.</p>;
  if (campos.length === 0) return null;
  const rotulos = campos.map((c) => c.rotulo.toLowerCase());
  const ids: AcaoId[] = [];
  for (const c of campos) for (const id of c.desbloqueia) if (!ids.includes(id)) ids.push(id);
  const titulos = ids.map((id) => acaoDoCatalogo(id).titulo);
  const frase = titulos.length > 0
    ? `Registre ${listar(rotulos)} e eu te digo onde você está em ${listar(titulos)}.`
    : `Registre ${listar(rotulos)}.`;
  return <p className="convite">{frase}</p>;
}
