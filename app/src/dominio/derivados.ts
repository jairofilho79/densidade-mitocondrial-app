// Derivados: nunca gravados, calculados a cada chamada (spec §3).
// Fórmulas de perfil transcritas da função D() da PoC
// (docs/brain/poc/acoes-atomicas.template.html); derivados de janela
// (dias parado, médias, jejum, sono, variação) definidos nos contratos.
import type { DataISO, Dia, EventoTreino, Hora, Perfil, Semana } from './tipos';

export interface Derivados {
  imc: number | null; // 1 casa
  fcMax: number | null; // round(208 − 0.7·idade)
  fc60: number | null;
  fc70: number | null;
  fc85: number | null;
  rmr: number | null; // Mifflin-St Jeor, round
  pal: 1.4 | 1.5 | 1.6 | null; // ativ = minAtiv + sessoesTiros·20; <150→1.4, ≤300→1.5, >300→1.6
  tdee: number | null;
  defLo: number | null; // 15 % do tdee
  defHi: number | null; // 25 % do tdee
  aguaMetaL: number; // (H ? 2.0 : 1.6) + min(2, minTreinoHoje/30·0.4), 1 casa
  coposMeta: number; // round(aguaMetaL / 0.25)
  pantCorte: number; // H 34, M 33
  pantGrave: number; // H 32, M 31
  preensaoCorte: number; // H 27, M 16
  corteCintura: number; // H 88, M 84
  diasParado: number; // dias consecutivos (até hoje inclusive) sem moveu===true e sem EventoTreino
  pesoMedioSemana: number | null; // média de dia.peso nos últimos 7 dias, 1 casa
  pesoMedioSemanaAnterior: number | null; // dias 8–14
  fcRepousoMedia7d: number | null;
  jejumHoras: number | null; // jantarFim (dia anterior) → primeiraRefeicao (hoje), 1 casa
  sonoHoras: number | null; // (levantou − deitou) − 0.33, do dia mais recente com ambos
  variacaoDeitarMin: number | null; // desvio-padrão em minutos de deitou nos últimos 7 dias
}

// ---------- utilitários exportados (usados pelos planos 02 e 03) ----------

/** "23:30" → 1410 */
export function horaParaMin(h: Hora): number {
  const [hh, mm] = h.split(':').map(Number);
  return hh * 60 + mm;
}

/** 1410 → "23:30"; normaliza módulo 1440 (−30 → "23:30", 1500 → "01:00"). */
export function minParaHora(m: number): Hora {
  const n = ((Math.round(m) % 1440) + 1440) % 1440;
  const h = Math.floor(n / 60);
  const mi = n % 60;
  return `${String(h).padStart(2, '0')}:${String(mi).padStart(2, '0')}`;
}

/** Horas de `inicio` até `fim`, atravessando a meia-noite se preciso. */
export function horasEntre(inicio: Hora, fim: Hora): number {
  return ((horaParaMin(fim) - horaParaMin(inicio) + 1440) % 1440) / 60;
}

/** 1 casa decimal. */
export function r1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function media(xs: number[]): number | null {
  if (xs.length === 0) return null;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

export function mediana(xs: number[]): number | null {
  if (xs.length === 0) return null;
  const s = [...xs].sort((a, b) => a - b);
  const meio = Math.floor(s.length / 2);
  return s.length % 2 === 1 ? s[meio] : (s[meio - 1] + s[meio]) / 2;
}

/** Posição 0–1 na barra: lo → 0.5, hi → 0.75, limitada a [0.02, 0.98]. */
export function pos(v: number, lo: number, hi: number): number {
  if (hi === lo) return 0.5;
  const p = ((v - lo) / (hi - lo)) * 0.25 + 0.5;
  return Math.min(0.98, Math.max(0.02, p));
}

// ---------- helpers internos ----------

function somarDias(data: DataISO, n: number): DataISO {
  const [ano, mes, dia] = data.split('-').map(Number);
  return new Date(Date.UTC(ano, mes - 1, dia + n)).toISOString().slice(0, 10);
}

function positivo(n: number): boolean {
  return Number.isFinite(n) && n > 0;
}

function numeros(xs: Array<number | null | undefined>): number[] {
  return xs.filter((x): x is number => typeof x === 'number' && Number.isFinite(x));
}

function mediaR1(xs: number[]): number | null {
  const m = media(xs);
  return m === null ? null : r1(m);
}

function noIntervalo(dias: Dia[], de: DataISO, ate: DataISO): Dia[] {
  return dias.filter((d) => d.data >= de && d.data <= ate);
}

const TETO_DIAS_PARADO = 28;

function calcularDiasParado(dias: Dia[], eventos: EventoTreino[], hoje: DataISO): number {
  const datasComMovimento = new Set<DataISO>();
  for (const e of eventos) datasComMovimento.add(e.data);
  for (const d of dias) if (d.moveu === true) datasComMovimento.add(d.data);

  const datasRegistradas = [...dias.map((d) => d.data), ...eventos.map((e) => e.data)].filter((x) => x <= hoje);
  if (datasRegistradas.length === 0) return 0;
  const maisAntiga = datasRegistradas.reduce((a, b) => (a < b ? a : b));

  let n = 0;
  let data = hoje;
  while (data >= maisAntiga && n < TETO_DIAS_PARADO) {
    if (datasComMovimento.has(data)) break;
    n += 1;
    data = somarDias(data, -1);
  }
  return n;
}

function calcularVariacaoDeitar(dias7: Dia[]): number | null {
  const minutos = numeros(dias7.map((d) => (d.deitou === undefined ? undefined : horaParaMin(d.deitou))))
    // Deitar depois da meia-noite (00:30) fica perto de 23:30, não de 06:00.
    .map((m) => (m < 720 ? m + 1440 : m));
  if (minutos.length < 2) return null;
  const m = minutos.reduce((a, b) => a + b, 0) / minutos.length;
  const variancia = minutos.reduce((a, b) => a + (b - m) ** 2, 0) / minutos.length;
  return r1(Math.sqrt(variancia));
}

// ---------- derivar ----------

export function derivar(perfil: Perfil, dias: Dia[], eventos: EventoTreino[], semana: Semana | undefined, hoje: DataISO): Derivados {
  const homem = perfil.sexo !== 'M';
  const peso = positivo(perfil.peso) ? perfil.peso : null;
  const altura = positivo(perfil.altura) ? perfil.altura : null;
  const idade = positivo(perfil.idade) ? perfil.idade : null;

  const imc = peso !== null && altura !== null ? r1(peso / (altura / 100) ** 2) : null;

  const fcMax = idade !== null ? Math.round(208 - 0.7 * idade) : null;
  const fc60 = fcMax !== null ? Math.round(fcMax * 0.6) : null;
  const fc70 = fcMax !== null ? Math.round(fcMax * 0.7) : null;
  const fc85 = fcMax !== null ? Math.round(fcMax * 0.85) : null;

  let rmr: number | null = null;
  let pal: Derivados['pal'] = null;
  let tdee: number | null = null;
  let defLo: number | null = null;
  let defHi: number | null = null;
  if (peso !== null && altura !== null && idade !== null) {
    rmr = Math.round(10 * peso + 6.25 * altura - 5 * idade + (homem ? 5 : -161));
    const ativ = (semana?.minAtiv ?? 0) + (semana?.sessoesTiros ?? 0) * 20;
    pal = ativ < 150 ? 1.4 : ativ <= 300 ? 1.5 : 1.6;
    tdee = Math.round(rmr * pal);
    defLo = Math.round(tdee * 0.15);
    defHi = Math.round(tdee * 0.25);
  }

  const minTreinoHoje = eventos.filter((e) => e.data === hoje).reduce((soma, e) => soma + e.minutos, 0);
  const aguaMetaL = r1((homem ? 2.0 : 1.6) + Math.min(2, (minTreinoHoje / 30) * 0.4));
  const coposMeta = Math.round(aguaMetaL / 0.25);

  const ultimos7 = noIntervalo(dias, somarDias(hoje, -6), hoje);
  const anteriores7 = noIntervalo(dias, somarDias(hoje, -13), somarDias(hoje, -7));

  const diaHoje = dias.find((d) => d.data === hoje);
  const diaOntem = dias.find((d) => d.data === somarDias(hoje, -1));
  let jejumHoras: number | null = null;
  if (diaHoje?.primeiraRefeicao !== undefined && diaOntem?.jantarFim !== undefined) {
    jejumHoras = r1(horasEntre(diaOntem.jantarFim, diaHoje.primeiraRefeicao));
  }

  const comSono = dias
    .filter((d) => d.data <= hoje && d.deitou !== undefined && d.levantou !== undefined)
    .sort((a, b) => (a.data < b.data ? 1 : a.data > b.data ? -1 : 0));
  const maisRecente: Dia | undefined = comSono.length > 0 ? comSono[0] : undefined;
  let sonoHoras: number | null = null;
  if (maisRecente !== undefined && maisRecente.deitou !== undefined && maisRecente.levantou !== undefined) {
    sonoHoras = r1(horasEntre(maisRecente.deitou, maisRecente.levantou) - 0.33);
  }

  return {
    imc,
    fcMax,
    fc60,
    fc70,
    fc85,
    rmr,
    pal,
    tdee,
    defLo,
    defHi,
    aguaMetaL,
    coposMeta,
    pantCorte: homem ? 34 : 33,
    pantGrave: homem ? 32 : 31,
    preensaoCorte: homem ? 27 : 16,
    corteCintura: homem ? 88 : 84,
    diasParado: calcularDiasParado(dias, eventos, hoje),
    pesoMedioSemana: mediaR1(numeros(ultimos7.map((d) => d.peso))),
    pesoMedioSemanaAnterior: mediaR1(numeros(anteriores7.map((d) => d.peso))),
    fcRepousoMedia7d: mediaR1(numeros(ultimos7.map((d) => d.fcRepouso))),
    jejumHoras,
    sonoHoras,
    variacaoDeitarMin: calcularVariacaoDeitar(ultimos7),
  };
}
