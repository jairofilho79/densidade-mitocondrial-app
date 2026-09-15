import type { CampoId } from '../campos';
import type { AcaoId } from '../catalogo/tipos';
import type { Derivados } from '../derivados';
import type { DataISO, Dia, EventoRefeicao, EventoTreino, Mes, Perfil, Semana } from '../tipos';

export type Zona = 'pouco' | 'atencao' | 'meta' | 'demais' | 'sem-dado';

export interface Contexto {
  perfil: Perfil;
  hoje: Dia | undefined;
  dias: Dia[];                 // últimos 28, mais recente primeiro; dias[0] pode ser hoje
  eventos: EventoTreino[];     // mesma janela, mais recente primeiro
  refeicoes: EventoRefeicao[];
  semana: Semana | undefined;  // a mais recente
  mes: Mes | undefined;
  derivados: Derivados;
  agora: Date;
}

export interface Faixa {
  pouco: number;
  meta: number;
  demais: number;
}

export interface Meta {
  zona: Zona;
  valor: number | null;
  faixa: Faixa | null;
  posicao: number | null;      // 0–1
  texto: string;
  proximoPasso: string;
  precisaDe?: CampoId[];
  seguranca?: string;
  deDia?: DataISO;             // de que dia é o valor, quando não é hoje
  vals?: Record<string, string | number>; // placeholders de faixa.pouco/ideal/demais/regra do catálogo
}

export interface AcaoMeta {
  id: AcaoId;
  aplica(perfil: Perfil): boolean;
  meta(ctx: Contexto): Meta;
}
