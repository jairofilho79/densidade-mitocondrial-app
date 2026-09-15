import type { DataISO, Dia, Perfil } from '../tipos';
import type { CampoId } from '../campos';
import { horaParaMin, horasEntre, media, mediana, minParaHora, r1, somarDias } from '../derivados';

export type FraseTipo = 'sono-fome' | 'sono-comer-sem-fome' | 'cafe-sono';
export interface Frase { tipo: FraseTipo; texto: string; n: number; nComparacao?: number; }
export type Tendencia =
  | { pronta: false; faltam: number; precisaDe: CampoId[]; oQueVaiDizer: string }
  | { pronta: true; baseline: number; frases: Frase[] };

const MIN_CHECKINS = 7;
const MIN_NOITES_NORMAIS = 5;
const MIN_N_FRASE = 3;          // abaixo disso a frase é omitida (ou, no sono-fome, vira "ainda poucas")
const SONO_CURTO_H = 6;         // < 6 h = noite curta
const SONO_NORMAL_H = 7;        // ≥ 7 h = noite normal
const LATENCIA_H = 0.33;        // ~20 min entre deitar e dormir, descontados do sono
const CORTE_CAFE_MIN = 540;     // café "tarde" = depois de (deitar − 9 h)

const PRECISA_DE: CampoId[] = ['dia.deitou', 'dia.levantou', 'dia.fome'];

/**
 * Convenção de registro (contratos): os campos do dia D descrevem o dia D, EXCETO
 * `fome`/`comiSemFome` (descrevem o dia anterior, D−1: o check-in é de manhã) e
 * `deitou`/`levantou` (descrevem a noite D−1→D).
 *
 * Logo:
 * - a fome sentida no dia após a noite registrada em D está no registro D+1;
 * - o café tomado no dia D afeta a noite D→D+1, cujo sono está no registro D+1.
 */
interface Noite {
  dia: Dia;
  sono: number;                // horas, já descontada a latência
  seguinte: Dia | undefined;   // registro de D+1 (pode faltar)
}

/** Dia seguinte a `d` (D → D+1). */
function diaSeguinte(d: DataISO): DataISO {
  return somarDias(d, 1);
}

function sonoDe(d: Dia | undefined): number | undefined {
  if (!d || d.deitou === undefined || d.levantou === undefined) return undefined;
  return horasEntre(d.deitou, d.levantou) - LATENCIA_H;
}

function oQueVaiDizer(perfil: Perfil): string {
  const base =
    `Com ${MIN_CHECKINS} check-ins da manhã (deitei, levantei e fome de ontem), ` +
    `sendo ${MIN_NOITES_NORMAIS} com ${SONO_NORMAL_H} h ou mais de sono, vou dizer: ` +
    `quanto sua fome muda nos dias após dormir menos de ${SONO_CURTO_H} h; ` +
    `se você come sem fome mais vezes nesses dias`;
  return perfil.cafe === 'nao' ? `${base}.` : `${base}; e se o café tarde encurta seu sono.`;
}

export function sonoFomeCafe(dias: Dia[], perfil: Perfil): Tendencia {
  const porData = new Map(dias.map((d) => [d.data, d]));
  const ordenados = [...dias].sort((a, b) => (a.data < b.data ? -1 : 1));

  const checkins: Noite[] = ordenados
    .filter((d) => d.deitou !== undefined && d.levantou !== undefined && d.fome !== undefined)
    .map((d) => ({ dia: d, sono: sonoDe(d) as number, seguinte: porData.get(diaSeguinte(d.data)) }));
  const normais = checkins.filter((n) => n.sono >= SONO_NORMAL_H);

  if (checkins.length < MIN_CHECKINS || normais.length < MIN_NOITES_NORMAIS) {
    return {
      pronta: false,
      faltam: Math.max(MIN_CHECKINS - checkins.length, MIN_NOITES_NORMAIS - normais.length),
      precisaDe: PRECISA_DE,
      oQueVaiDizer: oQueVaiDizer(perfil),
    };
  }

  const curtas = checkins.filter((n) => n.sono < SONO_CURTO_H);

  const baseline = mediana(fomeSeguinte(normais));
  if (baseline === null) {
    // Há noites normais, mas nenhuma tem o dia seguinte registrado com fome: falta 1 check-in.
    return { pronta: false, faltam: 1, precisaDe: PRECISA_DE, oQueVaiDizer: oQueVaiDizer(perfil) };
  }

  const frases: Frase[] = [fraseSonoFome(curtas, baseline)];
  const comerSemFome = fraseComerSemFome(curtas, normais);
  if (comerSemFome) frases.push(comerSemFome);
  const cafe = fraseCafeSono(ordenados, porData, perfil);
  if (cafe) frases.push(cafe);

  return { pronta: true, baseline, frases };
}

/** Fome registrada no dia seguinte a cada noite (isto é, a fome sentida no dia após a noite). */
function fomeSeguinte(noites: Noite[]): number[] {
  return noites.map((n) => n.seguinte?.fome).filter((f): f is number => typeof f === 'number');
}

/** "+2,5" / "−1,0": sinal sempre presente, 1 casa, vírgula decimal. */
function comSinal(n: number): string {
  const sinal = n >= 0 ? '+' : '−';
  return `${sinal}${Math.abs(n).toFixed(1).replace('.', ',')}`;
}

function fraseSonoFome(curtas: Noite[], baseline: number): Frase {
  const fomes = fomeSeguinte(curtas);
  if (fomes.length < MIN_N_FRASE) {
    return { tipo: 'sono-fome', texto: `Ainda poucas noites curtas para comparar (n = ${fomes.length}).`, n: fomes.length };
  }
  const delta = r1((media(fomes) as number) - baseline);
  const direcao = delta >= 0 ? 'acima' : 'abaixo';
  return {
    tipo: 'sono-fome',
    texto: `Nos dias após dormir menos de ${SONO_CURTO_H} h, sua fome ficou ${comSinal(delta)} ${direcao} do seu normal (n = ${fomes.length}).`,
    n: fomes.length,
  };
}

/** `comiSemFome` registrado no dia seguinte a cada noite (isto é, se comeu sem fome no dia após a noite). */
function comiSemFomeSeguinte(noites: Noite[]): boolean[] {
  return noites.map((n) => n.seguinte?.comiSemFome).filter((v): v is boolean => typeof v === 'boolean');
}

function fraseComerSemFome(curtas: Noite[], normais: Noite[]): Frase | undefined {
  const emCurtas = comiSemFomeSeguinte(curtas);
  if (emCurtas.length < MIN_N_FRASE) return undefined;
  const emNormais = comiSemFomeSeguinte(normais);
  const simCurtas = emCurtas.filter(Boolean).length;
  const simNormais = emNormais.filter(Boolean).length;
  return {
    tipo: 'sono-comer-sem-fome',
    texto: `Comeu sem fome em ${simCurtas} de ${emCurtas.length} noites curtas vs ${simNormais} de ${emNormais.length} normais.`,
    n: emCurtas.length,
    nComparacao: emNormais.length,
  };
}

interface DiaComCafe {
  ultimoCafe: string | null;   // string = hora do último café; null = não tomou
  sonoSeguinte: number;        // sono da noite D→D+1, lido do registro D+1
}

/** Dias com `ultimoCafe` registrado (string ou null) cujo dia seguinte tem sono. */
function diasComCafe(ordenados: Dia[], porData: Map<DataISO, Dia>): DiaComCafe[] {
  const lista: DiaComCafe[] = [];
  for (const d of ordenados) {
    if (d.ultimoCafe === undefined) continue;
    const sonoSeguinte = sonoDe(porData.get(diaSeguinte(d.data)));
    if (sonoSeguinte === undefined) continue;
    lista.push({ ultimoCafe: d.ultimoCafe, sonoSeguinte });
  }
  return lista;
}

/** Minutos de sono a menos no grupo `menos` em relação ao grupo `mais` (positivo = dormiu menos). */
function minutosAMenos(menos: DiaComCafe[], mais: DiaComCafe[]): number {
  const mMais = media(mais.map((d) => d.sonoSeguinte)) as number;
  const mMenos = media(menos.map((d) => d.sonoSeguinte)) as number;
  return Math.round((mMais - mMenos) * 60);
}

function fraseCafeSono(ordenados: Dia[], porData: Map<DataISO, Dia>, perfil: Perfil): Frase | undefined {
  if (perfil.cafe === 'nao') return undefined;
  const dias = diasComCafe(ordenados, porData);

  if (perfil.cafe === 'diario') {
    // Corte pessoal = deitar − 9 h, normalizado para 0–1439 (deitar 00:30 → 15:30).
    const corte = (((horaParaMin(perfil.deitar) - CORTE_CAFE_MIN) % 1440) + 1440) % 1440;
    const comHora = dias.filter((d): d is DiaComCafe & { ultimoCafe: string } => typeof d.ultimoCafe === 'string');
    const depois = comHora.filter((d) => horaParaMin(d.ultimoCafe) > corte);
    const antes = comHora.filter((d) => horaParaMin(d.ultimoCafe) <= corte);
    if (depois.length < MIN_N_FRASE || antes.length < MIN_N_FRASE) return undefined;
    const m = minutosAMenos(depois, antes);
    const efeito = m > 0 ? `dormiu ${m} min a menos` : 'não dormiu menos';
    return {
      tipo: 'cafe-sono',
      texto: `Nos dias com café depois das ${minParaHora(corte)}, ${efeito} (n = ${depois.length} vs ${antes.length}).`,
      n: depois.length,
      nComparacao: antes.length,
    };
  }

  // 'as-vezes': dias com café (hora registrada) vs dias sem (null)
  const com = dias.filter((d) => typeof d.ultimoCafe === 'string');
  const sem = dias.filter((d) => d.ultimoCafe === null);
  if (com.length < MIN_N_FRASE || sem.length < MIN_N_FRASE) return undefined;
  const m = minutosAMenos(com, sem);
  const efeito = m > 0 ? `dormiu ${m} min a menos` : 'não dormiu menos';
  return {
    tipo: 'cafe-sono',
    texto: `Nas noites após café, ${efeito} (n = ${com.length} com, ${sem.length} sem).`,
    n: com.length,
    nComparacao: sem.length,
  };
}
