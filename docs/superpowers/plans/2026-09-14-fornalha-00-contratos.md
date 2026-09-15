# Fornalha — contratos compartilhados entre os planos

Este arquivo define os nomes, tipos e assinaturas que os quatro planos (01 base do domínio, 02 metas, 03 tendência + dados, 04 UI + PWA) usam. **Nenhum plano pode renomear o que está aqui.** Se um plano precisar de algo novo, acrescenta — não altera.

Spec: `docs/superpowers/specs/2026-09-14-fornalha-app-design.md`
Fonte das regras numéricas: PoC em `docs/brain/poc/` (funções `D()` e `CALC` transcritas no plano 02).

## Projeto

- Pasta `app/` na raiz do repo. `pnpm` como gerenciador. Node ≥ 20.
- Vite 6 + React 19 + TypeScript 5 (strict). Vitest 3 + `@testing-library/react` + `jsdom`. Dexie 4 + `dexie-react-hooks`. `fake-indexeddb` nos testes. `vite-plugin-pwa`. ESLint flat config (`typescript-eslint`).
- Alias `@/` → `app/src/`.
- Idioma do código: identificadores em português sem acento (`proteinaG`, `comoAcordei`); textos ao usuário em português com acento.
- Regra de dependência: `src/dominio/**` não importa de `src/dados`, `src/ui`, `src/app`, `react`, `dexie`. Teste com `eslint-plugin-import` regra `no-restricted-paths` (plano 01).
- Commits pequenos, mensagem em português, prefixo `feat:`/`test:`/`chore:`/`fix:`.

## `src/dominio/tipos.ts`

```ts
export type Sexo = 'H' | 'M';
export type Hora = string;            // "HH:MM" 24 h
export type DataISO = string;         // "YYYY-MM-DD"
export type SemanaISO = string;       // "YYYY-Www"
export type MesISO = string;          // "YYYY-MM"
export type Fonte = 'manual' | 'health';

export interface Perfil {
  peso: number;                // kg
  altura: number;              // cm
  idade: number;               // anos
  sexo: Sexo;
  levantar: Hora;
  deitar: Hora;
  cafe: 'nao' | 'as-vezes' | 'diario';
  alcool: 'nao' | 'as-vezes' | 'regular';
  remedios: Array<'glicemia' | 'pressao' | 'tireoide' | 'outro'>;
  fuma: 'nao' | 'sim' | 'parou';
  parouEm?: DataISO;
  examesQueTem: string[];
  atualizadoEm: string;        // ISO datetime
}

export interface Dia {
  data: DataISO;
  deitou?: Hora;
  levantou?: Hora;
  comoAcordei?: 1 | 2 | 3 | 4 | 5;
  fome?: number;               // 1–10, do dia anterior
  comiSemFome?: boolean;
  ultimoCafe?: Hora | null;    // undefined = não registrou; null = não tomou
  jantarFim?: Hora;
  passos?: number;
  moveu?: boolean;
  primeiraRefeicao?: Hora;
  maiorBloco?: number;         // min
  minPosJantar?: number;
  copos?: number;              // 250 ml
  proteinaG?: number;
  fibraG?: number;
  refeicoesCozinhadas?: number; // 0–3
  bebidaDoce?: number;
  alcoolDoses?: number | null; // null = não bebeu
  levantadas?: number;         // contagem do botão "Levantei"
  peso?: number;
  fcRepouso?: number;
  notas?: string;
  fonte?: Partial<Record<keyof Dia, Fonte>>;
  atualizadoEm: string;
}

export interface EventoTreino {
  id: string;                  // uuid
  data: DataISO;
  hora: Hora;
  tipo: 'tiros' | 'forca' | 'moderado';
  minutos: number;
  tiros?: number;
  tiroTravou?: number;         // em qual tiro travou
  rpe?: number;                // 0–10
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
  comecouPelaFibra?: boolean;  // dado para Q26; nunca interpretado na v1
  atualizadoEm: string;
}

export interface Semana {
  semana: SemanaISO;
  cintura?: number;            // cm
  sessoesTiros?: number;
  sessoesForca?: number;
  minAtiv?: number;            // min moderados na semana (sem contar tiros)
  maiorBlocoTipico?: number;
  alcoolDoses?: number;
  docesSemana?: number;
  atualizadoEm: string;
}

export interface Mes {
  mes: MesISO;
  panturrilha?: number;        // cm
  preensao?: number;           // kg
  repsAteFalhar?: number;
  atualizadoEm: string;
}

export interface Exame {
  data: DataISO;
  glicemia?: number; hba1c?: number; homaIr?: number;
  tg?: number; hdl?: number; ferritina?: number; b12?: number; vitD?: number;
  paSistolica?: number; paDiastolica?: number;
  atualizadoEm: string;
}
```

## `src/dominio/catalogo/tipos.ts`

Espelha `acoes.json` (22 ações, 9 medidas, 28 variáveis). Ids:

```ts
export type AcaoId =
  | 'tres-tiros' | 'levante-peso' | 'some-150' | 'levante-a-cada-30'
  | 'ande-depois-do-jantar' | 'nunca-dois-dias' | 'seis-mil-passos'
  | 'durma-7' | 'ultimo-cafe' | 'jante-cedo' | 'anote-o-sono'
  | 'proteina-no-prato' | 'fibra-no-prato' | 'feche-a-cozinha' | 'troque-o-doce'
  | 'comida-de-verdade' | 'beba-pela-sede' | 'se-beber' | 'pergunte-a-fome'
  | 'emagreca-devagar' | 'meca-a-cintura' | 'panturrilha-preensao';

export type Grupo = 'Movimento' | 'Sono e ritmo' | 'Alimentação' | 'Corpo e medida';

export interface AcaoCatalogo {
  id: AcaoId; grupo: Grupo; titulo: string; gatilho: string; acao_minima: string;
  descricao: string;
  faixa: { variaveis: string[]; pouco: string; ideal: string; demais: string; regra?: string };
  afeta: { input: string; processo: string; output: string };
  registro: [string, string, string];
  sinal: { output: string; prazo: string };
  seguranca?: string;
  evidencia: { grau: string; fontes: string[] };
  setas: string[];
}
export interface MedidaCatalogo { id: string; titulo: string; como: string; para_que: string; muda: string; fontes: string[]; grau: string; }
export interface Catalogo { variaveis: Record<string, unknown>; acoes: AcaoCatalogo[]; medidas: MedidaCatalogo[]; }
```

`src/dominio/catalogo/index.ts` exporta `catalogo: Catalogo` (import do JSON) e `acaoDoCatalogo(id: AcaoId): AcaoCatalogo`.

## `src/dominio/campos.ts`

```ts
export type CampoId =
  | `dia.${Exclude<keyof Dia, 'data' | 'fonte' | 'atualizadoEm'>}`
  | `semana.${Exclude<keyof Semana, 'semana' | 'atualizadoEm'>}`
  | `mes.${Exclude<keyof Mes, 'mes' | 'atualizadoEm'>}`
  | `exame.${Exclude<keyof Exame, 'data' | 'atualizadoEm'>}`
  | `perfil.${Exclude<keyof Perfil, 'atualizadoEm'>}`;

export type TipoCampo = 'hora' | 'inteiro' | 'decimal' | 'escala' | 'bool' | 'texto' | 'hora-ou-nao' | 'inteiro-ou-nao';

export interface Campo {
  id: CampoId;
  nivel: 1 | 2 | 3;
  tipo: TipoCampo;
  rotulo: string;
  ajuda?: string;
  unidade?: string;
  min?: number;
  max?: number;
  condicao?: (perfil: Perfil) => boolean;
  desbloqueia: AcaoId[];
}

export const CAMPOS: readonly Campo[];
export function campo(id: CampoId): Campo;
export function camposDe(tabela: 'dia' | 'semana' | 'mes' | 'exame', perfil: Perfil, nivel?: 1 | 2 | 3): Campo[];  // filtra por condicao e nivel (≤ nivel)
export function validar(c: Campo, valor: unknown): string | null;  // null = ok; string = mensagem ao usuário
```

## `src/dominio/derivados.ts`

```ts
export interface Derivados {
  imc: number | null;                 // 1 casa
  fcMax: number | null;               // round(208 − 0.7·idade)
  fc60: number | null; fc70: number | null; fc85: number | null;
  rmr: number | null;                 // Mifflin-St Jeor, round
  pal: 1.4 | 1.5 | 1.6 | null;        // ativ = minAtiv + sessoesTiros·20; <150→1.4, ≤300→1.5, >300→1.6
  tdee: number | null;
  defLo: number | null; defHi: number | null;   // 15 % / 25 % do tdee
  aguaMetaL: number;                  // (H ? 2.0 : 1.6) + min(2, minTreinoHoje/30·0.4), 1 casa
  coposMeta: number;                  // round(aguaMetaL / 0.25)
  pantCorte: number; pantGrave: number;         // H 34/32, M 33/31
  preensaoCorte: number;              // H 27, M 16
  corteCintura: number;               // H 88, M 84
  diasParado: number;                 // dias consecutivos (até hoje inclusive) sem moveu===true e sem EventoTreino
  pesoMedioSemana: number | null;     // média de dia.peso nos últimos 7 dias, 1 casa
  pesoMedioSemanaAnterior: number | null;  // dias 8–14
  fcRepousoMedia7d: number | null;
  jejumHoras: number | null;          // jantarFim (dia anterior) → primeiraRefeicao (hoje), 1 casa
  sonoHoras: number | null;           // (levantou − deitou) − 0.33, do dia mais recente com ambos
  variacaoDeitarMin: number | null;   // desvio-padrão em minutos de deitou nos últimos 7 dias
}
export function derivar(perfil: Perfil, dias: Dia[], eventos: EventoTreino[], semana: Semana | undefined, hoje: DataISO): Derivados;

// utilitários exportados, usados pelos planos 02 e 03
export function horaParaMin(h: Hora): number;            // "23:30" → 1410
export function minParaHora(m: number): Hora;            // 1410 → "23:30"; normaliza módulo 1440
export function horasEntre(inicio: Hora, fim: Hora): number;  // ((fim − inicio + 1440) % 1440) / 60
export function r1(n: number): number;                   // 1 casa decimal
export function mediana(xs: number[]): number | null;
export function media(xs: number[]): number | null;
export function pos(v: number, lo: number, hi: number): number;   // posição 0–1 na barra: lo→0.5, hi→0.75 (mesma função da PoC: clamp((v−lo)/(hi−lo)·0.25+0.5, 0.02, 0.98))
```

## `src/dominio/metas/tipos.ts`

```ts
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

export interface Faixa { pouco: number; meta: number; demais: number; }

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
}

export interface AcaoMeta {
  id: AcaoId;
  aplica(perfil: Perfil): boolean;
  meta(ctx: Contexto): Meta;
}
```

`src/dominio/metas/index.ts`: `export const METAS: Record<AcaoId, AcaoMeta>` e `export function metasAplicaveis(ctx: Contexto): Array<{ acao: AcaoCatalogo; meta: Meta }>` (só `aplica(perfil)`, na ordem do catálogo) e `export function acoesEmFoco(ctx: Contexto, n = 3)` (zona `pouco`/`atencao`, ordenado por `posicao` desc, isto é, mais perto da meta primeiro).

Ações **sem módulo de meta** (só registro): `anote-o-sono`, `pergunte-a-fome`, `meca-a-cintura`, `panturrilha-preensao` — mesmo assim existem em `METAS` com `meta()` retornando `zona: 'sem-dado'` quando falta o campo e `zona: 'meta'` com texto "registrado" quando existe. O teste de contrato exige as 22 chaves.

## `src/dominio/seguranca.ts`

```ts
export function avisoSeguranca(id: AcaoId, perfil: Perfil): string | undefined;
// 'tres-tiros': remedios inclui 'pressao' ou fuma === 'sim'
// 'feche-a-cozinha' e 'emagreca-devagar': remedios inclui 'glicemia' ou 'tireoide'
// texto: "Você marcou {motivo} no perfil — converse com quem te acompanha antes de mudar isso."
```

## `src/dominio/medidas/index.ts`

```ts
export type MedidaId = 'imc' | 'whtr' | 'panturrilha' | 'preensao' | 'fc_repouso' | 'fc_max' | 'rmr' | 'agua' | 'peso';
export interface MedidaResultado {
  id: MedidaId; valor: number | null; unidade: string; zona: Zona | 'neutra';
  texto: string; zonas: Array<{ tom: 'ok' | 'weak' | 'bad'; rotulo: string }>;
}
export function medidas(ctx: Contexto): MedidaResultado[];
```

## `src/dominio/tendencias/sonoFomeCafe.ts`

```ts
export type FraseTipo = 'sono-fome' | 'sono-comer-sem-fome' | 'cafe-sono';
export interface Frase { tipo: FraseTipo; texto: string; n: number; nComparacao?: number; }
export type Tendencia =
  | { pronta: false; faltam: number; precisaDe: CampoId[]; oQueVaiDizer: string }
  | { pronta: true; baseline: number; frases: Frase[] };
export function sonoFomeCafe(dias: Dia[], perfil: Perfil): Tendencia;
```

## `src/dados/`

```ts
// db.ts
export class FornalhaDB extends Dexie {
  perfil!: Table<Perfil & { id: 'me' }, 'me'>;
  dia!: Table<Dia, DataISO>;
  eventoTreino!: Table<EventoTreino, string>;
  eventoRefeicao!: Table<EventoRefeicao, string>;
  semana!: Table<Semana, SemanaISO>;
  mes!: Table<Mes, MesISO>;
  exame!: Table<Exame, DataISO>;
}
export const db: FornalhaDB;
// version(1).stores({ perfil: 'id', dia: 'data', eventoTreino: 'id, data', eventoRefeicao: 'id, data', semana: 'semana', mes: 'mes', exame: 'data' })

// repositorios/perfil.ts
export function lerPerfil(): Promise<Perfil | undefined>;
export function salvarPerfil(p: Omit<Perfil, 'atualizadoEm'>): Promise<Perfil>;
// repositorios/dia.ts
export function lerDia(data: DataISO): Promise<Dia | undefined>;
export function salvarDia(data: DataISO, parcial: Partial<Omit<Dia, 'data' | 'atualizadoEm'>>): Promise<Dia>;   // merge
export function diasRecentes(ate: DataISO, n: number): Promise<Dia[]>;   // mais recente primeiro
// repositorios/eventos.ts
export function registrarTreino(e: Omit<EventoTreino, 'id' | 'atualizadoEm'>): Promise<EventoTreino>;
export function registrarRefeicao(e: Omit<EventoRefeicao, 'id' | 'atualizadoEm'>): Promise<EventoRefeicao>;
export function treinosEntre(de: DataISO, ate: DataISO): Promise<EventoTreino[]>;
export function refeicoesEntre(de: DataISO, ate: DataISO): Promise<EventoRefeicao[]>;
// repositorios/semana.ts, mes.ts, exame.ts
export function lerSemana(s: SemanaISO): Promise<Semana | undefined>;
export function salvarSemana(s: SemanaISO, parcial: Partial<Omit<Semana, 'semana' | 'atualizadoEm'>>): Promise<Semana>;
export function semanaMaisRecente(): Promise<Semana | undefined>;
export function preencherSemana(s: SemanaISO): Promise<Partial<Semana>>;   // pré-preenchimento dos eventos/dias
export function lerMes(m: MesISO): Promise<Mes | undefined>;
export function salvarMes(m: MesISO, parcial: Partial<Omit<Mes, 'mes' | 'atualizadoEm'>>): Promise<Mes>;
export function mesMaisRecente(): Promise<Mes | undefined>;
export function listarExames(): Promise<Exame[]>;
export function salvarExame(e: Omit<Exame, 'atualizadoEm'>): Promise<Exame>;
export function ultimoExame(): Promise<Exame | undefined>;

// contexto.ts
export function montarContexto(hoje: DataISO, agora?: Date): Promise<Contexto | { semPerfil: true }>;

// exportImport.ts
export interface Exportacao { versao: 1; exportadoEm: string; perfil?: Perfil; dia: Dia[]; eventoTreino: EventoTreino[]; eventoRefeicao: EventoRefeicao[]; semana: Semana[]; mes: Mes[]; exame: Exame[]; }
export function exportar(): Promise<Exportacao>;
export function importar(json: unknown): Promise<{ ok: true; contagem: Record<string, number> } | { ok: false; motivo: string }>;  // merge: atualizadoEm mais recente vence
export function apagarTudo(): Promise<void>;

// datas.ts
export function hojeISO(agora?: Date): DataISO;
export function semanaISO(d: DataISO): SemanaISO;
export function mesISO(d: DataISO): MesISO;
export function ontem(d: DataISO): DataISO;
export function somarDias(d: DataISO, n: number): DataISO;
```

## `src/ui/`

Rotas (react-router 7, hash router para PWA): `/` Hoje, `/perfil`, `/acoes`, `/segunda`, `/tendencias`, `/ajustes`, `/exames`.

Hooks: `usePerfil()`, `useDia(data)`, `useContexto()` → `{ ctx, carregando, semPerfil }` (usa `useLiveQuery` do dexie-react-hooks para reagir a gravações).

Componentes com props fixas:

```ts
<CampoRegistro campo={Campo} valor={unknown} onChange={(v: unknown) => void} />
<CardAcao acao={AcaoCatalogo} meta={Meta} compacto?={boolean} />
<BarraZona zona={Zona} posicao={number | null} />
<CartaoMedida m={MedidaResultado} />
<ConviteRegistro campos={Campo[]} />     // "registre X e eu te digo Y"
```

Tokens de tema (CSS custom properties, dark/light por `prefers-color-scheme` e `data-theme`): `--bg --fg --muted --line --ok --weak --bad --accent`. Fontes: IBM Plex Sans / IBM Plex Mono (Google Fonts, com fallback).
