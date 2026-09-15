// Tipos de dados do domínio. Uma interface por tabela (spec §3).
// Fonte: docs/superpowers/plans/2026-09-14-fornalha-00-contratos.md — não renomear.

export type Sexo = 'H' | 'M';
export type Hora = string; // "HH:MM" 24 h
export type DataISO = string; // "YYYY-MM-DD"
export type SemanaISO = string; // "YYYY-Www"
export type MesISO = string; // "YYYY-MM"
export type Fonte = 'manual' | 'health';

export interface Perfil {
  peso: number; // kg
  altura: number; // cm
  idade: number; // anos
  sexo: Sexo;
  levantar: Hora;
  deitar: Hora;
  cafe: 'nao' | 'as-vezes' | 'diario';
  alcool: 'nao' | 'as-vezes' | 'regular';
  remedios: Array<'glicemia' | 'pressao' | 'tireoide' | 'outro'>;
  fuma: 'nao' | 'sim' | 'parou';
  parouEm?: DataISO;
  examesQueTem: string[];
  atualizadoEm: string; // ISO datetime
}

export interface Dia {
  data: DataISO;
  deitou?: Hora;
  levantou?: Hora;
  comoAcordei?: 1 | 2 | 3 | 4 | 5;
  fome?: number; // 1–10, do dia anterior
  comiSemFome?: boolean;
  ultimoCafe?: Hora | null; // undefined = não registrou; null = não tomou
  jantarFim?: Hora;
  passos?: number;
  moveu?: boolean;
  primeiraRefeicao?: Hora;
  maiorBloco?: number; // min
  minPosJantar?: number;
  copos?: number; // 250 ml
  proteinaG?: number;
  fibraG?: number;
  refeicoesCozinhadas?: number; // 0–3
  bebidaDoce?: number;
  alcoolDoses?: number | null; // null = não bebeu
  levantadas?: number; // contagem do botão "Levantei"
  peso?: number;
  fcRepouso?: number;
  notas?: string;
  fonte?: Partial<Record<keyof Dia, Fonte>>;
  atualizadoEm: string;
}

export interface EventoTreino {
  id: string; // uuid
  data: DataISO;
  hora: Hora;
  tipo: 'tiros' | 'forca' | 'moderado';
  minutos: number;
  tiros?: number;
  tiroTravou?: number; // em qual tiro travou
  rpe?: number; // 0–10
  fc1min?: number;
  calor?: boolean;
  jejum?: boolean;
  atualizadoEm: string;
}

export interface EventoRefeicao {
  id: string;
  data: DataISO;
  hora: Hora;
  proteinaG?: number;
  fibraG?: number;
  cozinhada?: boolean;
  comecouPelaFibra?: boolean; // dado para Q26; nunca interpretado na v1
  atualizadoEm: string;
}

export interface Semana {
  semana: SemanaISO;
  cintura?: number; // cm
  sessoesTiros?: number;
  sessoesForca?: number;
  minAtiv?: number; // min moderados na semana (sem contar tiros)
  maiorBlocoTipico?: number;
  alcoolDoses?: number;
  docesSemana?: number;
  atualizadoEm: string;
}

export interface Mes {
  mes: MesISO;
  panturrilha?: number; // cm
  preensao?: number; // kg
  repsAteFalhar?: number;
  atualizadoEm: string;
}

export interface Exame {
  data: DataISO;
  glicemia?: number;
  hba1c?: number;
  homaIr?: number;
  tg?: number;
  hdl?: number;
  ferritina?: number;
  b12?: number;
  vitD?: number;
  paSistolica?: number;
  paDiastolica?: number;
  atualizadoEm: string;
}
