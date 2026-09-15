import type { AcaoId } from './catalogo/tipos';
import type { Perfil } from './tipos';

function frase(motivos: string[]): string | undefined {
  if (motivos.length === 0) return undefined;
  return `Você marcou ${motivos.join(' e ')} no perfil — converse com quem te acompanha antes de mudar isso.`;
}

/**
 * Regras (contrato 00):
 * - 'tres-tiros': remedios inclui 'pressao' ou fuma === 'sim'
 * - 'feche-a-cozinha' e 'emagreca-devagar': remedios inclui 'glicemia' ou 'tireoide'
 * Demais ações: nunca.
 */
export function avisoSeguranca(id: AcaoId, perfil: Perfil): string | undefined {
  if (id === 'tres-tiros') {
    const motivos: string[] = [];
    if (perfil.remedios.includes('pressao')) motivos.push('remédio para pressão');
    if (perfil.fuma === 'sim') motivos.push('que fuma');
    return frase(motivos);
  }
  if (id === 'feche-a-cozinha' || id === 'emagreca-devagar') {
    const motivos: string[] = [];
    if (perfil.remedios.includes('glicemia')) motivos.push('remédio para glicemia');
    if (perfil.remedios.includes('tireoide')) motivos.push('remédio para tireoide');
    return frase(motivos);
  }
  return undefined;
}
