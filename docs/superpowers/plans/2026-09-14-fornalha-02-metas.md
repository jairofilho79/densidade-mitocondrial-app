# Fornalha 02 — Motor de metas: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar o motor de metas do domínio: para cada uma das 22 ações do catálogo, um módulo `AcaoMeta` que lê o `Contexto`, devolve a zona (`pouco`/`atencao`/`meta`/`demais`/`sem-dado`), o valor, a faixa personalizada, a posição na barra, o texto e o próximo passo incremental; mais `seguranca.ts`, o registro `METAS` com `metasAplicaveis`/`acoesEmFoco`, e as 9 medidas (`medidas(ctx)`). Tudo TypeScript puro, testado com Vitest, sem browser.

**Architecture:** `src/dominio/metas/` tem um arquivo por ação (`<camelCase>.ts` exportando `const <camelCase>: AcaoMeta`), helpers compartilhados em `_util.ts`, fixtures de teste em `_fixtures.ts` e o registro em `index.ts`. As regras numéricas são a transcrição do objeto `CALC` da PoC (`docs/brain/poc/acoes-atomicas.template.html`), com a zona `'ideal'` da PoC renomeada para `'meta'`; os textos de faixa vêm do catálogo `acoes.json`. `src/dominio/medidas/index.ts` transcreve a função `medida()` da PoC. `src/dominio/seguranca.ts` decide quando o próximo passo é substituído por "converse com quem te acompanha". Os módulos leem valores só via `Contexto` (perfil, dias, eventos, semana, mes, derivados) — nunca via banco ou UI.

**Tech Stack:** TypeScript 5 (strict), Vitest 3, pnpm. Sem React, sem Dexie, sem DOM neste plano.
**Spec:** docs/superpowers/specs/2026-09-14-fornalha-app-design.md
**Contratos:** docs/superpowers/plans/2026-09-14-fornalha-00-contratos.md
**Depende de:** plano 01 concluído

## Global Constraints

- `src/dominio/**` não importa de `src/dados`, `src/ui`, `src/app`, `react` nem `dexie`. Só imports relativos dentro de `src/dominio`.
- Zona `'sem-dado'` nunca chuta valor: `valor: null`, `faixa: null`, `posicao: null`, `precisaDe` preenchido com os `CampoId` que desbloqueiam.
- Próximo passo é incremental e limitado: passos +500/semana; deitar/café/jantar 15 min; proteína +10 g; fibra +5 g; água até +2 copos; sessões +1; doces −2/semana; álcool −1 dose. Nunca salta para a meta (sempre `Math.min(valor + passo, meta)` ou equivalente).
- Textos ao usuário em português com acento; identificadores (arquivos, funções, variáveis, chaves) em português sem acento e em camelCase.
- Os nomes e assinaturas de `docs/superpowers/plans/2026-09-14-fornalha-00-contratos.md` são obrigatórios; nada é renomeado. Este plano só acrescenta (helpers em `_util.ts`, fixtures).
- Os módulos do plano 01 já existem com exatamente estas assinaturas e são consumidos como estão: `src/dominio/tipos.ts` (`Perfil`, `Dia`, `EventoTreino`, `EventoRefeicao`, `Semana`, `Mes`, `Hora`, `DataISO`, `SemanaISO`), `src/dominio/catalogo/index.ts` (`catalogo`, `acaoDoCatalogo`), `src/dominio/catalogo/tipos.ts` (`AcaoId`, `AcaoCatalogo`), `src/dominio/campos.ts` (`CampoId`, `campo`), `src/dominio/derivados.ts` (`Derivados`, `derivar`, `pos`, `horaParaMin`, `minParaHora`, `horasEntre`, `r1`).
- A função `pos()` usada é a do plano 01 (contrato: `clamp((v−lo)/(hi−lo)·0.25+0.5, 0.02, 0.98)`), não a da PoC. Onde a PoC usa posições fixas (0.5/0.25/0.08 etc.), as fixas são mantidas.
- Cada `Meta` de ação passa por `aplicarSeguranca` antes de ser devolvida, mesmo que a ação não tenha regra de segurança (a função devolve a meta intocada).
- Gerenciador: `pnpm`. Comandos rodam dentro de `app/`. Commits na raiz do repo, mensagem em português, prefixo `feat:`/`test:`/`chore:`.
- Um teste por zona (pouco, atencao, meta, demais, sem-dado) por ação. Quando a ação não tem uma zona no catálogo (ex.: "demais: não há"), o teste dessa zona verifica que o valor extremo **não** cai nela.
- `Faixa` (`{ pouco, meta, demais }`) guarda os três limiares numéricos personalizados que a barra mostra; quando o catálogo diz "não há demais", `demais` repete o limite superior da meta; quando diz "não há pouco", `pouco` repete o limite da meta.
- Datas de "hoje" vêm de `ctx.agora` (hora local) via `hojeISO(ctx)` de `_util.ts`. Nunca `new Date()` dentro do domínio.

---

## Referência rápida: como ler o Contexto

| Fonte | O que é | Quem usa |
|---|---|---|
| `ctx.hoje` | `Dia` de hoje (pode ser `undefined`) | registro-só (`anote-o-sono`, `pergunte-a-fome`), `levantadas`, `copos` na medida água |
| `ctx.dias` | últimos 28 `Dia`, mais recente primeiro; dias sem registro **não** estão no array | `ultimoDiaCom`, `diasUltimos` |
| `ctx.eventos` | `EventoTreino` da janela, mais recente primeiro | `contarSessoes`, `eventosUltimos` |
| `ctx.semana` | a `Semana` mais recente (pode ser de outra semana ISO) | `semanaAtual(ctx)` filtra a da semana corrente; `meca-a-cintura` usa a mais recente |
| `ctx.mes` | o `Mes` mais recente | `panturrilha-preensao`, medidas |
| `ctx.derivados` | saída de `derivar()` do plano 01 | `diasParado`, `sonoHoras`, `jejumHoras`, `coposMeta`, `pesoMedioSemana`, … |
| `ctx.agora` | `Date` | `hojeISO(ctx)` |

Regra de precedência das metas semanais: **a revisão da semana corrente (`semanaAtual`) vence a contagem de eventos**, porque a pessoa confirmou ou corrigiu; sem revisão, conta-se eventos da semana ISO corrente; sem nenhum evento na janela de 28 dias e sem revisão, é `sem-dado`.

---

### Task 1: Tipos do motor e `seguranca.ts`

**Files:**
- Create: `app/src/dominio/metas/tipos.ts`
- Create: `app/src/dominio/seguranca.ts`
- Test: `app/src/dominio/seguranca.test.ts`

**Interfaces:**
- Consumes: `Perfil` (`src/dominio/tipos.ts`), `AcaoId` (`src/dominio/catalogo/tipos.ts`), `CampoId` (`src/dominio/campos.ts`), `Derivados` (`src/dominio/derivados.ts`), `Dia`, `EventoTreino`, `EventoRefeicao`, `Semana`, `Mes`, `DataISO`.
- Produces:
  - `export type Zona = 'pouco' | 'atencao' | 'meta' | 'demais' | 'sem-dado'`
  - `export interface Contexto { perfil; hoje; dias; eventos; refeicoes; semana; mes; derivados; agora }`
  - `export interface Faixa { pouco: number; meta: number; demais: number }`
  - `export interface Meta { zona; valor; faixa; posicao; texto; proximoPasso; precisaDe?; seguranca?; deDia? }`
  - `export interface AcaoMeta { id: AcaoId; aplica(perfil: Perfil): boolean; meta(ctx: Contexto): Meta }`
  - `export function avisoSeguranca(id: AcaoId, perfil: Perfil): string | undefined`

- [ ] **Step 1: Criar `metas/tipos.ts` (cópia exata do contrato)**

`app/src/dominio/metas/tipos.ts`:

```ts
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
}

export interface AcaoMeta {
  id: AcaoId;
  aplica(perfil: Perfil): boolean;
  meta(ctx: Contexto): Meta;
}
```

- [ ] **Step 2: Escrever o teste de `seguranca.ts` (falha)**

`app/src/dominio/seguranca.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { avisoSeguranca } from './seguranca';
import type { Perfil } from './tipos';

const base: Perfil = {
  peso: 90,
  altura: 175,
  idade: 40,
  sexo: 'H',
  levantar: '06:30',
  deitar: '23:30',
  cafe: 'diario',
  alcool: 'nao',
  remedios: [],
  fuma: 'nao',
  examesQueTem: [],
  atualizadoEm: '2026-09-14T08:00:00.000Z',
};

describe('avisoSeguranca', () => {
  it('perfil sem flags: nenhum aviso para nenhuma ação', () => {
    expect(avisoSeguranca('tres-tiros', base)).toBeUndefined();
    expect(avisoSeguranca('feche-a-cozinha', base)).toBeUndefined();
    expect(avisoSeguranca('emagreca-devagar', base)).toBeUndefined();
    expect(avisoSeguranca('seis-mil-passos', base)).toBeUndefined();
  });

  it('tres-tiros: remédio para pressão', () => {
    expect(avisoSeguranca('tres-tiros', { ...base, remedios: ['pressao'] })).toBe(
      'Você marcou remédio para pressão no perfil — converse com quem te acompanha antes de mudar isso.',
    );
  });

  it('tres-tiros: fuma', () => {
    expect(avisoSeguranca('tres-tiros', { ...base, fuma: 'sim' })).toBe(
      'Você marcou que fuma no perfil — converse com quem te acompanha antes de mudar isso.',
    );
  });

  it('tres-tiros: pressão e fuma juntos', () => {
    expect(avisoSeguranca('tres-tiros', { ...base, remedios: ['pressao'], fuma: 'sim' })).toBe(
      'Você marcou remédio para pressão e que fuma no perfil — converse com quem te acompanha antes de mudar isso.',
    );
  });

  it('tres-tiros: parou de fumar não gera aviso; glicemia não afeta tiros', () => {
    expect(avisoSeguranca('tres-tiros', { ...base, fuma: 'parou' })).toBeUndefined();
    expect(avisoSeguranca('tres-tiros', { ...base, remedios: ['glicemia'] })).toBeUndefined();
  });

  it('feche-a-cozinha e emagreca-devagar: glicemia ou tireoide', () => {
    expect(avisoSeguranca('feche-a-cozinha', { ...base, remedios: ['glicemia'] })).toBe(
      'Você marcou remédio para glicemia no perfil — converse com quem te acompanha antes de mudar isso.',
    );
    expect(avisoSeguranca('emagreca-devagar', { ...base, remedios: ['tireoide'] })).toBe(
      'Você marcou remédio para tireoide no perfil — converse com quem te acompanha antes de mudar isso.',
    );
    expect(avisoSeguranca('emagreca-devagar', { ...base, remedios: ['glicemia', 'tireoide'] })).toBe(
      'Você marcou remédio para glicemia e remédio para tireoide no perfil — converse com quem te acompanha antes de mudar isso.',
    );
  });

  it('feche-a-cozinha: pressão não afeta', () => {
    expect(avisoSeguranca('feche-a-cozinha', { ...base, remedios: ['pressao'] })).toBeUndefined();
  });
});
```

- [ ] **Step 3: Rodar e ver falhar**

```
cd app && pnpm vitest run src/dominio/seguranca.test.ts
```
Saída esperada: `FAIL src/dominio/seguranca.test.ts` com `Error: Failed to load url ./seguranca` (o módulo não existe).

- [ ] **Step 4: Implementar `seguranca.ts`**

`app/src/dominio/seguranca.ts`:

```ts
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
```

- [ ] **Step 5: Rodar e ver passar**

```
cd app && pnpm vitest run src/dominio/seguranca.test.ts
```
Saída esperada: `✓ src/dominio/seguranca.test.ts (7 tests)`.

- [ ] **Step 6: Commit**

```
git add app/src/dominio/metas/tipos.ts app/src/dominio/seguranca.ts app/src/dominio/seguranca.test.ts
git commit -m "feat: tipos do motor de metas e avisoSeguranca"
```

---

### Task 2: Helpers `_util.ts` e fixtures `_fixtures.ts`

**Files:**
- Create: `app/src/dominio/metas/_util.ts`
- Create: `app/src/dominio/metas/_fixtures.ts`
- Test: `app/src/dominio/metas/_util.test.ts`

**Interfaces:**
- Consumes: `avisoSeguranca` (`../seguranca`), `derivar`, `Derivados` (`../derivados`), tipos do plano 01.
- Produces (`_util.ts`):
  - `export function dataISO(d: Date): DataISO` — hora local → `YYYY-MM-DD`
  - `export function hojeISO(ctx: Contexto): DataISO`
  - `export function somarDias(data: DataISO, n: number): DataISO`
  - `export function semanaISO(data: DataISO): SemanaISO` — `'2026-09-17' → '2026-W38'`
  - `export function inicioSemana(data: DataISO): DataISO` — segunda-feira da semana ISO
  - `export function semDado(precisaDe: CampoId[], texto?: string): Meta`
  - `export function ultimoDiaCom<K extends keyof Dia>(dias: Dia[], campo: K): Dia | undefined`
  - `export function diasUltimos(ctx: Contexto, n: number): Dia[]` — dias com `data` entre `hoje − (n−1)` e `hoje`
  - `export function eventosUltimos(ctx: Contexto, n: number): EventoTreino[]`
  - `export function contarSessoes(eventos: EventoTreino[], tipo: EventoTreino['tipo'], ctx: Contexto): number` — semana ISO corrente
  - `export function semanaAtual(ctx: Contexto): Semana | undefined` — `ctx.semana` se for da semana ISO de hoje
  - `export function deDiaSeNaoHoje(ctx: Contexto, dia: Dia): { deDia?: DataISO }`
  - `export function aplicarSeguranca(id: AcaoId, perfil: Perfil, meta: Meta): Meta`
- Produces (`_fixtures.ts`):
  - `export const AGORA: Date` (quinta-feira 2026-09-17 09:00 local), `HOJE = '2026-09-17'`, `ONTEM = '2026-09-16'`, `SEMANA = '2026-W38'`
  - `export const perfilBase: Perfil`
  - `export function diaBase(data: DataISO, parcial?: Partial<Omit<Dia, 'data'>>): Dia`
  - `export function eventoBase(data: DataISO, tipo: EventoTreino['tipo'], minutos?: number, parcial?: Partial<EventoTreino>): EventoTreino`
  - `export function semanaBase(parcial?: Partial<Semana>): Semana`
  - `export function mesBase(parcial?: Partial<Mes>): Mes`
  - `export interface CtxParcial extends Partial<Omit<Contexto, 'derivados'>> { derivados?: Partial<Derivados> }`
  - `export function ctxBase(parcial?: CtxParcial): Contexto` — monta com `derivar()` e aplica o override parcial de `derivados` por cima

- [ ] **Step 1: Escrever o teste de `_util.ts` (falha)**

`app/src/dominio/metas/_util.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  aplicarSeguranca,
  contarSessoes,
  dataISO,
  diasUltimos,
  eventosUltimos,
  hojeISO,
  inicioSemana,
  semDado,
  semanaAtual,
  semanaISO,
  somarDias,
  ultimoDiaCom,
  deDiaSeNaoHoje,
} from './_util';
import { AGORA, HOJE, ONTEM, ctxBase, diaBase, eventoBase, perfilBase, semanaBase } from './_fixtures';
import type { Meta } from './tipos';

describe('datas', () => {
  it('dataISO usa a hora local', () => {
    expect(dataISO(new Date(2026, 8, 17, 23, 59))).toBe('2026-09-17');
    expect(dataISO(new Date(2026, 0, 5, 0, 0))).toBe('2026-01-05');
  });

  it('hojeISO vem de ctx.agora', () => {
    expect(hojeISO(ctxBase())).toBe(HOJE);
    expect(AGORA.getDay()).toBe(4); // quinta-feira
  });

  it('somarDias cruza mês e ano', () => {
    expect(somarDias('2026-09-17', -6)).toBe('2026-09-11');
    expect(somarDias('2026-09-30', 1)).toBe('2026-10-01');
    expect(somarDias('2026-01-01', -1)).toBe('2025-12-31');
  });

  it('semanaISO e inicioSemana', () => {
    expect(semanaISO('2026-09-17')).toBe('2026-W38');
    expect(semanaISO('2026-09-14')).toBe('2026-W38');
    expect(semanaISO('2026-09-13')).toBe('2026-W37');
    expect(semanaISO('2026-01-01')).toBe('2026-W01');
    expect(semanaISO('2027-01-01')).toBe('2026-W53');
    expect(inicioSemana('2026-09-17')).toBe('2026-09-14');
    expect(inicioSemana('2026-09-14')).toBe('2026-09-14');
    expect(inicioSemana('2026-09-20')).toBe('2026-09-14');
  });
});

describe('semDado', () => {
  it('nunca chuta valor', () => {
    const m = semDado(['dia.passos']);
    expect(m).toEqual({
      zona: 'sem-dado',
      valor: null,
      faixa: null,
      posicao: null,
      texto: 'ainda sem registro',
      proximoPasso: 'registre para ver onde você está',
      precisaDe: ['dia.passos'],
    });
  });

  it('aceita texto próprio', () => {
    expect(semDado(['dia.peso'], 'precisa de duas semanas').texto).toBe('precisa de duas semanas');
  });
});

describe('ultimoDiaCom', () => {
  const dias = [
    diaBase('2026-09-17', {}),
    diaBase('2026-09-16', { passos: 4000, ultimoCafe: null }),
    diaBase('2026-09-15', { passos: 3000, ultimoCafe: '15:00' }),
  ];

  it('devolve o dia mais recente com o campo definido', () => {
    expect(ultimoDiaCom(dias, 'passos')?.data).toBe('2026-09-16');
  });

  it('null conta como definido', () => {
    expect(ultimoDiaCom(dias, 'ultimoCafe')?.data).toBe('2026-09-16');
  });

  it('undefined quando ninguém tem o campo', () => {
    expect(ultimoDiaCom(dias, 'copos')).toBeUndefined();
    expect(ultimoDiaCom([], 'passos')).toBeUndefined();
  });
});

describe('janelas', () => {
  it('diasUltimos filtra por data, não por posição', () => {
    const ctx = ctxBase({
      dias: [diaBase('2026-09-17'), diaBase('2026-09-11'), diaBase('2026-09-10'), diaBase('2026-08-20')],
    });
    expect(diasUltimos(ctx, 7).map((d) => d.data)).toEqual(['2026-09-17', '2026-09-11']);
    expect(diasUltimos(ctx, 28).map((d) => d.data)).toEqual(['2026-09-17', '2026-09-11', '2026-09-10']);
  });

  it('eventosUltimos filtra por data', () => {
    const ctx = ctxBase({
      eventos: [eventoBase('2026-09-17', 'tiros'), eventoBase('2026-09-11', 'moderado', 30), eventoBase('2026-09-10', 'moderado', 30)],
    });
    expect(eventosUltimos(ctx, 7).length).toBe(2);
  });

  it('contarSessoes conta só a semana ISO corrente (segunda 14 a hoje 17)', () => {
    const ctx = ctxBase({
      eventos: [
        eventoBase('2026-09-17', 'tiros'),
        eventoBase('2026-09-15', 'tiros'),
        eventoBase('2026-09-14', 'forca'),
        eventoBase('2026-09-13', 'tiros'), // domingo da semana passada
        eventoBase('2026-09-18', 'tiros'), // amanhã (não deveria existir, mas não conta)
      ],
    });
    expect(contarSessoes(ctx.eventos, 'tiros', ctx)).toBe(2);
    expect(contarSessoes(ctx.eventos, 'forca', ctx)).toBe(1);
    expect(contarSessoes(ctx.eventos, 'moderado', ctx)).toBe(0);
  });

  it('semanaAtual só devolve a revisão da semana ISO de hoje', () => {
    expect(semanaAtual(ctxBase({ semana: semanaBase({ sessoesTiros: 3 }) }))?.sessoesTiros).toBe(3);
    expect(semanaAtual(ctxBase({ semana: semanaBase({ semana: '2026-W37', sessoesTiros: 3 }) }))).toBeUndefined();
    expect(semanaAtual(ctxBase())).toBeUndefined();
  });

  it('deDiaSeNaoHoje', () => {
    const ctx = ctxBase();
    expect(deDiaSeNaoHoje(ctx, diaBase(HOJE))).toEqual({});
    expect(deDiaSeNaoHoje(ctx, diaBase(ONTEM))).toEqual({ deDia: ONTEM });
  });
});

describe('aplicarSeguranca', () => {
  const meta: Meta = { zona: 'meta', valor: 3, faixa: null, posicao: 0.5, texto: 'x', proximoPasso: 'manter' };

  it('sem flag devolve a meta igual', () => {
    expect(aplicarSeguranca('tres-tiros', perfilBase, meta)).toEqual(meta);
    expect(aplicarSeguranca('tres-tiros', perfilBase, meta).seguranca).toBeUndefined();
  });

  it('com flag preenche seguranca e mantém o resto', () => {
    const m = aplicarSeguranca('tres-tiros', { ...perfilBase, fuma: 'sim' }, meta);
    expect(m.seguranca).toContain('converse com quem te acompanha');
    expect(m.proximoPasso).toBe('manter');
    expect(m.zona).toBe('meta');
  });
});

describe('ctxBase', () => {
  it('coloca hoje em dias e ordena do mais recente para o mais antigo', () => {
    const ctx = ctxBase({ hoje: diaBase(HOJE, { passos: 1 }), dias: [diaBase('2026-09-10'), diaBase(ONTEM)] });
    expect(ctx.dias.map((d) => d.data)).toEqual([HOJE, ONTEM, '2026-09-10']);
    expect(ctx.hoje?.passos).toBe(1);
  });

  it('override de derivados vence o derivar()', () => {
    expect(ctxBase({ derivados: { diasParado: 9 } }).derivados.diasParado).toBe(9);
    expect(ctxBase().derivados.coposMeta).toBe(8); // H, sem treino hoje: 2,0 L / 0,25
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

```
cd app && pnpm vitest run src/dominio/metas/_util.test.ts
```
Saída esperada: `FAIL … Failed to load url ./_util`.

- [ ] **Step 3: Implementar `_util.ts`**

`app/src/dominio/metas/_util.ts`:

```ts
import type { CampoId } from '../campos';
import type { AcaoId } from '../catalogo/tipos';
import { avisoSeguranca } from '../seguranca';
import type { DataISO, Dia, EventoTreino, Perfil, Semana, SemanaISO } from '../tipos';
import type { Contexto, Meta } from './tipos';

const DIA_MS = 86_400_000;

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** `Date` (hora local) → `YYYY-MM-DD`. */
export function dataISO(d: Date): DataISO {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function hojeISO(ctx: Contexto): DataISO {
  return dataISO(ctx.agora);
}

function utc(data: DataISO): Date {
  const [a, m, d] = data.split('-').map(Number);
  return new Date(Date.UTC(a, m - 1, d));
}

export function somarDias(data: DataISO, n: number): DataISO {
  const t = utc(data);
  t.setUTCDate(t.getUTCDate() + n);
  return t.toISOString().slice(0, 10);
}

/** Semana ISO 8601: `'2026-09-17' → '2026-W38'`. */
export function semanaISO(data: DataISO): SemanaISO {
  const t = utc(data);
  const diaSemana = t.getUTCDay() || 7; // 1 = segunda … 7 = domingo
  t.setUTCDate(t.getUTCDate() + 4 - diaSemana); // quinta-feira da mesma semana define o ano
  const ano = t.getUTCFullYear();
  const inicioAno = Date.UTC(ano, 0, 1);
  const semana = Math.ceil(((t.getTime() - inicioAno) / DIA_MS + 1) / 7);
  return `${ano}-W${pad2(semana)}`;
}

/** Segunda-feira da semana ISO que contém `data`. */
export function inicioSemana(data: DataISO): DataISO {
  const diaSemana = utc(data).getUTCDay() || 7;
  return somarDias(data, 1 - diaSemana);
}

export function semDado(precisaDe: CampoId[], texto = 'ainda sem registro'): Meta {
  return {
    zona: 'sem-dado',
    valor: null,
    faixa: null,
    posicao: null,
    texto,
    proximoPasso: 'registre para ver onde você está',
    precisaDe,
  };
}

/** Dia mais recente em que `dias[i][campo] !== undefined` (`null` conta como registrado). */
export function ultimoDiaCom<K extends keyof Dia>(dias: Dia[], campo: K): Dia | undefined {
  return dias.find((d) => d[campo] !== undefined);
}

/** Dias com `data` entre `hoje − (n − 1)` e `hoje`, inclusive. */
export function diasUltimos(ctx: Contexto, n: number): Dia[] {
  const hoje = hojeISO(ctx);
  const limite = somarDias(hoje, -(n - 1));
  return ctx.dias.filter((d) => d.data >= limite && d.data <= hoje);
}

export function eventosUltimos(ctx: Contexto, n: number): EventoTreino[] {
  const hoje = hojeISO(ctx);
  const limite = somarDias(hoje, -(n - 1));
  return ctx.eventos.filter((e) => e.data >= limite && e.data <= hoje);
}

/** Sessões de `tipo` na semana ISO corrente (segunda-feira até hoje). */
export function contarSessoes(eventos: EventoTreino[], tipo: EventoTreino['tipo'], ctx: Contexto): number {
  const hoje = hojeISO(ctx);
  const segunda = inicioSemana(hoje);
  return eventos.filter((e) => e.tipo === tipo && e.data >= segunda && e.data <= hoje).length;
}

/** `ctx.semana` quando ela é a revisão da semana ISO de hoje; senão `undefined`. */
export function semanaAtual(ctx: Contexto): Semana | undefined {
  if (!ctx.semana) return undefined;
  return ctx.semana.semana === semanaISO(hojeISO(ctx)) ? ctx.semana : undefined;
}

/** Para espalhar na Meta: `{ deDia }` quando o dia não é hoje, `{}` quando é. */
export function deDiaSeNaoHoje(ctx: Contexto, dia: Dia): { deDia?: DataISO } {
  return dia.data === hojeISO(ctx) ? {} : { deDia: dia.data };
}

export function aplicarSeguranca(id: AcaoId, perfil: Perfil, meta: Meta): Meta {
  const aviso = avisoSeguranca(id, perfil);
  return aviso === undefined ? meta : { ...meta, seguranca: aviso };
}
```

- [ ] **Step 4: Implementar `_fixtures.ts`**

`app/src/dominio/metas/_fixtures.ts`:

```ts
import { derivar, type Derivados } from '../derivados';
import type { DataISO, Dia, EventoTreino, Mes, Perfil, Semana, SemanaISO } from '../tipos';
import { dataISO } from './_util';
import type { Contexto } from './tipos';

/** Quinta-feira, 17/09/2026, 09:00 (hora local). Semana ISO 2026-W38 = segunda 14 a domingo 20. */
export const AGORA = new Date(2026, 8, 17, 9, 0, 0);
export const HOJE: DataISO = '2026-09-17';
export const ONTEM: DataISO = '2026-09-16';
export const SEMANA: SemanaISO = '2026-W38';

export const perfilBase: Perfil = {
  peso: 90,
  altura: 175,
  idade: 40,
  sexo: 'H',
  levantar: '06:30',
  deitar: '23:30',
  cafe: 'diario',
  alcool: 'as-vezes',
  remedios: [],
  fuma: 'nao',
  examesQueTem: [],
  atualizadoEm: '2026-09-14T08:00:00.000Z',
};

export function diaBase(data: DataISO, parcial: Partial<Omit<Dia, 'data'>> = {}): Dia {
  return { data, atualizadoEm: `${data}T08:00:00.000Z`, ...parcial };
}

let contadorEvento = 0;
export function eventoBase(
  data: DataISO,
  tipo: EventoTreino['tipo'],
  minutos = 20,
  parcial: Partial<EventoTreino> = {},
): EventoTreino {
  contadorEvento += 1;
  return {
    id: `ev-${contadorEvento}`,
    data,
    hora: '07:00',
    tipo,
    minutos,
    atualizadoEm: `${data}T08:00:00.000Z`,
    ...parcial,
  };
}

export function semanaBase(parcial: Partial<Semana> = {}): Semana {
  return { semana: SEMANA, atualizadoEm: '2026-09-14T08:00:00.000Z', ...parcial };
}

export function mesBase(parcial: Partial<Mes> = {}): Mes {
  return { mes: '2026-09', atualizadoEm: '2026-09-07T08:00:00.000Z', ...parcial };
}

export interface CtxParcial extends Partial<Omit<Contexto, 'derivados'>> {
  derivados?: Partial<Derivados>;
}

/** Monta um Contexto real (com `derivar()` do plano 01); `derivados` parcial sobrescreve por cima. */
export function ctxBase(parcial: CtxParcial = {}): Contexto {
  const perfil = parcial.perfil ?? perfilBase;
  const agora = parcial.agora ?? AGORA;
  const hojeData = dataISO(agora);

  const dias = [...(parcial.dias ?? [])];
  const hojeParcial = parcial.hoje;
  if (hojeParcial && !dias.some((d) => d.data === hojeParcial.data)) dias.push(hojeParcial);
  dias.sort((a, b) => (a.data < b.data ? 1 : a.data > b.data ? -1 : 0)); // mais recente primeiro

  const hoje = parcial.hoje ?? dias.find((d) => d.data === hojeData);
  const eventos = [...(parcial.eventos ?? [])].sort((a, b) => (a.data < b.data ? 1 : a.data > b.data ? -1 : 0));
  const semana = parcial.semana;

  const derivados: Derivados = {
    ...derivar(perfil, dias, eventos, semana, hojeData),
    ...(parcial.derivados ?? {}),
  };

  return {
    perfil,
    hoje,
    dias,
    eventos,
    refeicoes: parcial.refeicoes ?? [],
    semana,
    mes: parcial.mes,
    derivados,
    agora,
  };
}
```

- [ ] **Step 5: Rodar e ver passar**

```
cd app && pnpm vitest run src/dominio/metas/_util.test.ts
```
Saída esperada: `✓ src/dominio/metas/_util.test.ts (18 tests)`. Se o teste `ctxBase().derivados.coposMeta` falhar, o problema é em `derivar()` do plano 01 (H sem treino hoje deve dar `aguaMetaL = 2.0`, `coposMeta = 8`) — corrija lá, não aqui.

- [ ] **Step 6: Commit**

```
git add app/src/dominio/metas/_util.ts app/src/dominio/metas/_util.test.ts app/src/dominio/metas/_fixtures.ts
git commit -m "feat: helpers e fixtures do motor de metas"
```

---

### Task 3: Grupo Movimento (7 ações)

**Files:**
- Create: `app/src/dominio/metas/tresTiros.ts`, `levantePeso.ts`, `some150.ts`, `levanteACada30.ts`, `andeDepoisDoJantar.ts`, `nuncaDoisDias.ts`, `seisMilPassos.ts`
- Test: `app/src/dominio/metas/tresTiros.test.ts`, `levantePeso.test.ts`, `some150.test.ts`, `levanteACada30.test.ts`, `andeDepoisDoJantar.test.ts`, `nuncaDoisDias.test.ts`, `seisMilPassos.test.ts`

**Interfaces:**
- Consumes: `pos` (`../derivados`), `AcaoMeta`, `Zona` (`./tipos`), helpers de `./_util`, fixtures de `./_fixtures`.
- Produces: `export const tresTiros: AcaoMeta`, `levantePeso`, `some150`, `levanteACada30`, `andeDepoisDoJantar`, `nuncaDoisDias`, `seisMilPassos`.

Regras transcritas da PoC (`CALC`), zona `'ideal'` → `'meta'`:

| ação | valor | pouco | atencao | meta | demais | posição |
|---|---|---|---|---|---|---|
| tres-tiros | sessões de tiros/sem | < 2 | 4 | 2–3 | ≥ 5 | `pos(n, 2, 3)` |
| levante-peso | sessões de força/sem | < 1 | 1 | 2–3 | ≥ 4 | `pos(n, 2, 3)` |
| some-150 | minAtiv + tiros·20 | < 150 | 301–600 | 150–300 | > 600 | `pos(t, 150, 300)` |
| levante-a-cada-30 | maior bloco sentado (min) | > 60 | 31–60 | ≤ 30 | não há | 0.08 / 0.25 / 0.5 |
| ande-depois-do-jantar | min andando pós-jantar | 0 | 1–9 | ≥ 10 | não há | 0.06 / 0.25 / 0.5 |
| nunca-dois-dias | `derivados.diasParado` | ≥ 3 | 2 | ≤ 1 | não há | 0.06 / 0.25 / 0.45 |
| seis-mil-passos | passos/dia | < 2000 | 2000–4999 | ≥ 5000 | não há | `pos(n, 5000, 7000)` |

- [ ] **Step 1: Teste de `tres-tiros` (falha)**

`app/src/dominio/metas/tresTiros.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { tresTiros } from './tresTiros';
import { ctxBase, eventoBase, perfilBase, semanaBase } from './_fixtures';

describe('tres-tiros', () => {
  it('aplica a todo perfil', () => {
    expect(tresTiros.id).toBe('tres-tiros');
    expect(tresTiros.aplica(perfilBase)).toBe(true);
  });

  it('pouco: 1 sessão de tiros nesta semana', () => {
    const m = tresTiros.meta(ctxBase({ eventos: [eventoBase('2026-09-15', 'tiros')] }));
    expect(m.zona).toBe('pouco');
    expect(m.valor).toBe(1);
    expect(m.texto).toBe('1 sessão/sem');
    expect(m.posicao).toBeCloseTo(0.25, 3);
    expect(m.proximoPasso).toBe('mais 1 sessão esta semana; se o máximo não dá, tiros a 70% já contam');
    expect(m.faixa).toEqual({ pouco: 2, meta: 3, demais: 5 });
    expect(m.seguranca).toBeUndefined();
  });

  it('meta: 3 sessões nesta semana; a de sábado passado não conta', () => {
    const m = tresTiros.meta(
      ctxBase({
        eventos: [
          eventoBase('2026-09-17', 'tiros'),
          eventoBase('2026-09-15', 'tiros'),
          eventoBase('2026-09-14', 'tiros'),
          eventoBase('2026-09-12', 'tiros'),
        ],
      }),
    );
    expect(m.zona).toBe('meta');
    expect(m.valor).toBe(3);
    expect(m.texto).toBe('3 sessões/sem');
    expect(m.posicao).toBeCloseTo(0.75, 3);
    expect(m.proximoPasso).toBe('manter o protocolo fixo e registrar o RPE');
  });

  it('atencao: a revisão da semana diz 4', () => {
    const m = tresTiros.meta(ctxBase({ semana: semanaBase({ sessoesTiros: 4 }) }));
    expect(m.zona).toBe('atencao');
    expect(m.valor).toBe(4);
    expect(m.posicao).toBeCloseTo(0.98, 3);
  });

  it('demais: 5 sessões', () => {
    const m = tresTiros.meta(ctxBase({ semana: semanaBase({ sessoesTiros: 5 }) }));
    expect(m.zona).toBe('demais');
    expect(m.proximoPasso).toBe('tirar 1 sessão e ver se o RPE cai');
  });

  it('a revisão da semana corrente vence a contagem de eventos', () => {
    const m = tresTiros.meta(
      ctxBase({ semana: semanaBase({ sessoesTiros: 2 }), eventos: [eventoBase('2026-09-15', 'tiros')] }),
    );
    expect(m.valor).toBe(2);
  });

  it('revisão de outra semana é ignorada; com eventos na janela, conta zero', () => {
    const m = tresTiros.meta(
      ctxBase({
        semana: semanaBase({ semana: '2026-W36', sessoesTiros: 3 }),
        eventos: [eventoBase('2026-09-15', 'forca')],
      }),
    );
    expect(m.zona).toBe('pouco');
    expect(m.valor).toBe(0);
    expect(m.texto).toBe('0 sessões/sem');
  });

  it('sem-dado: nenhum treino registrado e sem revisão', () => {
    const m = tresTiros.meta(ctxBase());
    expect(m.zona).toBe('sem-dado');
    expect(m.valor).toBeNull();
    expect(m.faixa).toBeNull();
    expect(m.posicao).toBeNull();
    expect(m.precisaDe).toEqual(['semana.sessoesTiros']);
  });

  it('segurança: remédio para pressão preenche seguranca', () => {
    const m = tresTiros.meta(
      ctxBase({ perfil: { ...perfilBase, remedios: ['pressao'] }, semana: semanaBase({ sessoesTiros: 3 }) }),
    );
    expect(m.seguranca).toContain('converse com quem te acompanha');
    expect(m.zona).toBe('meta');
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

```
cd app && pnpm vitest run src/dominio/metas/tresTiros.test.ts
```
Saída esperada: `FAIL … Failed to load url ./tresTiros`.

- [ ] **Step 3: Implementar `tresTiros.ts`**

`app/src/dominio/metas/tresTiros.ts`:

```ts
import { pos } from '../derivados';
import { aplicarSeguranca, contarSessoes, semDado, semanaAtual } from './_util';
import type { AcaoMeta, Zona } from './tipos';

export const tresTiros: AcaoMeta = {
  id: 'tres-tiros',
  aplica: () => true,
  meta(ctx) {
    const revisao = semanaAtual(ctx);
    const n =
      revisao?.sessoesTiros ??
      (ctx.eventos.length > 0 ? contarSessoes(ctx.eventos, 'tiros', ctx) : undefined);
    if (n === undefined) return semDado(['semana.sessoesTiros'], 'nenhum treino registrado');

    const zona: Zona = n < 2 ? 'pouco' : n <= 3 ? 'meta' : n <= 4 ? 'atencao' : 'demais';
    const proximoPasso =
      n < 2
        ? 'mais 1 sessão esta semana; se o máximo não dá, tiros a 70% já contam'
        : n <= 3
          ? 'manter o protocolo fixo e registrar o RPE'
          : 'tirar 1 sessão e ver se o RPE cai';

    return aplicarSeguranca('tres-tiros', ctx.perfil, {
      zona,
      valor: n,
      faixa: { pouco: 2, meta: 3, demais: 5 },
      posicao: pos(n, 2, 3),
      texto: `${n} ${n === 1 ? 'sessão' : 'sessões'}/sem`,
      proximoPasso,
    });
  },
};
```

- [ ] **Step 4: Rodar e ver passar**

```
cd app && pnpm vitest run src/dominio/metas/tresTiros.test.ts
```
Saída esperada: `✓ src/dominio/metas/tresTiros.test.ts (9 tests)`.

- [ ] **Step 5: Commit**

```
git add app/src/dominio/metas/tresTiros.ts app/src/dominio/metas/tresTiros.test.ts
git commit -m "feat: meta tres-tiros"
```

- [ ] **Step 6: Teste de `levante-peso` (falha)**

`app/src/dominio/metas/levantePeso.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { levantePeso } from './levantePeso';
import { ctxBase, eventoBase, perfilBase, semanaBase } from './_fixtures';

describe('levante-peso', () => {
  it('aplica a todo perfil', () => {
    expect(levantePeso.id).toBe('levante-peso');
    expect(levantePeso.aplica(perfilBase)).toBe(true);
  });

  it('pouco: há treinos na janela mas nenhum de força nesta semana', () => {
    const m = levantePeso.meta(ctxBase({ eventos: [eventoBase('2026-09-15', 'moderado', 30)] }));
    expect(m.zona).toBe('pouco');
    expect(m.valor).toBe(0);
    expect(m.texto).toBe('0 sessões/sem');
    expect(m.posicao).toBeCloseTo(0.02, 3);
    expect(m.proximoPasso).toBe('uma sessão de 20 min em casa nesta semana: agachamento, flexão, remada');
    expect(m.faixa).toEqual({ pouco: 1, meta: 2, demais: 3 });
  });

  it('atencao: 1 sessão de força', () => {
    const m = levantePeso.meta(ctxBase({ eventos: [eventoBase('2026-09-16', 'forca', 25)] }));
    expect(m.zona).toBe('atencao');
    expect(m.valor).toBe(1);
    expect(m.texto).toBe('1 sessão/sem');
    expect(m.posicao).toBeCloseTo(0.25, 3);
    expect(m.proximoPasso).toBe('uma sessão de 20 min em casa nesta semana: agachamento, flexão, remada');
  });

  it('meta: 2 sessões nesta semana; a da semana passada não conta', () => {
    const m = levantePeso.meta(
      ctxBase({
        eventos: [eventoBase('2026-09-14', 'forca'), eventoBase('2026-09-16', 'forca'), eventoBase('2026-09-11', 'forca')],
      }),
    );
    expect(m.zona).toBe('meta');
    expect(m.valor).toBe(2);
    expect(m.posicao).toBeCloseTo(0.5, 3);
    expect(m.proximoPasso).toBe('anotar repetições até falhar num exercício fixo');
  });

  it('demais: revisão diz 4', () => {
    const m = levantePeso.meta(ctxBase({ semana: semanaBase({ sessoesForca: 4 }) }));
    expect(m.zona).toBe('demais');
    expect(m.proximoPasso).toBe('garantir 48 h entre sessões do mesmo grupo');
  });

  it('sem-dado: nada registrado', () => {
    const m = levantePeso.meta(ctxBase());
    expect(m.zona).toBe('sem-dado');
    expect(m.precisaDe).toEqual(['semana.sessoesForca']);
  });
});
```

- [ ] **Step 7: Rodar e ver falhar**

```
cd app && pnpm vitest run src/dominio/metas/levantePeso.test.ts
```
Saída esperada: `FAIL … Failed to load url ./levantePeso`.

- [ ] **Step 8: Implementar `levantePeso.ts`**

`app/src/dominio/metas/levantePeso.ts`:

```ts
import { pos } from '../derivados';
import { aplicarSeguranca, contarSessoes, semDado, semanaAtual } from './_util';
import type { AcaoMeta, Zona } from './tipos';

export const levantePeso: AcaoMeta = {
  id: 'levante-peso',
  aplica: () => true,
  meta(ctx) {
    const revisao = semanaAtual(ctx);
    const n =
      revisao?.sessoesForca ??
      (ctx.eventos.length > 0 ? contarSessoes(ctx.eventos, 'forca', ctx) : undefined);
    if (n === undefined) return semDado(['semana.sessoesForca'], 'nenhum treino registrado');

    const zona: Zona = n < 1 ? 'pouco' : n < 2 ? 'atencao' : n <= 3 ? 'meta' : 'demais';
    const proximoPasso =
      n < 2
        ? 'uma sessão de 20 min em casa nesta semana: agachamento, flexão, remada'
        : n <= 3
          ? 'anotar repetições até falhar num exercício fixo'
          : 'garantir 48 h entre sessões do mesmo grupo';

    return aplicarSeguranca('levante-peso', ctx.perfil, {
      zona,
      valor: n,
      faixa: { pouco: 1, meta: 2, demais: 3 },
      posicao: pos(n, 2, 3),
      texto: `${n} ${n === 1 ? 'sessão' : 'sessões'}/sem`,
      proximoPasso,
    });
  },
};
```

- [ ] **Step 9: Rodar e ver passar**

```
cd app && pnpm vitest run src/dominio/metas/levantePeso.test.ts
```
Saída esperada: `✓ … (6 tests)`.

- [ ] **Step 10: Commit**

```
git add app/src/dominio/metas/levantePeso.ts app/src/dominio/metas/levantePeso.test.ts
git commit -m "feat: meta levante-peso"
```

- [ ] **Step 11: Teste de `some-150` (falha)**

`app/src/dominio/metas/some150.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { some150 } from './some150';
import { ctxBase, eventoBase, perfilBase, semanaBase } from './_fixtures';

describe('some-150', () => {
  it('aplica a todo perfil', () => {
    expect(some150.id).toBe('some-150');
    expect(some150.aplica(perfilBase)).toBe(true);
  });

  it('pouco: sem revisão, soma eventos moderados dos últimos 7 dias + tiros × 20', () => {
    const m = some150.meta(
      ctxBase({
        eventos: [
          eventoBase('2026-09-15', 'moderado', 30),
          eventoBase('2026-09-12', 'moderado', 30), // dentro dos 7 dias (limite 11/09)
          eventoBase('2026-09-14', 'tiros', 10),
          eventoBase('2026-09-01', 'moderado', 100), // fora da janela de 7 dias
        ],
      }),
    );
    expect(m.zona).toBe('pouco');
    expect(m.valor).toBe(80);
    expect(m.texto).toBe('80 min/sem (tiros contam em dobro)');
    expect(m.proximoPasso).toBe('faltam 70 min: a caminhada pós-jantar de 10 min × 5 dias fecha 50');
    expect(m.posicao).toBeCloseTo(0.383, 2);
    expect(m.faixa).toEqual({ pouco: 150, meta: 300, demais: 600 });
  });

  it('atencao: revisão 320 min + 1 sessão de tiros = 340', () => {
    const m = some150.meta(ctxBase({ semana: semanaBase({ minAtiv: 320, sessoesTiros: 1 }) }));
    expect(m.zona).toBe('atencao');
    expect(m.valor).toBe(340);
    expect(m.proximoPasso).toBe('acima de 300 o retorno para de crescer — ok, sem ganho extra');
  });

  it('meta: revisão 150 + 3 tiros = 210', () => {
    const m = some150.meta(ctxBase({ semana: semanaBase({ minAtiv: 150, sessoesTiros: 3 }) }));
    expect(m.zona).toBe('meta');
    expect(m.valor).toBe(210);
    expect(m.posicao).toBeCloseTo(0.6, 3);
    expect(m.proximoPasso).toBe('manter; se quiser mais, até 300 ainda rende');
  });

  it('revisão sem sessoesTiros usa a contagem de eventos de tiros da semana', () => {
    const m = some150.meta(
      ctxBase({
        semana: semanaBase({ minAtiv: 100 }),
        eventos: [eventoBase('2026-09-14', 'tiros'), eventoBase('2026-09-16', 'tiros')],
      }),
    );
    expect(m.valor).toBe(140);
    expect(m.zona).toBe('pouco');
    expect(m.proximoPasso).toBe('faltam 10 min: a caminhada pós-jantar de 10 min × 5 dias fecha 10');
  });

  it('demais: 700 min', () => {
    const m = some150.meta(ctxBase({ semana: semanaBase({ minAtiv: 700, sessoesTiros: 0 }) }));
    expect(m.zona).toBe('demais');
    expect(m.posicao).toBeCloseTo(0.98, 3);
  });

  it('sem-dado: sem revisão e sem eventos', () => {
    const m = some150.meta(ctxBase());
    expect(m.zona).toBe('sem-dado');
    expect(m.precisaDe).toEqual(['semana.minAtiv']);
  });
});
```

- [ ] **Step 12: Rodar e ver falhar**

```
cd app && pnpm vitest run src/dominio/metas/some150.test.ts
```
Saída esperada: `FAIL … Failed to load url ./some150`.

- [ ] **Step 13: Implementar `some150.ts`**

`app/src/dominio/metas/some150.ts`:

```ts
import { pos } from '../derivados';
import { aplicarSeguranca, contarSessoes, eventosUltimos, semDado, semanaAtual } from './_util';
import type { AcaoMeta, Zona } from './tipos';

export const some150: AcaoMeta = {
  id: 'some-150',
  aplica: () => true,
  meta(ctx) {
    const revisao = semanaAtual(ctx);
    let total: number | undefined;

    if (revisao?.minAtiv !== undefined) {
      const tiros = revisao.sessoesTiros ?? contarSessoes(ctx.eventos, 'tiros', ctx);
      total = revisao.minAtiv + tiros * 20;
    } else if (ctx.eventos.length > 0) {
      const recentes = eventosUltimos(ctx, 7);
      const moderado = recentes.filter((e) => e.tipo === 'moderado').reduce((s, e) => s + e.minutos, 0);
      const tiros = recentes.filter((e) => e.tipo === 'tiros').length;
      total = moderado + tiros * 20;
    }
    if (total === undefined) return semDado(['semana.minAtiv'], 'nenhum treino registrado');

    const t = total;
    const zona: Zona = t < 150 ? 'pouco' : t <= 300 ? 'meta' : t <= 600 ? 'atencao' : 'demais';
    const proximoPasso =
      t < 150
        ? `faltam ${150 - t} min: a caminhada pós-jantar de 10 min × 5 dias fecha ${Math.min(50, 150 - t)}`
        : t <= 300
          ? 'manter; se quiser mais, até 300 ainda rende'
          : 'acima de 300 o retorno para de crescer — ok, sem ganho extra';

    return aplicarSeguranca('some-150', ctx.perfil, {
      zona,
      valor: t,
      faixa: { pouco: 150, meta: 300, demais: 600 },
      posicao: pos(t, 150, 300),
      texto: `${t} min/sem (tiros contam em dobro)`,
      proximoPasso,
    });
  },
};
```

- [ ] **Step 14: Rodar e ver passar**

```
cd app && pnpm vitest run src/dominio/metas/some150.test.ts
```
Saída esperada: `✓ … (7 tests)`.

- [ ] **Step 15: Commit**

```
git add app/src/dominio/metas/some150.ts app/src/dominio/metas/some150.test.ts
git commit -m "feat: meta some-150"
```

- [ ] **Step 16: Teste de `levante-a-cada-30` (falha)**

`app/src/dominio/metas/levanteACada30.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { levanteACada30 } from './levanteACada30';
import { HOJE, ONTEM, ctxBase, diaBase, perfilBase } from './_fixtures';

describe('levante-a-cada-30', () => {
  it('aplica a todo perfil', () => {
    expect(levanteACada30.id).toBe('levante-a-cada-30');
    expect(levanteACada30.aplica(perfilBase)).toBe(true);
  });

  it('pouco: bloco de 90 min', () => {
    const m = levanteACada30.meta(ctxBase({ hoje: diaBase(HOJE, { maiorBloco: 90 }) }));
    expect(m.zona).toBe('pouco');
    expect(m.valor).toBe(90);
    expect(m.texto).toBe('maior bloco: 90 min');
    expect(m.proximoPasso).toBe('um alarme em 60 min esta semana; depois em 30');
    expect(m.posicao).toBe(0.08);
    expect(m.faixa).toEqual({ pouco: 60, meta: 30, demais: 30 });
    expect(m.deDia).toBeUndefined();
  });

  it('atencao: bloco de 45 min; o alarme nunca vai abaixo de 30', () => {
    const m = levanteACada30.meta(ctxBase({ hoje: diaBase(HOJE, { maiorBloco: 45 }) }));
    expect(m.zona).toBe('atencao');
    expect(m.proximoPasso).toBe('um alarme em 30 min esta semana; depois em 30');
    expect(m.posicao).toBe(0.25);
  });

  it('meta: bloco de 25 min', () => {
    const m = levanteACada30.meta(ctxBase({ hoje: diaBase(HOJE, { maiorBloco: 25 }) }));
    expect(m.zona).toBe('meta');
    expect(m.proximoPasso).toBe('manter');
    expect(m.posicao).toBe(0.5);
  });

  it('demais não existe: bloco de 5 min continua na meta', () => {
    const m = levanteACada30.meta(ctxBase({ hoje: diaBase(HOJE, { maiorBloco: 5 }) }));
    expect(m.zona).toBe('meta');
  });

  it('sem-dado: nenhum dia com maiorBloco', () => {
    const m = levanteACada30.meta(ctxBase({ hoje: diaBase(HOJE, { levantadas: 4 }) }));
    expect(m.zona).toBe('sem-dado');
    expect(m.precisaDe).toEqual(['dia.maiorBloco']);
  });

  it('cita as levantadas de hoje no texto e diz de que dia é o bloco', () => {
    const m = levanteACada30.meta(
      ctxBase({ hoje: diaBase(HOJE, { levantadas: 6 }), dias: [diaBase(ONTEM, { maiorBloco: 40 })] }),
    );
    expect(m.texto).toBe('maior bloco: 40 min · levantou 6× hoje');
    expect(m.deDia).toBe(ONTEM);
  });
});
```

- [ ] **Step 17: Rodar e ver falhar**

```
cd app && pnpm vitest run src/dominio/metas/levanteACada30.test.ts
```
Saída esperada: `FAIL … Failed to load url ./levanteACada30`.

- [ ] **Step 18: Implementar `levanteACada30.ts`**

`app/src/dominio/metas/levanteACada30.ts`:

```ts
import { aplicarSeguranca, deDiaSeNaoHoje, semDado, ultimoDiaCom } from './_util';
import type { AcaoMeta, Zona } from './tipos';

export const levanteACada30: AcaoMeta = {
  id: 'levante-a-cada-30',
  aplica: () => true,
  meta(ctx) {
    const dia = ultimoDiaCom(ctx.dias, 'maiorBloco');
    const b = dia?.maiorBloco;
    if (dia === undefined || b === undefined) return semDado(['dia.maiorBloco']);

    const zona: Zona = b <= 30 ? 'meta' : b <= 60 ? 'atencao' : 'pouco';
    const levantadas = ctx.hoje?.levantadas;
    const texto = `maior bloco: ${b} min` + (levantadas === undefined ? '' : ` · levantou ${levantadas}× hoje`);
    const proximoPasso = b <= 30 ? 'manter' : `um alarme em ${Math.max(30, b - 30)} min esta semana; depois em 30`;

    return aplicarSeguranca('levante-a-cada-30', ctx.perfil, {
      zona,
      valor: b,
      faixa: { pouco: 60, meta: 30, demais: 30 },
      posicao: b <= 30 ? 0.5 : b <= 60 ? 0.25 : 0.08,
      texto,
      proximoPasso,
      ...deDiaSeNaoHoje(ctx, dia),
    });
  },
};
```

- [ ] **Step 19: Rodar e ver passar**

```
cd app && pnpm vitest run src/dominio/metas/levanteACada30.test.ts
```
Saída esperada: `✓ … (7 tests)`.

- [ ] **Step 20: Commit**

```
git add app/src/dominio/metas/levanteACada30.ts app/src/dominio/metas/levanteACada30.test.ts
git commit -m "feat: meta levante-a-cada-30"
```

- [ ] **Step 21: Teste de `ande-depois-do-jantar` (falha)**

`app/src/dominio/metas/andeDepoisDoJantar.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { andeDepoisDoJantar } from './andeDepoisDoJantar';
import { HOJE, ONTEM, ctxBase, diaBase, perfilBase } from './_fixtures';

describe('ande-depois-do-jantar', () => {
  it('aplica a todo perfil', () => {
    expect(andeDepoisDoJantar.id).toBe('ande-depois-do-jantar');
    expect(andeDepoisDoJantar.aplica(perfilBase)).toBe(true);
  });

  it('pouco: 0 min', () => {
    const m = andeDepoisDoJantar.meta(ctxBase({ hoje: diaBase(HOJE, { minPosJantar: 0 }) }));
    expect(m.zona).toBe('pouco');
    expect(m.valor).toBe(0);
    expect(m.texto).toBe('0 min depois do jantar');
    expect(m.proximoPasso).toBe('5 minutos de pé andando na sala, hoje');
    expect(m.posicao).toBe(0.06);
    expect(m.faixa).toEqual({ pouco: 0, meta: 10, demais: 30 });
  });

  it('atencao: 4 min, próximo passo +5 sem passar de 10', () => {
    const m = andeDepoisDoJantar.meta(ctxBase({ hoje: diaBase(HOJE, { minPosJantar: 4 }) }));
    expect(m.zona).toBe('atencao');
    expect(m.proximoPasso).toBe('chegar a 9 min (mais 5 que da última vez)');
    expect(m.posicao).toBe(0.25);

    const m2 = andeDepoisDoJantar.meta(ctxBase({ hoje: diaBase(HOJE, { minPosJantar: 8 }) }));
    expect(m2.proximoPasso).toBe('chegar a 10 min (mais 5 que da última vez)');
  });

  it('meta: 15 min', () => {
    const m = andeDepoisDoJantar.meta(ctxBase({ hoje: diaBase(HOJE, { minPosJantar: 15 }) }));
    expect(m.zona).toBe('meta');
    expect(m.proximoPasso).toBe('manter; se quiser, até 30 min');
    expect(m.posicao).toBe(0.5);
  });

  it('demais não existe: 45 min continua na meta', () => {
    const m = andeDepoisDoJantar.meta(ctxBase({ hoje: diaBase(HOJE, { minPosJantar: 45 }) }));
    expect(m.zona).toBe('meta');
  });

  it('sem-dado', () => {
    const m = andeDepoisDoJantar.meta(ctxBase({ hoje: diaBase(HOJE) }));
    expect(m.zona).toBe('sem-dado');
    expect(m.precisaDe).toEqual(['dia.minPosJantar']);
  });

  it('usa o último dia com o campo', () => {
    const m = andeDepoisDoJantar.meta(ctxBase({ hoje: diaBase(HOJE), dias: [diaBase(ONTEM, { minPosJantar: 12 })] }));
    expect(m.valor).toBe(12);
    expect(m.deDia).toBe(ONTEM);
  });
});
```

- [ ] **Step 22: Rodar e ver falhar**

```
cd app && pnpm vitest run src/dominio/metas/andeDepoisDoJantar.test.ts
```
Saída esperada: `FAIL … Failed to load url ./andeDepoisDoJantar`.

- [ ] **Step 23: Implementar `andeDepoisDoJantar.ts`**

`app/src/dominio/metas/andeDepoisDoJantar.ts`:

```ts
import { aplicarSeguranca, deDiaSeNaoHoje, semDado, ultimoDiaCom } from './_util';
import type { AcaoMeta, Zona } from './tipos';

export const andeDepoisDoJantar: AcaoMeta = {
  id: 'ande-depois-do-jantar',
  aplica: () => true,
  meta(ctx) {
    const dia = ultimoDiaCom(ctx.dias, 'minPosJantar');
    const m = dia?.minPosJantar;
    if (dia === undefined || m === undefined) return semDado(['dia.minPosJantar']);

    const zona: Zona = m >= 10 ? 'meta' : m > 0 ? 'atencao' : 'pouco';
    const proximoPasso =
      m >= 10
        ? 'manter; se quiser, até 30 min'
        : m > 0
          ? `chegar a ${Math.min(10, m + 5)} min (mais 5 que da última vez)`
          : '5 minutos de pé andando na sala, hoje';

    return aplicarSeguranca('ande-depois-do-jantar', ctx.perfil, {
      zona,
      valor: m,
      faixa: { pouco: 0, meta: 10, demais: 30 },
      posicao: m >= 10 ? 0.5 : m > 0 ? 0.25 : 0.06,
      texto: `${m} min depois do jantar`,
      proximoPasso,
      ...deDiaSeNaoHoje(ctx, dia),
    });
  },
};
```

- [ ] **Step 24: Rodar e ver passar**

```
cd app && pnpm vitest run src/dominio/metas/andeDepoisDoJantar.test.ts
```
Saída esperada: `✓ … (7 tests)`.

- [ ] **Step 25: Commit**

```
git add app/src/dominio/metas/andeDepoisDoJantar.ts app/src/dominio/metas/andeDepoisDoJantar.test.ts
git commit -m "feat: meta ande-depois-do-jantar"
```

- [ ] **Step 26: Teste de `nunca-dois-dias` (falha)**

`app/src/dominio/metas/nuncaDoisDias.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { nuncaDoisDias } from './nuncaDoisDias';
import { HOJE, ctxBase, diaBase, perfilBase } from './_fixtures';

/** O contador vem de derivados.diasParado (plano 01); aqui ele é fixado por override. */
function ctxParado(diasParado: number) {
  return ctxBase({ hoje: diaBase(HOJE, { moveu: false }), derivados: { diasParado } });
}

describe('nunca-dois-dias', () => {
  it('aplica a todo perfil', () => {
    expect(nuncaDoisDias.id).toBe('nunca-dois-dias');
    expect(nuncaDoisDias.aplica(perfilBase)).toBe(true);
  });

  it('pouco: 3 dias parado', () => {
    const m = nuncaDoisDias.meta(ctxParado(3));
    expect(m.zona).toBe('pouco');
    expect(m.valor).toBe(3);
    expect(m.texto).toBe('3 dia(s) seguido(s) parado — 48 h: transcritos já mudam');
    expect(m.proximoPasso).toBe('10 minutos de caminhada hoje zeram o contador');
    expect(m.posicao).toBe(0.06);
    expect(m.faixa).toEqual({ pouco: 3, meta: 1, demais: 1 });
  });

  it('pouco: 5 dias mostra o custo em citrato sintase', () => {
    const m = nuncaDoisDias.meta(ctxParado(5));
    expect(m.zona).toBe('pouco');
    expect(m.texto).toBe('5 dia(s) seguido(s) parado — 4+ dias: já mensurável em citrato sintase');
  });

  it('atencao: 2 dias', () => {
    const m = nuncaDoisDias.meta(ctxParado(2));
    expect(m.zona).toBe('atencao');
    expect(m.texto).toBe('2 dia(s) seguido(s) parado — 48 h: transcritos já mudam');
    expect(m.posicao).toBe(0.25);
  });

  it('meta: 0 ou 1 dia', () => {
    const m0 = nuncaDoisDias.meta(ctxParado(0));
    expect(m0.zona).toBe('meta');
    expect(m0.texto).toBe('0 dia(s) seguido(s) parado');
    expect(m0.proximoPasso).toBe('contador zerado');
    expect(m0.posicao).toBe(0.45);
    expect(nuncaDoisDias.meta(ctxParado(1)).zona).toBe('meta');
  });

  it('demais não existe: nunca sai de meta por mover muito', () => {
    expect(nuncaDoisDias.meta(ctxParado(0)).zona).not.toBe('demais');
  });

  it('sem-dado: nenhum dia e nenhum evento registrados', () => {
    const m = nuncaDoisDias.meta(ctxBase());
    expect(m.zona).toBe('sem-dado');
    expect(m.precisaDe).toEqual(['dia.moveu']);
  });
});
```

- [ ] **Step 27: Rodar e ver falhar**

```
cd app && pnpm vitest run src/dominio/metas/nuncaDoisDias.test.ts
```
Saída esperada: `FAIL … Failed to load url ./nuncaDoisDias`.

- [ ] **Step 28: Implementar `nuncaDoisDias.ts`**

`app/src/dominio/metas/nuncaDoisDias.ts`:

```ts
import { aplicarSeguranca, semDado } from './_util';
import type { AcaoMeta, Zona } from './tipos';

export const nuncaDoisDias: AcaoMeta = {
  id: 'nunca-dois-dias',
  aplica: () => true,
  meta(ctx) {
    if (ctx.dias.length === 0 && ctx.eventos.length === 0) {
      return semDado(['dia.moveu'], 'ainda sem registro de movimento');
    }
    const n = ctx.derivados.diasParado;
    const zona: Zona = n <= 1 ? 'meta' : n <= 2 ? 'atencao' : 'pouco';
    const custo =
      n >= 4 ? ' — 4+ dias: já mensurável em citrato sintase' : n >= 2 ? ' — 48 h: transcritos já mudam' : '';

    return aplicarSeguranca('nunca-dois-dias', ctx.perfil, {
      zona,
      valor: n,
      faixa: { pouco: 3, meta: 1, demais: 1 },
      posicao: n <= 1 ? 0.45 : n <= 2 ? 0.25 : 0.06,
      texto: `${n} dia(s) seguido(s) parado${custo}`,
      proximoPasso: n <= 1 ? 'contador zerado' : '10 minutos de caminhada hoje zeram o contador',
    });
  },
};
```

- [ ] **Step 29: Rodar e ver passar**

```
cd app && pnpm vitest run src/dominio/metas/nuncaDoisDias.test.ts
```
Saída esperada: `✓ … (7 tests)`.

- [ ] **Step 30: Commit**

```
git add app/src/dominio/metas/nuncaDoisDias.ts app/src/dominio/metas/nuncaDoisDias.test.ts
git commit -m "feat: meta nunca-dois-dias"
```

- [ ] **Step 31: Teste de `seis-mil-passos` (falha)**

`app/src/dominio/metas/seisMilPassos.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { seisMilPassos } from './seisMilPassos';
import { HOJE, ONTEM, ctxBase, diaBase, perfilBase } from './_fixtures';

describe('seis-mil-passos', () => {
  it('aplica a todo perfil', () => {
    expect(seisMilPassos.id).toBe('seis-mil-passos');
    expect(seisMilPassos.aplica(perfilBase)).toBe(true);
  });

  it('pouco: abaixo de 2 mil; próximo passo +500', () => {
    const m = seisMilPassos.meta(ctxBase({ hoje: diaBase(HOJE, { passos: 1500 }) }));
    expect(m.zona).toBe('pouco');
    expect(m.valor).toBe(1500);
    expect(m.texto).toBe('1500 passos/dia');
    expect(m.proximoPasso).toBe('meta desta semana: 2000 passos/dia (+500)');
    expect(m.faixa).toEqual({ pouco: 2000, meta: 5000, demais: 10000 });
    expect(m.posicao).toBeCloseTo(0.062, 2);
    expect(m.deDia).toBeUndefined();
  });

  it('atencao: 3540 → próximo passo 4000 (arredonda à centena)', () => {
    const m = seisMilPassos.meta(ctxBase({ hoje: diaBase(HOJE, { passos: 3540 }) }));
    expect(m.zona).toBe('atencao');
    expect(m.proximoPasso).toBe('meta desta semana: 4000 passos/dia (+500)');
  });

  it('nunca salta para além da meta: 4800 → 5000', () => {
    const m = seisMilPassos.meta(ctxBase({ hoje: diaBase(HOJE, { passos: 4800 }) }));
    expect(m.proximoPasso).toBe('meta desta semana: 5000 passos/dia (+500)');
  });

  it('meta: 6 mil', () => {
    const m = seisMilPassos.meta(ctxBase({ hoje: diaBase(HOJE, { passos: 6000 }) }));
    expect(m.zona).toBe('meta');
    expect(m.posicao).toBeCloseTo(0.625, 3);
    expect(m.proximoPasso).toBe('na meta; 7–10 mil ainda soma');
  });

  it('demais não existe: 12 mil continua na meta, com texto de inflexão', () => {
    const m = seisMilPassos.meta(ctxBase({ hoje: diaBase(HOJE, { passos: 12000 }) }));
    expect(m.zona).toBe('meta');
    expect(m.proximoPasso).toBe('acima da inflexão — manter');
    expect(m.posicao).toBeCloseTo(0.98, 3);
  });

  it('sem-dado: nenhum dia com passos', () => {
    const m = seisMilPassos.meta(ctxBase({ hoje: diaBase(HOJE) }));
    expect(m.zona).toBe('sem-dado');
    expect(m.valor).toBeNull();
    expect(m.precisaDe).toEqual(['dia.passos']);
  });

  it('usa o último dia com o campo e diz de que dia é', () => {
    const m = seisMilPassos.meta(ctxBase({ hoje: diaBase(HOJE), dias: [diaBase(ONTEM, { passos: 4000 })] }));
    expect(m.valor).toBe(4000);
    expect(m.deDia).toBe(ONTEM);
  });
});
```

- [ ] **Step 32: Rodar e ver falhar**

```
cd app && pnpm vitest run src/dominio/metas/seisMilPassos.test.ts
```
Saída esperada: `FAIL … Failed to load url ./seisMilPassos`.

- [ ] **Step 33: Implementar `seisMilPassos.ts`**

`app/src/dominio/metas/seisMilPassos.ts`:

```ts
import { pos } from '../derivados';
import { aplicarSeguranca, deDiaSeNaoHoje, semDado, ultimoDiaCom } from './_util';
import type { AcaoMeta, Zona } from './tipos';

const META = 5000;

export const seisMilPassos: AcaoMeta = {
  id: 'seis-mil-passos',
  aplica: () => true,
  meta(ctx) {
    const dia = ultimoDiaCom(ctx.dias, 'passos');
    const n = dia?.passos;
    if (dia === undefined || n === undefined) return semDado(['dia.passos']);

    const zona: Zona = n < 2000 ? 'pouco' : n < META ? 'atencao' : 'meta';
    // Spec §6: +500 por semana (a PoC usava +1000); arredonda à centena e nunca passa da meta.
    const proximo = Math.min(META, Math.round((n + 500) / 100) * 100);
    const proximoPasso =
      n < META
        ? `meta desta semana: ${proximo} passos/dia (+500)`
        : n <= 7000
          ? 'na meta; 7–10 mil ainda soma'
          : 'acima da inflexão — manter';

    return aplicarSeguranca('seis-mil-passos', ctx.perfil, {
      zona,
      valor: n,
      faixa: { pouco: 2000, meta: META, demais: 10000 },
      posicao: pos(n, 5000, 7000),
      texto: `${n} passos/dia`,
      proximoPasso,
      ...deDiaSeNaoHoje(ctx, dia),
    });
  },
};
```

- [ ] **Step 34: Rodar e ver passar**

```
cd app && pnpm vitest run src/dominio/metas/seisMilPassos.test.ts
```
Saída esperada: `✓ … (8 tests)`.

- [ ] **Step 35: Commit**

```
git add app/src/dominio/metas/seisMilPassos.ts app/src/dominio/metas/seisMilPassos.test.ts
git commit -m "feat: meta seis-mil-passos"
```

- [ ] **Step 36: Verificação do grupo**

```
cd app && pnpm vitest run src/dominio/metas && pnpm exec tsc --noEmit && pnpm lint
```
Saída esperada: todos os testes verdes, `tsc` sem erros, lint sem erros. Se `tsc` reclamar de `deDia` com `exactOptionalPropertyTypes`, o `tsconfig` do plano 01 não deveria ativá-lo — não altere o tsconfig; ajuste `deDiaSeNaoHoje` para devolver `Pick<Meta, 'deDia'>`.

---

### Task 4: Grupo Sono e ritmo (4 ações)

**Files:**
- Create: `app/src/dominio/metas/durma7.ts`, `ultimoCafe.ts`, `janteCedo.ts`, `anoteOSono.ts`
- Test: `app/src/dominio/metas/durma7.test.ts`, `ultimoCafe.test.ts`, `janteCedo.test.ts`, `anoteOSono.test.ts`

**Interfaces:**
- Consumes: `pos`, `horaParaMin`, `minParaHora`, `horasEntre`, `r1` (`../derivados`); `Hora`, `Dia` (`../tipos`); helpers de `./_util`.
- Produces: `export const durma7: AcaoMeta`, `ultimoCafe`, `janteCedo`, `anoteOSono`.

Regras:

| ação | valor | pouco | atencao | meta | demais | posição |
|---|---|---|---|---|---|---|
| durma-7 | `derivados.sonoHoras` | < 6 | 6–6,9 **e** > 8,5 | 7–8,5 | não há | `pos(hs, 7, 8)` |
| ultimo-cafe | horas entre último café e `perfil.deitar` | não há ("sem cafeína" = meta) | 6–8,9 | ≥ 9 | < 6 | 0.5 / 0.72 / 0.9 |
| jante-cedo | horas entre `jantarFim` e `perfil.deitar` | não há | 1–2,9 | ≥ 3 | < 1 | 0.5 / 0.72 / 0.9 |
| anote-o-sono | só registro | — | — | hoje tem `deitou` e `levantou` | — | null |

Próximo passo incremental (spec §6): deitar/café/jantar mudam 15 min por vez, e nunca além do alvo (`Math.min(15, minutosQueFaltam)`).

- [ ] **Step 1: Teste de `durma-7` (falha)**

`app/src/dominio/metas/durma7.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { durma7 } from './durma7';
import { HOJE, ONTEM, ctxBase, diaBase, perfilBase } from './_fixtures';

/** O valor vem de derivados.sonoHoras (plano 01): (levantou − deitou) − 0,33. Fixamos por override, com dias coerentes. */
function ctxSono(deitou: string, levantou: string, sonoHoras: number) {
  return ctxBase({ hoje: diaBase(HOJE, { deitou, levantou }), derivados: { sonoHoras } });
}

describe('durma-7', () => {
  it('aplica a todo perfil', () => {
    expect(durma7.id).toBe('durma-7');
    expect(durma7.aplica(perfilBase)).toBe(true);
  });

  it('pouco: 5,2 h de sono; próximo passo é deitar 15 min antes até levantar − 7h30', () => {
    const m = durma7.meta(ctxSono('01:00', '06:30', 5.2));
    expect(m.zona).toBe('pouco');
    expect(m.valor).toBe(5.2);
    expect(m.texto).toBe('5.2 h de sono (5.5 h na cama)');
    expect(m.proximoPasso).toBe('deitar 15 min antes por uma semana, até chegar às 23:00');
    expect(m.faixa).toEqual({ pouco: 6, meta: 7, demais: 8.5 });
    expect(m.posicao).toBeCloseTo(0.05, 3);
    expect(m.deDia).toBeUndefined();
  });

  it('atencao: 6,7 h', () => {
    const m = durma7.meta(ctxSono('23:30', '06:30', 6.7));
    expect(m.zona).toBe('atencao');
    expect(m.proximoPasso).toBe('deitar 15 min antes por uma semana, até chegar às 23:00');
    expect(m.posicao).toBeCloseTo(0.425, 3);
  });

  it('meta: 7,7 h', () => {
    const m = durma7.meta(ctxSono('22:30', '06:30', 7.7));
    expect(m.zona).toBe('meta');
    expect(m.proximoPasso).toBe('manter o horário; anotar a variação');
    expect(m.posicao).toBeCloseTo(0.675, 3);
  });

  it('demais não existe: 9,2 h vira atencao', () => {
    const m = durma7.meta(ctxSono('21:00', '06:30', 9.2));
    expect(m.zona).toBe('atencao');
    expect(m.proximoPasso).toBe('mais de 8,5 h: manter o horário e anotar como acordou');
  });

  it('sem-dado: nenhum dia com deitou e levantou', () => {
    const m = durma7.meta(ctxBase({ hoje: diaBase(HOJE, { levantou: '06:30' }), derivados: { sonoHoras: null } }));
    expect(m.zona).toBe('sem-dado');
    expect(m.precisaDe).toEqual(['dia.deitou', 'dia.levantou']);
  });

  it('diz de que dia é quando o sono é de ontem', () => {
    const m = durma7.meta(
      ctxBase({
        hoje: diaBase(HOJE),
        dias: [diaBase(ONTEM, { deitou: '22:30', levantou: '06:30' })],
        derivados: { sonoHoras: 7.7 },
      }),
    );
    expect(m.zona).toBe('meta');
    expect(m.deDia).toBe(ONTEM);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

```
cd app && pnpm vitest run src/dominio/metas/durma7.test.ts
```
Saída esperada: `FAIL … Failed to load url ./durma7`.

- [ ] **Step 3: Implementar `durma7.ts`**

`app/src/dominio/metas/durma7.ts`:

```ts
import { horaParaMin, minParaHora, pos, r1 } from '../derivados';
import { aplicarSeguranca, deDiaSeNaoHoje, semDado } from './_util';
import type { AcaoMeta, Zona } from './tipos';

export const durma7: AcaoMeta = {
  id: 'durma-7',
  aplica: () => true,
  meta(ctx) {
    const hs = ctx.derivados.sonoHoras;
    const dia = ctx.dias.find((d) => d.deitou !== undefined && d.levantou !== undefined);
    if (hs === null || dia === undefined) return semDado(['dia.deitou', 'dia.levantou']);

    const zona: Zona = hs < 6 ? 'pouco' : hs < 7 ? 'atencao' : hs <= 8.5 ? 'meta' : 'atencao';
    const deitarIdeal = minParaHora(horaParaMin(ctx.perfil.levantar) - 450); // levantar − 7 h 30
    const proximoPasso =
      hs < 7
        ? `deitar 15 min antes por uma semana, até chegar às ${deitarIdeal}`
        : hs > 8.5
          ? 'mais de 8,5 h: manter o horário e anotar como acordou'
          : 'manter o horário; anotar a variação';

    return aplicarSeguranca('durma-7', ctx.perfil, {
      zona,
      valor: r1(hs),
      faixa: { pouco: 6, meta: 7, demais: 8.5 },
      posicao: pos(hs, 7, 8),
      texto: `${r1(hs)} h de sono (${r1(hs + 0.33)} h na cama)`,
      proximoPasso,
      ...deDiaSeNaoHoje(ctx, dia),
    });
  },
};
```

- [ ] **Step 4: Rodar e ver passar**

```
cd app && pnpm vitest run src/dominio/metas/durma7.test.ts
```
Saída esperada: `✓ … (7 tests)`.

- [ ] **Step 5: Commit**

```
git add app/src/dominio/metas/durma7.ts app/src/dominio/metas/durma7.test.ts
git commit -m "feat: meta durma-7"
```

- [ ] **Step 6: Teste de `ultimo-cafe` (falha)**

`app/src/dominio/metas/ultimoCafe.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { ultimoCafe } from './ultimoCafe';
import { HOJE, ONTEM, ctxBase, diaBase, perfilBase } from './_fixtures';

// perfilBase deita às 23:30 → corte = 14:30 (9 h antes), limite = 17:30 (6 h antes)

describe('ultimo-cafe', () => {
  it('aplica só quando o perfil toma café', () => {
    expect(ultimoCafe.id).toBe('ultimo-cafe');
    expect(ultimoCafe.aplica({ ...perfilBase, cafe: 'nao' })).toBe(false);
    expect(ultimoCafe.aplica({ ...perfilBase, cafe: 'as-vezes' })).toBe(true);
    expect(ultimoCafe.aplica({ ...perfilBase, cafe: 'diario' })).toBe(true);
  });

  it('pouco não existe: sem café em todos os dias registrados é meta', () => {
    const m = ultimoCafe.meta(
      ctxBase({ hoje: diaBase(HOJE, { ultimoCafe: null }), dias: [diaBase(ONTEM, { ultimoCafe: null })] }),
    );
    expect(m.zona).toBe('meta');
    expect(m.valor).toBeNull();
    expect(m.texto).toBe('sem café nesta semana');
    expect(m.proximoPasso).toBe('se um dia tomar, antes das 14:30');
    expect(m.posicao).toBe(0.5);
    expect(m.faixa).toEqual({ pouco: 9, meta: 9, demais: 6 });
  });

  it('atencao: café às 16:00 (7,5 h antes); próximo passo 15 min mais cedo', () => {
    const m = ultimoCafe.meta(ctxBase({ hoje: diaBase(HOJE, { ultimoCafe: '16:00' }) }));
    expect(m.zona).toBe('atencao');
    expect(m.valor).toBe(7.5);
    expect(m.texto).toBe('último café 7.5 h antes de deitar');
    expect(m.proximoPasso).toBe('último café 15 min mais cedo: até 15:45 (a meta é antes das 14:30)');
    expect(m.posicao).toBe(0.72);
    expect(m.deDia).toBeUndefined();
  });

  it('perto da meta o passo encolhe para não passar dela: 14:36 → 14:30', () => {
    const m = ultimoCafe.meta(ctxBase({ hoje: diaBase(HOJE, { ultimoCafe: '14:36' }) }));
    expect(m.zona).toBe('atencao');
    expect(m.proximoPasso).toBe('último café 6 min mais cedo: até 14:30 (a meta é antes das 14:30)');
  });

  it('meta: café às 13:00 (10,5 h antes)', () => {
    const m = ultimoCafe.meta(ctxBase({ hoje: diaBase(HOJE, { ultimoCafe: '13:00' }) }));
    expect(m.zona).toBe('meta');
    expect(m.valor).toBe(10.5);
    expect(m.proximoPasso).toBe('manter');
    expect(m.posicao).toBe(0.5);
  });

  it('demais: café às 20:00 (3,5 h antes)', () => {
    const m = ultimoCafe.meta(ctxBase({ hoje: diaBase(HOJE, { ultimoCafe: '20:00' }) }));
    expect(m.zona).toBe('demais');
    expect(m.posicao).toBe(0.9);
    expect(m.proximoPasso).toBe('último café 15 min mais cedo: até 19:45 (a meta é antes das 14:30)');
  });

  it('sem-dado: nenhum dia com ultimoCafe nos últimos 7 dias', () => {
    expect(ultimoCafe.meta(ctxBase({ hoje: diaBase(HOJE) })).zona).toBe('sem-dado');
    const antigo = ultimoCafe.meta(ctxBase({ dias: [diaBase('2026-09-01', { ultimoCafe: '20:00' })] }));
    expect(antigo.zona).toBe('sem-dado');
    expect(antigo.precisaDe).toEqual(['dia.ultimoCafe']);
  });

  it('as-vezes: avalia só os dias com café e diz "nos dias em que tomar"', () => {
    const m = ultimoCafe.meta(
      ctxBase({
        perfil: { ...perfilBase, cafe: 'as-vezes' },
        hoje: diaBase(HOJE, { ultimoCafe: null }),
        dias: [diaBase(ONTEM, { ultimoCafe: '16:00' })],
      }),
    );
    expect(m.zona).toBe('atencao');
    expect(m.valor).toBe(7.5);
    expect(m.texto).toBe('nos dias em que tomar, antes das 14:30 — último: 7.5 h antes de deitar');
    expect(m.deDia).toBe(ONTEM);
  });
});
```

- [ ] **Step 7: Rodar e ver falhar**

```
cd app && pnpm vitest run src/dominio/metas/ultimoCafe.test.ts
```
Saída esperada: `FAIL … Failed to load url ./ultimoCafe`.

- [ ] **Step 8: Implementar `ultimoCafe.ts`**

`app/src/dominio/metas/ultimoCafe.ts`:

```ts
import { horaParaMin, horasEntre, minParaHora, r1 } from '../derivados';
import type { Dia, Hora } from '../tipos';
import { aplicarSeguranca, deDiaSeNaoHoje, diasUltimos, semDado } from './_util';
import type { AcaoMeta, Faixa, Zona } from './tipos';

const FAIXA: Faixa = { pouco: 9, meta: 9, demais: 6 }; // horas antes de deitar

export const ultimoCafe: AcaoMeta = {
  id: 'ultimo-cafe',
  aplica: (perfil) => perfil.cafe !== 'nao',
  meta(ctx) {
    const deitarMin = horaParaMin(ctx.perfil.deitar);
    const corte = minParaHora(deitarMin - 540); // 9 h antes
    const esporadico = ctx.perfil.cafe === 'as-vezes';

    // Só os últimos 7 dias; undefined = não registrou, null = não tomou.
    const registrados = diasUltimos(ctx, 7).filter((d) => d.ultimoCafe !== undefined);
    if (registrados.length === 0) return semDado(['dia.ultimoCafe']);

    const comCafe = registrados.flatMap((d): Array<{ dia: Dia; hora: Hora }> =>
      d.ultimoCafe ? [{ dia: d, hora: d.ultimoCafe }] : [],
    );
    if (comCafe.length === 0) {
      return aplicarSeguranca('ultimo-cafe', ctx.perfil, {
        zona: 'meta',
        valor: null,
        faixa: FAIXA,
        posicao: 0.5,
        texto: 'sem café nesta semana',
        proximoPasso: `se um dia tomar, antes das ${corte}`,
      });
    }

    const { dia, hora } = comCafe[0]; // o mais recente
    const dh = horasEntre(hora, ctx.perfil.deitar);
    const zona: Zona = dh >= 9 ? 'meta' : dh >= 6 ? 'atencao' : 'demais';

    const passoMin = Math.min(15, Math.round((9 - dh) * 60));
    const alvo = minParaHora(horaParaMin(hora) - passoMin);
    const proximoPasso =
      zona === 'meta' ? 'manter' : `último café ${passoMin} min mais cedo: até ${alvo} (a meta é antes das ${corte})`;
    const texto = esporadico
      ? `nos dias em que tomar, antes das ${corte} — último: ${r1(dh)} h antes de deitar`
      : `último café ${r1(dh)} h antes de deitar`;

    return aplicarSeguranca('ultimo-cafe', ctx.perfil, {
      zona,
      valor: r1(dh),
      faixa: FAIXA,
      posicao: dh >= 9 ? 0.5 : dh >= 6 ? 0.72 : 0.9,
      texto,
      proximoPasso,
      ...deDiaSeNaoHoje(ctx, dia),
    });
  },
};
```

- [ ] **Step 9: Rodar e ver passar**

```
cd app && pnpm vitest run src/dominio/metas/ultimoCafe.test.ts
```
Saída esperada: `✓ … (8 tests)`.

- [ ] **Step 10: Commit**

```
git add app/src/dominio/metas/ultimoCafe.ts app/src/dominio/metas/ultimoCafe.test.ts
git commit -m "feat: meta ultimo-cafe"
```

- [ ] **Step 11: Teste de `jante-cedo` (falha)**

`app/src/dominio/metas/janteCedo.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { janteCedo } from './janteCedo';
import { HOJE, ONTEM, ctxBase, diaBase, perfilBase } from './_fixtures';

// perfilBase deita às 23:30 → jantar ideal até 20:30

describe('jante-cedo', () => {
  it('aplica a todo perfil', () => {
    expect(janteCedo.id).toBe('jante-cedo');
    expect(janteCedo.aplica(perfilBase)).toBe(true);
  });

  it('pouco não existe: jantar às 17:00 (6,5 h antes) é meta', () => {
    const m = janteCedo.meta(ctxBase({ hoje: diaBase(HOJE, { jantarFim: '17:00' }) }));
    expect(m.zona).toBe('meta');
    expect(m.valor).toBe(6.5);
  });

  it('atencao: jantar às 21:30 (2 h antes); próximo passo 15 min mais cedo', () => {
    const m = janteCedo.meta(ctxBase({ hoje: diaBase(HOJE, { jantarFim: '21:30' }) }));
    expect(m.zona).toBe('atencao');
    expect(m.valor).toBe(2);
    expect(m.texto).toBe('jantar termina 2 h antes de deitar');
    expect(m.proximoPasso).toBe('terminar o jantar 15 min mais cedo esta semana: até 21:15 (a meta é até 20:30)');
    expect(m.posicao).toBe(0.72);
    expect(m.faixa).toEqual({ pouco: 3, meta: 3, demais: 1 });
  });

  it('meta: jantar às 20:00 (3,5 h antes)', () => {
    const m = janteCedo.meta(ctxBase({ hoje: diaBase(HOJE, { jantarFim: '20:00' }) }));
    expect(m.zona).toBe('meta');
    expect(m.proximoPasso).toBe('manter');
    expect(m.posicao).toBe(0.5);
  });

  it('demais: jantar às 23:00 (0,5 h antes)', () => {
    const m = janteCedo.meta(ctxBase({ hoje: diaBase(HOJE, { jantarFim: '23:00' }) }));
    expect(m.zona).toBe('demais');
    expect(m.posicao).toBe(0.9);
    expect(m.proximoPasso).toBe('terminar o jantar 15 min mais cedo esta semana: até 22:45 (a meta é até 20:30)');
  });

  it('sem-dado', () => {
    const m = janteCedo.meta(ctxBase({ hoje: diaBase(HOJE) }));
    expect(m.zona).toBe('sem-dado');
    expect(m.precisaDe).toEqual(['dia.jantarFim']);
  });

  it('usa o último dia com jantarFim', () => {
    const m = janteCedo.meta(ctxBase({ hoje: diaBase(HOJE), dias: [diaBase(ONTEM, { jantarFim: '20:00' })] }));
    expect(m.zona).toBe('meta');
    expect(m.deDia).toBe(ONTEM);
  });
});
```

- [ ] **Step 12: Rodar e ver falhar**

```
cd app && pnpm vitest run src/dominio/metas/janteCedo.test.ts
```
Saída esperada: `FAIL … Failed to load url ./janteCedo`.

- [ ] **Step 13: Implementar `janteCedo.ts`**

`app/src/dominio/metas/janteCedo.ts`:

```ts
import { horaParaMin, horasEntre, minParaHora, r1 } from '../derivados';
import { aplicarSeguranca, deDiaSeNaoHoje, semDado, ultimoDiaCom } from './_util';
import type { AcaoMeta, Zona } from './tipos';

export const janteCedo: AcaoMeta = {
  id: 'jante-cedo',
  aplica: () => true,
  meta(ctx) {
    const dia = ultimoDiaCom(ctx.dias, 'jantarFim');
    const jantar = dia?.jantarFim;
    if (dia === undefined || jantar === undefined) return semDado(['dia.jantarFim']);

    const ideal = minParaHora(horaParaMin(ctx.perfil.deitar) - 180); // 3 h antes
    const dh = horasEntre(jantar, ctx.perfil.deitar);
    const zona: Zona = dh >= 3 ? 'meta' : dh >= 1 ? 'atencao' : 'demais';

    const passoMin = Math.min(15, Math.round((3 - dh) * 60));
    const alvo = minParaHora(horaParaMin(jantar) - passoMin);
    const proximoPasso =
      zona === 'meta'
        ? 'manter'
        : `terminar o jantar ${passoMin} min mais cedo esta semana: até ${alvo} (a meta é até ${ideal})`;

    return aplicarSeguranca('jante-cedo', ctx.perfil, {
      zona,
      valor: r1(dh),
      faixa: { pouco: 3, meta: 3, demais: 1 },
      posicao: dh >= 3 ? 0.5 : dh >= 1 ? 0.72 : 0.9,
      texto: `jantar termina ${r1(dh)} h antes de deitar`,
      proximoPasso,
      ...deDiaSeNaoHoje(ctx, dia),
    });
  },
};
```

- [ ] **Step 14: Rodar e ver passar**

```
cd app && pnpm vitest run src/dominio/metas/janteCedo.test.ts
```
Saída esperada: `✓ … (7 tests)`.

- [ ] **Step 15: Commit**

```
git add app/src/dominio/metas/janteCedo.ts app/src/dominio/metas/janteCedo.test.ts
git commit -m "feat: meta jante-cedo"
```

- [ ] **Step 16: Teste de `anote-o-sono` (falha)**

`app/src/dominio/metas/anoteOSono.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { anoteOSono } from './anoteOSono';
import { HOJE, ONTEM, ctxBase, diaBase, perfilBase } from './_fixtures';

describe('anote-o-sono (só registro)', () => {
  it('aplica a todo perfil', () => {
    expect(anoteOSono.id).toBe('anote-o-sono');
    expect(anoteOSono.aplica(perfilBase)).toBe(true);
  });

  it('meta: hoje tem deitou e levantou', () => {
    const m = anoteOSono.meta(ctxBase({ hoje: diaBase(HOJE, { deitou: '23:00', levantou: '06:30' }) }));
    expect(m).toEqual({
      zona: 'meta',
      valor: null,
      faixa: null,
      posicao: null,
      texto: 'registrado',
      proximoPasso: 'manter o registro diário',
    });
  });

  it('sem-dado: só levantou', () => {
    const m = anoteOSono.meta(ctxBase({ hoje: diaBase(HOJE, { levantou: '06:30' }) }));
    expect(m.zona).toBe('sem-dado');
    expect(m.precisaDe).toEqual(['dia.deitou', 'dia.levantou']);
    expect(m.texto).toBe('sem registro hoje');
  });

  it('sem-dado: sem dia de hoje', () => {
    expect(anoteOSono.meta(ctxBase()).zona).toBe('sem-dado');
  });

  it('sem-dado: ontem completo não conta como hoje', () => {
    const m = anoteOSono.meta(
      ctxBase({ hoje: diaBase(HOJE), dias: [diaBase(ONTEM, { deitou: '23:00', levantou: '06:30' })] }),
    );
    expect(m.zona).toBe('sem-dado');
  });

  it('nunca é pouco, atencao ou demais', () => {
    const zonas = [
      anoteOSono.meta(ctxBase()).zona,
      anoteOSono.meta(ctxBase({ hoje: diaBase(HOJE, { deitou: '23:00', levantou: '06:30' }) })).zona,
    ];
    expect(zonas.every((z) => z === 'meta' || z === 'sem-dado')).toBe(true);
  });
});
```

- [ ] **Step 17: Rodar e ver falhar**

```
cd app && pnpm vitest run src/dominio/metas/anoteOSono.test.ts
```
Saída esperada: `FAIL … Failed to load url ./anoteOSono`.

- [ ] **Step 18: Implementar `anoteOSono.ts`**

`app/src/dominio/metas/anoteOSono.ts`:

```ts
import { aplicarSeguranca, semDado } from './_util';
import type { AcaoMeta } from './tipos';

/** Hábito de registro: não tem número nem faixa. Meta = registrou hoje. */
export const anoteOSono: AcaoMeta = {
  id: 'anote-o-sono',
  aplica: () => true,
  meta(ctx) {
    const hoje = ctx.hoje;
    if (hoje === undefined || hoje.deitou === undefined || hoje.levantou === undefined) {
      return semDado(['dia.deitou', 'dia.levantou'], 'sem registro hoje');
    }
    return aplicarSeguranca('anote-o-sono', ctx.perfil, {
      zona: 'meta',
      valor: null,
      faixa: null,
      posicao: null,
      texto: 'registrado',
      proximoPasso: 'manter o registro diário',
    });
  },
};
```

- [ ] **Step 19: Rodar e ver passar**

```
cd app && pnpm vitest run src/dominio/metas/anoteOSono.test.ts
```
Saída esperada: `✓ … (6 tests)`.

- [ ] **Step 20: Commit**

```
git add app/src/dominio/metas/anoteOSono.ts app/src/dominio/metas/anoteOSono.test.ts
git commit -m "feat: meta anote-o-sono"
```

- [ ] **Step 21: Verificação do grupo**

```
cd app && pnpm vitest run src/dominio/metas && pnpm exec tsc --noEmit && pnpm lint
```
Saída esperada: tudo verde.

---

### Task 5: Grupo Alimentação (8 ações)

**Files:**
- Create: `app/src/dominio/metas/proteinaNoPrato.ts`, `fibraNoPrato.ts`, `fecheACozinha.ts`, `troqueODoce.ts`, `comidaDeVerdade.ts`, `bebaPelaSede.ts`, `seBeber.ts`, `pergunteAFome.ts`
- Test: os oito `<camelCase>.test.ts` correspondentes em `app/src/dominio/metas/`

**Interfaces:**
- Consumes: `pos`, `r1` (`../derivados`); helpers de `./_util`; fixtures.
- Produces: `export const proteinaNoPrato: AcaoMeta`, `fibraNoPrato`, `fecheACozinha`, `troqueODoce`, `comidaDeVerdade`, `bebaPelaSede`, `seBeber`, `pergunteAFome`.

Regras:

| ação | valor | pouco | atencao | meta | demais | posição |
|---|---|---|---|---|---|---|
| proteina-no-prato | g/dia (peso do perfil) | < 0,8·kg | 0,8–1,2·kg | 1,2–2,2·kg | > 2,2·kg | `pos(g, 1.2kg, 1.6kg)` |
| fibra-no-prato | g/dia | < 15 | 15–24 | 25–40 | > 40 | `pos(g, 25, 29)` |
| feche-a-cozinha | `derivados.jejumHoras` | < 12 | 12–13,9 **e** 16,1–19,9 | 14–16 | ≥ 20 | `pos(h, 14, 16)` |
| troque-o-doce | bebidas doces/sem | não há (0 é meta) | 1–3 | < 1 | > 3 | 0.1 / 0.5 / 0.9 |
| comida-de-verdade | refeições cozinhadas (0–3) | 0 | 1 | ≥ 2 | não há | 0.06 / 0.25 / 0.55 |
| beba-pela-sede | copos vs `derivados.coposMeta` (cm) | < 0,6·cm | cm·0,6–cm **e** > 1,8·cm | cm–1,8·cm | não há | `pos(n, cm, 1.5cm)` |
| se-beber | doses/sem | não há (0 é meta) | 1–7 | 0 | > 7 | 0.12 / 0.5 / 0.9 |
| pergunte-a-fome | só registro | — | — | hoje tem `fome` e `comiSemFome` | — | null |

- [ ] **Step 1: Teste de `proteina-no-prato` (falha)**

`app/src/dominio/metas/proteinaNoPrato.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { proteinaNoPrato } from './proteinaNoPrato';
import { HOJE, ONTEM, ctxBase, diaBase, perfilBase } from './_fixtures';

// perfilBase pesa 90 kg → pouco < 72 g, meta 108–198 g (1,2–2,2 g/kg), barra entre 108 e 144

describe('proteina-no-prato', () => {
  it('aplica a todo perfil', () => {
    expect(proteinaNoPrato.id).toBe('proteina-no-prato');
    expect(proteinaNoPrato.aplica(perfilBase)).toBe(true);
  });

  it('pouco: 60 g; próximo passo +10 g', () => {
    const m = proteinaNoPrato.meta(ctxBase({ hoje: diaBase(HOJE, { proteinaG: 60 }) }));
    expect(m.zona).toBe('pouco');
    expect(m.valor).toBe(60);
    expect(m.texto).toBe('60 g/dia (0.7 g/kg)');
    expect(m.proximoPasso).toBe('mais 10 g/dia (70 g): um ovo ≈ 6 g, 100 g de frango ≈ 30 g, uma dose de whey ≈ 25 g');
    expect(m.faixa).toEqual({ pouco: 72, meta: 108, demais: 198 });
    expect(m.posicao).toBeCloseTo(0.167, 2);
  });

  it('atencao: 100 g', () => {
    const m = proteinaNoPrato.meta(ctxBase({ hoje: diaBase(HOJE, { proteinaG: 100 }) }));
    expect(m.zona).toBe('atencao');
    expect(m.texto).toBe('100 g/dia (1.1 g/kg)');
    expect(m.proximoPasso).toBe('mais 10 g/dia (110 g): um ovo ≈ 6 g, 100 g de frango ≈ 30 g, uma dose de whey ≈ 25 g');
  });

  it('nunca salta além da meta: 105 g → 108 g', () => {
    const m = proteinaNoPrato.meta(ctxBase({ hoje: diaBase(HOJE, { proteinaG: 105 }) }));
    expect(m.proximoPasso).toBe('mais 10 g/dia (108 g): um ovo ≈ 6 g, 100 g de frango ≈ 30 g, uma dose de whey ≈ 25 g');
  });

  it('meta: 120 g', () => {
    const m = proteinaNoPrato.meta(ctxBase({ hoje: diaBase(HOJE, { proteinaG: 120 }) }));
    expect(m.zona).toBe('meta');
    expect(m.texto).toBe('120 g/dia (1.3 g/kg)');
    expect(m.proximoPasso).toBe('na meta');
    expect(m.posicao).toBeCloseTo(0.583, 2);
  });

  it('demais: 220 g', () => {
    const m = proteinaNoPrato.meta(ctxBase({ hoje: diaBase(HOJE, { proteinaG: 220 }) }));
    expect(m.zona).toBe('demais');
    expect(m.proximoPasso).toBe('acima do que traz benefício; pode reduzir');
  });

  it('sem-dado', () => {
    const m = proteinaNoPrato.meta(ctxBase({ hoje: diaBase(HOJE) }));
    expect(m.zona).toBe('sem-dado');
    expect(m.precisaDe).toEqual(['dia.proteinaG']);
  });

  it('usa o último dia com o campo', () => {
    const m = proteinaNoPrato.meta(ctxBase({ hoje: diaBase(HOJE), dias: [diaBase(ONTEM, { proteinaG: 120 })] }));
    expect(m.deDia).toBe(ONTEM);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

```
cd app && pnpm vitest run src/dominio/metas/proteinaNoPrato.test.ts
```
Saída esperada: `FAIL … Failed to load url ./proteinaNoPrato`.

- [ ] **Step 3: Implementar `proteinaNoPrato.ts`**

`app/src/dominio/metas/proteinaNoPrato.ts`:

```ts
import { pos, r1 } from '../derivados';
import { aplicarSeguranca, deDiaSeNaoHoje, semDado, ultimoDiaCom } from './_util';
import type { AcaoMeta, Zona } from './tipos';

export const proteinaNoPrato: AcaoMeta = {
  id: 'proteina-no-prato',
  aplica: () => true,
  meta(ctx) {
    const w = ctx.perfil.peso;
    if (!w) return semDado(['perfil.peso'], 'precisa do peso no perfil');

    const dia = ultimoDiaCom(ctx.dias, 'proteinaG');
    const g = dia?.proteinaG;
    if (dia === undefined || g === undefined) return semDado(['dia.proteinaG']);

    const pouco = Math.round(0.8 * w);
    const lo = Math.round(1.2 * w);
    const hi = Math.round(1.6 * w);
    const max = Math.round(2.2 * w);

    const zona: Zona = g < pouco ? 'pouco' : g < lo ? 'atencao' : g <= max ? 'meta' : 'demais';
    const proximoPasso =
      g < lo
        ? `mais 10 g/dia (${Math.min(g + 10, lo)} g): um ovo ≈ 6 g, 100 g de frango ≈ 30 g, uma dose de whey ≈ 25 g`
        : g > max
          ? 'acima do que traz benefício; pode reduzir'
          : 'na meta';

    return aplicarSeguranca('proteina-no-prato', ctx.perfil, {
      zona,
      valor: g,
      faixa: { pouco, meta: lo, demais: max },
      posicao: pos(g, lo, hi),
      texto: `${g} g/dia (${r1(g / w)} g/kg)`,
      proximoPasso,
      ...deDiaSeNaoHoje(ctx, dia),
    });
  },
};
```

- [ ] **Step 4: Rodar e ver passar**

```
cd app && pnpm vitest run src/dominio/metas/proteinaNoPrato.test.ts
```
Saída esperada: `✓ … (8 tests)`.

- [ ] **Step 5: Commit**

```
git add app/src/dominio/metas/proteinaNoPrato.ts app/src/dominio/metas/proteinaNoPrato.test.ts
git commit -m "feat: meta proteina-no-prato"
```

- [ ] **Step 6: Teste de `fibra-no-prato` (falha)**

`app/src/dominio/metas/fibraNoPrato.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { fibraNoPrato } from './fibraNoPrato';
import { HOJE, ONTEM, ctxBase, diaBase, perfilBase } from './_fixtures';

describe('fibra-no-prato', () => {
  it('aplica a todo perfil', () => {
    expect(fibraNoPrato.id).toBe('fibra-no-prato');
    expect(fibraNoPrato.aplica(perfilBase)).toBe(true);
  });

  it('pouco: 10 g; próximo passo +5 g', () => {
    const m = fibraNoPrato.meta(ctxBase({ hoje: diaBase(HOJE, { fibraG: 10 }) }));
    expect(m.zona).toBe('pouco');
    expect(m.valor).toBe(10);
    expect(m.texto).toBe('10 g/dia');
    expect(m.proximoPasso).toBe('mais 5 g/dia (15 g): uma concha de feijão ≈ 7 g, aveia 40 g ≈ 4 g; suba devagar');
    expect(m.faixa).toEqual({ pouco: 15, meta: 25, demais: 40 });
    expect(m.posicao).toBeCloseTo(0.02, 3);
  });

  it('atencao: 20 g', () => {
    const m = fibraNoPrato.meta(ctxBase({ hoje: diaBase(HOJE, { fibraG: 20 }) }));
    expect(m.zona).toBe('atencao');
    expect(m.proximoPasso).toBe('mais 5 g/dia (25 g): uma concha de feijão ≈ 7 g, aveia 40 g ≈ 4 g; suba devagar');
  });

  it('nunca salta além da meta: 22 g → 25 g', () => {
    const m = fibraNoPrato.meta(ctxBase({ hoje: diaBase(HOJE, { fibraG: 22 }) }));
    expect(m.proximoPasso).toBe('mais 5 g/dia (25 g): uma concha de feijão ≈ 7 g, aveia 40 g ≈ 4 g; suba devagar');
  });

  it('meta: 27 g', () => {
    const m = fibraNoPrato.meta(ctxBase({ hoje: diaBase(HOJE, { fibraG: 27 }) }));
    expect(m.zona).toBe('meta');
    expect(m.proximoPasso).toBe('na meta');
    expect(m.posicao).toBeCloseTo(0.625, 3);
  });

  it('demais: 45 g', () => {
    const m = fibraNoPrato.meta(ctxBase({ hoje: diaBase(HOJE, { fibraG: 45 }) }));
    expect(m.zona).toBe('demais');
    expect(m.proximoPasso).toBe('acima de 40 g não há ganho extra');
  });

  it('sem-dado', () => {
    const m = fibraNoPrato.meta(ctxBase({ hoje: diaBase(HOJE) }));
    expect(m.zona).toBe('sem-dado');
    expect(m.precisaDe).toEqual(['dia.fibraG']);
  });

  it('usa o último dia com o campo', () => {
    const m = fibraNoPrato.meta(ctxBase({ hoje: diaBase(HOJE), dias: [diaBase(ONTEM, { fibraG: 27 })] }));
    expect(m.deDia).toBe(ONTEM);
  });
});
```

- [ ] **Step 7: Rodar e ver falhar**

```
cd app && pnpm vitest run src/dominio/metas/fibraNoPrato.test.ts
```
Saída esperada: `FAIL … Failed to load url ./fibraNoPrato`.

- [ ] **Step 8: Implementar `fibraNoPrato.ts`**

`app/src/dominio/metas/fibraNoPrato.ts`:

```ts
import { pos } from '../derivados';
import { aplicarSeguranca, deDiaSeNaoHoje, semDado, ultimoDiaCom } from './_util';
import type { AcaoMeta, Zona } from './tipos';

export const fibraNoPrato: AcaoMeta = {
  id: 'fibra-no-prato',
  aplica: () => true,
  meta(ctx) {
    const dia = ultimoDiaCom(ctx.dias, 'fibraG');
    const g = dia?.fibraG;
    if (dia === undefined || g === undefined) return semDado(['dia.fibraG']);

    const zona: Zona = g < 15 ? 'pouco' : g < 25 ? 'atencao' : g <= 40 ? 'meta' : 'demais';
    const proximoPasso =
      g < 25
        ? `mais 5 g/dia (${Math.min(g + 5, 25)} g): uma concha de feijão ≈ 7 g, aveia 40 g ≈ 4 g; suba devagar`
        : g > 40
          ? 'acima de 40 g não há ganho extra'
          : 'na meta';

    return aplicarSeguranca('fibra-no-prato', ctx.perfil, {
      zona,
      valor: g,
      faixa: { pouco: 15, meta: 25, demais: 40 },
      posicao: pos(g, 25, 29),
      texto: `${g} g/dia`,
      proximoPasso,
      ...deDiaSeNaoHoje(ctx, dia),
    });
  },
};
```

- [ ] **Step 9: Rodar e ver passar**

```
cd app && pnpm vitest run src/dominio/metas/fibraNoPrato.test.ts
```
Saída esperada: `✓ … (8 tests)`.

- [ ] **Step 10: Commit**

```
git add app/src/dominio/metas/fibraNoPrato.ts app/src/dominio/metas/fibraNoPrato.test.ts
git commit -m "feat: meta fibra-no-prato"
```

- [ ] **Step 11: Teste de `feche-a-cozinha` (falha)**

`app/src/dominio/metas/fecheACozinha.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { fecheACozinha } from './fecheACozinha';
import { HOJE, ONTEM, ctxBase, diaBase, perfilBase } from './_fixtures';

/** O valor vem de derivados.jejumHoras (plano 01); fixamos por override com dias coerentes. */
function ctxJejum(jejumHoras: number | null) {
  return ctxBase({
    hoje: diaBase(HOJE, { primeiraRefeicao: '12:00' }),
    dias: [diaBase(ONTEM, { jantarFim: '18:00' })],
    derivados: { jejumHoras },
  });
}

describe('feche-a-cozinha', () => {
  it('aplica a todo perfil', () => {
    expect(fecheACozinha.id).toBe('feche-a-cozinha');
    expect(fecheACozinha.aplica(perfilBase)).toBe(true);
  });

  it('pouco: 11 h; próximo passo 15 min', () => {
    const m = fecheACozinha.meta(ctxJejum(11));
    expect(m.zona).toBe('pouco');
    expect(m.valor).toBe(11);
    expect(m.texto).toBe('11 h de jejum');
    expect(m.proximoPasso).toBe('fechar a cozinha 15 min mais cedo, ou abrir 15 min mais tarde (faltam 180 min para 14 h)');
    expect(m.faixa).toEqual({ pouco: 12, meta: 14, demais: 20 });
    expect(m.posicao).toBeCloseTo(0.125, 3);
    expect(m.deDia).toBeUndefined();
    expect(m.seguranca).toBeUndefined();
  });

  it('atencao: 13,5 h', () => {
    const m = fecheACozinha.meta(ctxJejum(13.5));
    expect(m.zona).toBe('atencao');
    expect(m.proximoPasso).toBe('fechar a cozinha 15 min mais cedo, ou abrir 15 min mais tarde (faltam 30 min para 14 h)');
  });

  it('meta: 15 h', () => {
    const m = fecheACozinha.meta(ctxJejum(15));
    expect(m.zona).toBe('meta');
    expect(m.proximoPasso).toBe('manter; bater a proteína na janela');
    expect(m.posicao).toBeCloseTo(0.625, 3);
  });

  it('atencao alta: 18 h (mais que o testado)', () => {
    const m = fecheACozinha.meta(ctxJejum(18));
    expect(m.zona).toBe('atencao');
    expect(m.proximoPasso).toBe('você está em 18 h — mais que o testado; se a proteína não fecha, encurte para 16');
  });

  it('demais: 21 h', () => {
    const m = fecheACozinha.meta(ctxJejum(21));
    expect(m.zona).toBe('demais');
    expect(m.proximoPasso).toBe('reduzir: acima de 24 h repetido perde músculo');
  });

  it('sem-dado', () => {
    const m = fecheACozinha.meta(ctxBase({ hoje: diaBase(HOJE), derivados: { jejumHoras: null } }));
    expect(m.zona).toBe('sem-dado');
    expect(m.precisaDe).toEqual(['dia.jantarFim', 'dia.primeiraRefeicao']);
  });

  it('segurança: remédio para glicemia', () => {
    const ctx = ctxJejum(15);
    const m = fecheACozinha.meta({ ...ctx, perfil: { ...perfilBase, remedios: ['glicemia'] } });
    expect(m.seguranca).toContain('remédio para glicemia');
    expect(m.zona).toBe('meta');
  });
});
```

- [ ] **Step 12: Rodar e ver falhar**

```
cd app && pnpm vitest run src/dominio/metas/fecheACozinha.test.ts
```
Saída esperada: `FAIL … Failed to load url ./fecheACozinha`.

- [ ] **Step 13: Implementar `fecheACozinha.ts`**

`app/src/dominio/metas/fecheACozinha.ts`:

```ts
import { pos, r1 } from '../derivados';
import { aplicarSeguranca, deDiaSeNaoHoje, semDado, ultimoDiaCom } from './_util';
import type { AcaoMeta, Zona } from './tipos';

export const fecheACozinha: AcaoMeta = {
  id: 'feche-a-cozinha',
  aplica: () => true,
  meta(ctx) {
    const h = ctx.derivados.jejumHoras;
    if (h === null) return semDado(['dia.jantarFim', 'dia.primeiraRefeicao']);

    const zona: Zona = h < 12 ? 'pouco' : h < 14 ? 'atencao' : h <= 16 ? 'meta' : h < 20 ? 'atencao' : 'demais';
    const proximoPasso =
      h < 14
        ? `fechar a cozinha 15 min mais cedo, ou abrir 15 min mais tarde (faltam ${Math.ceil((14 - h) * 60)} min para 14 h)`
        : h <= 16
          ? 'manter; bater a proteína na janela'
          : h < 20
            ? `você está em ${r1(h)} h — mais que o testado; se a proteína não fecha, encurte para 16`
            : 'reduzir: acima de 24 h repetido perde músculo';

    const dia = ultimoDiaCom(ctx.dias, 'primeiraRefeicao');
    return aplicarSeguranca('feche-a-cozinha', ctx.perfil, {
      zona,
      valor: r1(h),
      faixa: { pouco: 12, meta: 14, demais: 20 },
      posicao: pos(h, 14, 16),
      texto: `${r1(h)} h de jejum`,
      proximoPasso,
      ...(dia ? deDiaSeNaoHoje(ctx, dia) : {}),
    });
  },
};
```

- [ ] **Step 14: Rodar e ver passar**

```
cd app && pnpm vitest run src/dominio/metas/fecheACozinha.test.ts
```
Saída esperada: `✓ … (8 tests)`.

- [ ] **Step 15: Commit**

```
git add app/src/dominio/metas/fecheACozinha.ts app/src/dominio/metas/fecheACozinha.test.ts
git commit -m "feat: meta feche-a-cozinha"
```

- [ ] **Step 16: Teste de `troque-o-doce` (falha)**

`app/src/dominio/metas/troqueODoce.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { troqueODoce } from './troqueODoce';
import { HOJE, ONTEM, ctxBase, diaBase, perfilBase, semanaBase } from './_fixtures';

describe('troque-o-doce', () => {
  it('aplica a todo perfil', () => {
    expect(troqueODoce.id).toBe('troque-o-doce');
    expect(troqueODoce.aplica(perfilBase)).toBe(true);
  });

  it('pouco não existe: zero pela revisão é meta', () => {
    const m = troqueODoce.meta(ctxBase({ semana: semanaBase({ docesSemana: 0 }) }));
    expect(m.zona).toBe('meta');
    expect(m.valor).toBe(0);
    expect(m.texto).toBe('0 bebidas doces/sem');
    expect(m.proximoPasso).toBe('manter');
    expect(m.posicao).toBe(0.1);
    expect(m.faixa).toEqual({ pouco: 0, meta: 1, demais: 3 });
  });

  it('atencao: 2 por semana; troca no máximo 2', () => {
    const m = troqueODoce.meta(ctxBase({ semana: semanaBase({ docesSemana: 2 }) }));
    expect(m.zona).toBe('atencao');
    expect(m.proximoPasso).toBe('trocar 2 por semana por água com gás ou fruta inteira');
    expect(m.posicao).toBe(0.5);
    expect(troqueODoce.meta(ctxBase({ semana: semanaBase({ docesSemana: 1 }) })).proximoPasso).toBe(
      'trocar 1 por semana por água com gás ou fruta inteira',
    );
  });

  it('meta: soma dos dias dá zero', () => {
    const m = troqueODoce.meta(
      ctxBase({ hoje: diaBase(HOJE, { bebidaDoce: 0 }), dias: [diaBase(ONTEM, { bebidaDoce: 0 })] }),
    );
    expect(m.zona).toBe('meta');
    expect(m.valor).toBe(0);
  });

  it('demais: soma dos últimos 7 dias = 5 (dia antigo ignorado)', () => {
    const m = troqueODoce.meta(
      ctxBase({
        hoje: diaBase(HOJE, { bebidaDoce: 3 }),
        dias: [diaBase(ONTEM, { bebidaDoce: 2 }), diaBase('2026-09-01', { bebidaDoce: 10 })],
      }),
    );
    expect(m.zona).toBe('demais');
    expect(m.valor).toBe(5);
    expect(m.posicao).toBe(0.9);
    expect(m.proximoPasso).toBe('trocar 2 por semana por água com gás ou fruta inteira');
  });

  it('revisão de outra semana é ignorada; usa os dias', () => {
    const m = troqueODoce.meta(
      ctxBase({ semana: semanaBase({ semana: '2026-W36', docesSemana: 9 }), hoje: diaBase(HOJE, { bebidaDoce: 1 }) }),
    );
    expect(m.valor).toBe(1);
  });

  it('sem-dado', () => {
    const m = troqueODoce.meta(ctxBase({ hoje: diaBase(HOJE) }));
    expect(m.zona).toBe('sem-dado');
    expect(m.precisaDe).toEqual(['dia.bebidaDoce']);
  });
});
```

- [ ] **Step 17: Rodar e ver falhar**

```
cd app && pnpm vitest run src/dominio/metas/troqueODoce.test.ts
```
Saída esperada: `FAIL … Failed to load url ./troqueODoce`.

- [ ] **Step 18: Implementar `troqueODoce.ts`**

`app/src/dominio/metas/troqueODoce.ts`:

```ts
import { aplicarSeguranca, diasUltimos, semDado, semanaAtual } from './_util';
import type { AcaoMeta, Zona } from './tipos';

export const troqueODoce: AcaoMeta = {
  id: 'troque-o-doce',
  aplica: () => true,
  meta(ctx) {
    let n = semanaAtual(ctx)?.docesSemana;
    if (n === undefined) {
      const comRegistro = diasUltimos(ctx, 7).filter((d) => d.bebidaDoce !== undefined);
      if (comRegistro.length > 0) n = comRegistro.reduce((s, d) => s + (d.bebidaDoce ?? 0), 0);
    }
    if (n === undefined) return semDado(['dia.bebidaDoce']);

    const zona: Zona = n < 1 ? 'meta' : n <= 3 ? 'atencao' : 'demais';
    const proximoPasso = n === 0 ? 'manter' : `trocar ${Math.min(n, 2)} por semana por água com gás ou fruta inteira`;

    return aplicarSeguranca('troque-o-doce', ctx.perfil, {
      zona,
      valor: n,
      faixa: { pouco: 0, meta: 1, demais: 3 },
      posicao: n === 0 ? 0.1 : n <= 3 ? 0.5 : 0.9,
      texto: `${n} bebidas doces/sem`,
      proximoPasso,
    });
  },
};
```

- [ ] **Step 19: Rodar e ver passar**

```
cd app && pnpm vitest run src/dominio/metas/troqueODoce.test.ts
```
Saída esperada: `✓ … (7 tests)`.

- [ ] **Step 20: Commit**

```
git add app/src/dominio/metas/troqueODoce.ts app/src/dominio/metas/troqueODoce.test.ts
git commit -m "feat: meta troque-o-doce"
```

- [ ] **Step 21: Teste de `comida-de-verdade` (falha)**

`app/src/dominio/metas/comidaDeVerdade.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { comidaDeVerdade } from './comidaDeVerdade';
import { HOJE, ONTEM, ctxBase, diaBase, perfilBase } from './_fixtures';

describe('comida-de-verdade', () => {
  it('aplica a todo perfil', () => {
    expect(comidaDeVerdade.id).toBe('comida-de-verdade');
    expect(comidaDeVerdade.aplica(perfilBase)).toBe(true);
  });

  it('pouco: 0 de 3', () => {
    const m = comidaDeVerdade.meta(ctxBase({ hoje: diaBase(HOJE, { refeicoesCozinhadas: 0 }) }));
    expect(m.zona).toBe('pouco');
    expect(m.valor).toBe(0);
    expect(m.texto).toBe('0 de 3 refeições de ingredientes');
    expect(m.proximoPasso).toBe('uma refeição a mais de ingredientes: a mais fácil é o café da manhã');
    expect(m.posicao).toBe(0.06);
    expect(m.faixa).toEqual({ pouco: 0, meta: 2, demais: 3 });
  });

  it('atencao: 1 de 3', () => {
    const m = comidaDeVerdade.meta(ctxBase({ hoje: diaBase(HOJE, { refeicoesCozinhadas: 1 }) }));
    expect(m.zona).toBe('atencao');
    expect(m.posicao).toBe(0.25);
    expect(m.proximoPasso).toBe('uma refeição a mais de ingredientes: a mais fácil é o café da manhã');
  });

  it('meta: 2 de 3', () => {
    const m = comidaDeVerdade.meta(ctxBase({ hoje: diaBase(HOJE, { refeicoesCozinhadas: 2 }) }));
    expect(m.zona).toBe('meta');
    expect(m.proximoPasso).toBe('manter');
    expect(m.posicao).toBe(0.55);
  });

  it('demais não existe: 3 de 3 é meta', () => {
    expect(comidaDeVerdade.meta(ctxBase({ hoje: diaBase(HOJE, { refeicoesCozinhadas: 3 }) })).zona).toBe('meta');
  });

  it('sem-dado', () => {
    const m = comidaDeVerdade.meta(ctxBase({ hoje: diaBase(HOJE) }));
    expect(m.zona).toBe('sem-dado');
    expect(m.precisaDe).toEqual(['dia.refeicoesCozinhadas']);
  });

  it('usa o último dia com o campo', () => {
    const m = comidaDeVerdade.meta(
      ctxBase({ hoje: diaBase(HOJE), dias: [diaBase(ONTEM, { refeicoesCozinhadas: 2 })] }),
    );
    expect(m.deDia).toBe(ONTEM);
  });
});
```

- [ ] **Step 22: Rodar e ver falhar**

```
cd app && pnpm vitest run src/dominio/metas/comidaDeVerdade.test.ts
```
Saída esperada: `FAIL … Failed to load url ./comidaDeVerdade`.

- [ ] **Step 23: Implementar `comidaDeVerdade.ts`**

`app/src/dominio/metas/comidaDeVerdade.ts`:

```ts
import { aplicarSeguranca, deDiaSeNaoHoje, semDado, ultimoDiaCom } from './_util';
import type { AcaoMeta, Zona } from './tipos';

export const comidaDeVerdade: AcaoMeta = {
  id: 'comida-de-verdade',
  aplica: () => true,
  meta(ctx) {
    const dia = ultimoDiaCom(ctx.dias, 'refeicoesCozinhadas');
    const n = dia?.refeicoesCozinhadas;
    if (dia === undefined || n === undefined) return semDado(['dia.refeicoesCozinhadas']);

    const zona: Zona = n >= 2 ? 'meta' : n === 1 ? 'atencao' : 'pouco';

    return aplicarSeguranca('comida-de-verdade', ctx.perfil, {
      zona,
      valor: n,
      faixa: { pouco: 0, meta: 2, demais: 3 },
      posicao: n >= 2 ? 0.55 : n === 1 ? 0.25 : 0.06,
      texto: `${n} de 3 refeições de ingredientes`,
      proximoPasso: n >= 2 ? 'manter' : 'uma refeição a mais de ingredientes: a mais fácil é o café da manhã',
      ...deDiaSeNaoHoje(ctx, dia),
    });
  },
};
```

- [ ] **Step 24: Rodar e ver passar**

```
cd app && pnpm vitest run src/dominio/metas/comidaDeVerdade.test.ts
```
Saída esperada: `✓ … (7 tests)`.

- [ ] **Step 25: Commit**

```
git add app/src/dominio/metas/comidaDeVerdade.ts app/src/dominio/metas/comidaDeVerdade.test.ts
git commit -m "feat: meta comida-de-verdade"
```

- [ ] **Step 26: Teste de `beba-pela-sede` (falha)**

`app/src/dominio/metas/bebaPelaSede.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { bebaPelaSede } from './bebaPelaSede';
import { HOJE, ONTEM, ctxBase, diaBase, perfilBase } from './_fixtures';

/** A referência vem de derivados.coposMeta (plano 01); fixamos 8 por override. */
function ctxCopos(copos: number | undefined, coposMeta = 8) {
  return ctxBase({ hoje: diaBase(HOJE, copos === undefined ? {} : { copos }), derivados: { coposMeta } });
}

describe('beba-pela-sede', () => {
  it('aplica a todo perfil', () => {
    expect(bebaPelaSede.id).toBe('beba-pela-sede');
    expect(bebaPelaSede.aplica(perfilBase)).toBe(true);
  });

  it('pouco: 4 copos (menos de 60% de 8); próximo passo no máximo +2', () => {
    const m = bebaPelaSede.meta(ctxCopos(4));
    expect(m.zona).toBe('pouco');
    expect(m.valor).toBe(4);
    expect(m.texto).toBe('4 copos ≈ 1 L · referência 8 copos');
    expect(m.proximoPasso).toBe('mais 2 copo(s) hoje: um ao acordar e um a cada pausa de 30 min (referência 8)');
    expect(m.faixa).toEqual({ pouco: 5, meta: 8, demais: 14 });
    expect(m.posicao).toBeCloseTo(0.25, 3);
  });

  it('atencao: 7 copos → +1', () => {
    const m = bebaPelaSede.meta(ctxCopos(7));
    expect(m.zona).toBe('atencao');
    expect(m.proximoPasso).toBe('mais 1 copo(s) hoje: um ao acordar e um a cada pausa de 30 min (referência 8)');
  });

  it('meta: 9 copos', () => {
    const m = bebaPelaSede.meta(ctxCopos(9));
    expect(m.zona).toBe('meta');
    expect(m.texto).toBe('9 copos ≈ 2.3 L · referência 8 copos');
    expect(m.proximoPasso).toBe('na referência — a urina clara confirma');
    expect(m.posicao).toBeCloseTo(0.5625, 3);
  });

  it('demais não existe: 16 copos vira atencao', () => {
    const m = bebaPelaSede.meta(ctxCopos(16));
    expect(m.zona).toBe('atencao');
    expect(m.proximoPasso).toBe('bem acima da referência — beba pela sede');
  });

  it('sem-dado', () => {
    const m = bebaPelaSede.meta(ctxCopos(undefined));
    expect(m.zona).toBe('sem-dado');
    expect(m.precisaDe).toEqual(['dia.copos']);
  });

  it('a referência acompanha derivados.coposMeta', () => {
    expect(bebaPelaSede.meta(ctxCopos(9, 10)).zona).toBe('atencao');
  });

  it('usa o último dia com o campo', () => {
    const m = bebaPelaSede.meta(ctxBase({ hoje: diaBase(HOJE), dias: [diaBase(ONTEM, { copos: 9 })], derivados: { coposMeta: 8 } }));
    expect(m.deDia).toBe(ONTEM);
  });
});
```

- [ ] **Step 27: Rodar e ver falhar**

```
cd app && pnpm vitest run src/dominio/metas/bebaPelaSede.test.ts
```
Saída esperada: `FAIL … Failed to load url ./bebaPelaSede`.

- [ ] **Step 28: Implementar `bebaPelaSede.ts`**

`app/src/dominio/metas/bebaPelaSede.ts`:

```ts
import { pos, r1 } from '../derivados';
import { aplicarSeguranca, deDiaSeNaoHoje, semDado, ultimoDiaCom } from './_util';
import type { AcaoMeta, Zona } from './tipos';

export const bebaPelaSede: AcaoMeta = {
  id: 'beba-pela-sede',
  aplica: () => true,
  meta(ctx) {
    const cm = ctx.derivados.coposMeta;
    const dia = ultimoDiaCom(ctx.dias, 'copos');
    const n = dia?.copos;
    if (dia === undefined || n === undefined) return semDado(['dia.copos']);

    const zona: Zona = n < cm * 0.6 ? 'pouco' : n < cm ? 'atencao' : n <= cm * 1.8 ? 'meta' : 'atencao';
    const passo = Math.min(cm - n, 2);
    const proximoPasso =
      n < cm
        ? `mais ${passo} copo(s) hoje: um ao acordar e um a cada pausa de 30 min (referência ${cm})`
        : n > cm * 1.8
          ? 'bem acima da referência — beba pela sede'
          : 'na referência — a urina clara confirma';

    return aplicarSeguranca('beba-pela-sede', ctx.perfil, {
      zona,
      valor: n,
      faixa: { pouco: Math.round(cm * 0.6), meta: cm, demais: Math.round(cm * 1.8) },
      posicao: pos(n, cm, cm * 1.5),
      texto: `${n} copos ≈ ${r1(n * 0.25)} L · referência ${cm} copos`,
      proximoPasso,
      ...deDiaSeNaoHoje(ctx, dia),
    });
  },
};
```

- [ ] **Step 29: Rodar e ver passar**

```
cd app && pnpm vitest run src/dominio/metas/bebaPelaSede.test.ts
```
Saída esperada: `✓ … (8 tests)`.

- [ ] **Step 30: Commit**

```
git add app/src/dominio/metas/bebaPelaSede.ts app/src/dominio/metas/bebaPelaSede.test.ts
git commit -m "feat: meta beba-pela-sede"
```

- [ ] **Step 31: Teste de `se-beber` (falha)**

`app/src/dominio/metas/seBeber.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { seBeber } from './seBeber';
import { HOJE, ONTEM, ctxBase, diaBase, perfilBase, semanaBase } from './_fixtures';

describe('se-beber', () => {
  it('aplica só quando o perfil bebe', () => {
    expect(seBeber.id).toBe('se-beber');
    expect(seBeber.aplica({ ...perfilBase, alcool: 'nao' })).toBe(false);
    expect(seBeber.aplica({ ...perfilBase, alcool: 'as-vezes' })).toBe(true);
    expect(seBeber.aplica({ ...perfilBase, alcool: 'regular' })).toBe(true);
  });

  it('pouco não existe: zero pela revisão é meta', () => {
    const m = seBeber.meta(ctxBase({ semana: semanaBase({ alcoolDoses: 0 }) }));
    expect(m.zona).toBe('meta');
    expect(m.valor).toBe(0);
    expect(m.texto).toBe('0 doses/sem');
    expect(m.proximoPasso).toBe('zero — manter');
    expect(m.posicao).toBe(0.12);
    expect(m.faixa).toEqual({ pouco: 0, meta: 7, demais: 7 });
  });

  it('atencao: 3 doses', () => {
    const m = seBeber.meta(ctxBase({ semana: semanaBase({ alcoolDoses: 3 }) }));
    expect(m.zona).toBe('atencao');
    expect(m.proximoPasso).toBe('dentro da faixa; nunca nas horas antes de deitar');
    expect(m.posicao).toBe(0.5);
  });

  it('meta: dias com null (não bebi) somam zero', () => {
    const m = seBeber.meta(
      ctxBase({ hoje: diaBase(HOJE, { alcoolDoses: null }), dias: [diaBase(ONTEM, { alcoolDoses: null })] }),
    );
    expect(m.zona).toBe('meta');
    expect(m.valor).toBe(0);
  });

  it('demais: 4 + 5 nos últimos 7 dias (dia antigo ignorado)', () => {
    const m = seBeber.meta(
      ctxBase({
        hoje: diaBase(HOJE, { alcoolDoses: 4 }),
        dias: [diaBase(ONTEM, { alcoolDoses: 5 }), diaBase('2026-09-01', { alcoolDoses: 20 })],
      }),
    );
    expect(m.zona).toBe('demais');
    expect(m.valor).toBe(9);
    expect(m.posicao).toBe(0.9);
    expect(m.proximoPasso).toBe('uma dose a menos por semana, começando pelas da noite');
  });

  it('sem-dado', () => {
    const m = seBeber.meta(ctxBase({ hoje: diaBase(HOJE) }));
    expect(m.zona).toBe('sem-dado');
    expect(m.precisaDe).toEqual(['dia.alcoolDoses']);
  });
});
```

- [ ] **Step 32: Rodar e ver falhar**

```
cd app && pnpm vitest run src/dominio/metas/seBeber.test.ts
```
Saída esperada: `FAIL … Failed to load url ./seBeber`.

- [ ] **Step 33: Implementar `seBeber.ts`**

`app/src/dominio/metas/seBeber.ts`:

```ts
import { aplicarSeguranca, diasUltimos, semDado, semanaAtual } from './_util';
import type { AcaoMeta, Zona } from './tipos';

export const seBeber: AcaoMeta = {
  id: 'se-beber',
  aplica: (perfil) => perfil.alcool !== 'nao',
  meta(ctx) {
    let n = semanaAtual(ctx)?.alcoolDoses;
    if (n === undefined) {
      const comRegistro = diasUltimos(ctx, 7).filter((d) => d.alcoolDoses !== undefined);
      if (comRegistro.length > 0) n = comRegistro.reduce((s, d) => s + (d.alcoolDoses ?? 0), 0); // null = não bebeu
    }
    if (n === undefined) return semDado(['dia.alcoolDoses']);

    const zona: Zona = n === 0 ? 'meta' : n <= 7 ? 'atencao' : 'demais';
    const proximoPasso =
      n === 0
        ? 'zero — manter'
        : n <= 7
          ? 'dentro da faixa; nunca nas horas antes de deitar'
          : 'uma dose a menos por semana, começando pelas da noite';

    return aplicarSeguranca('se-beber', ctx.perfil, {
      zona,
      valor: n,
      faixa: { pouco: 0, meta: 7, demais: 7 },
      posicao: n === 0 ? 0.12 : n <= 7 ? 0.5 : 0.9,
      texto: `${n} doses/sem`,
      proximoPasso,
    });
  },
};
```

- [ ] **Step 34: Rodar e ver passar**

```
cd app && pnpm vitest run src/dominio/metas/seBeber.test.ts
```
Saída esperada: `✓ … (6 tests)`.

- [ ] **Step 35: Commit**

```
git add app/src/dominio/metas/seBeber.ts app/src/dominio/metas/seBeber.test.ts
git commit -m "feat: meta se-beber"
```

- [ ] **Step 36: Teste de `pergunte-a-fome` (falha)**

`app/src/dominio/metas/pergunteAFome.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { pergunteAFome } from './pergunteAFome';
import { HOJE, ONTEM, ctxBase, diaBase, perfilBase } from './_fixtures';

describe('pergunte-a-fome (só registro)', () => {
  it('aplica a todo perfil', () => {
    expect(pergunteAFome.id).toBe('pergunte-a-fome');
    expect(pergunteAFome.aplica(perfilBase)).toBe(true);
  });

  it('meta: hoje tem fome e comiSemFome', () => {
    const m = pergunteAFome.meta(ctxBase({ hoje: diaBase(HOJE, { fome: 6, comiSemFome: false }) }));
    expect(m).toEqual({
      zona: 'meta',
      valor: null,
      faixa: null,
      posicao: null,
      texto: 'registrado',
      proximoPasso: 'manter o registro diário',
    });
  });

  it('sem-dado: só a fome', () => {
    const m = pergunteAFome.meta(ctxBase({ hoje: diaBase(HOJE, { fome: 6 }) }));
    expect(m.zona).toBe('sem-dado');
    expect(m.precisaDe).toEqual(['dia.fome', 'dia.comiSemFome']);
    expect(m.texto).toBe('sem registro hoje');
  });

  it('sem-dado: sem dia de hoje; ontem não conta', () => {
    expect(pergunteAFome.meta(ctxBase()).zona).toBe('sem-dado');
    expect(
      pergunteAFome.meta(ctxBase({ hoje: diaBase(HOJE), dias: [diaBase(ONTEM, { fome: 3, comiSemFome: true })] })).zona,
    ).toBe('sem-dado');
  });

  it('nunca é pouco, atencao ou demais', () => {
    const z = pergunteAFome.meta(ctxBase({ hoje: diaBase(HOJE, { fome: 10, comiSemFome: true }) })).zona;
    expect(z).toBe('meta');
  });
});
```

- [ ] **Step 37: Rodar e ver falhar**

```
cd app && pnpm vitest run src/dominio/metas/pergunteAFome.test.ts
```
Saída esperada: `FAIL … Failed to load url ./pergunteAFome`.

- [ ] **Step 38: Implementar `pergunteAFome.ts`**

`app/src/dominio/metas/pergunteAFome.ts`:

```ts
import { aplicarSeguranca, semDado } from './_util';
import type { AcaoMeta } from './tipos';

/** Hábito de registro: meta = respondeu hoje (fome 1–10 e "comi sem fome?"). */
export const pergunteAFome: AcaoMeta = {
  id: 'pergunte-a-fome',
  aplica: () => true,
  meta(ctx) {
    const hoje = ctx.hoje;
    if (hoje === undefined || hoje.fome === undefined || hoje.comiSemFome === undefined) {
      return semDado(['dia.fome', 'dia.comiSemFome'], 'sem registro hoje');
    }
    return aplicarSeguranca('pergunte-a-fome', ctx.perfil, {
      zona: 'meta',
      valor: null,
      faixa: null,
      posicao: null,
      texto: 'registrado',
      proximoPasso: 'manter o registro diário',
    });
  },
};
```

- [ ] **Step 39: Rodar e ver passar**

```
cd app && pnpm vitest run src/dominio/metas/pergunteAFome.test.ts
```
Saída esperada: `✓ … (5 tests)`.

- [ ] **Step 40: Commit**

```
git add app/src/dominio/metas/pergunteAFome.ts app/src/dominio/metas/pergunteAFome.test.ts
git commit -m "feat: meta pergunte-a-fome"
```

- [ ] **Step 41: Verificação do grupo**

```
cd app && pnpm vitest run src/dominio/metas && pnpm exec tsc --noEmit && pnpm lint
```
Saída esperada: tudo verde.

---

### Task 6: Grupo Corpo e medida (3 ações)

**Files:**
- Create: `app/src/dominio/metas/emagrecaDevagar.ts`, `mecaACintura.ts`, `panturrilhaPreensao.ts`
- Test: `app/src/dominio/metas/emagrecaDevagar.test.ts`, `mecaACintura.test.ts`, `panturrilhaPreensao.test.ts`

**Interfaces:**
- Consumes: `pos`, `r1` (`../derivados`); helpers de `./_util`; fixtures (`semanaBase`, `mesBase`).
- Produces: `export const emagrecaDevagar: AcaoMeta`, `mecaACintura`, `panturrilhaPreensao`.

Regras:

| ação | valor | pouco | atencao | meta | demais | posição |
|---|---|---|---|---|---|---|
| emagreca-devagar | perda semanal `dl = pesoMedioSemanaAnterior − pesoMedioSemana` (kg) | ≤ 0 (estável ou ganhou — "não é problema", texto do catálogo) | 0,5 %–1 % do peso | 0–0,5 % | > 1 % | 0.15 se ≤ 0; senão `pos(dl, 0, 1 %)` |
| meca-a-cintura | só registro | — | — | `ctx.semana.cintura` existe | — | null |
| panturrilha-preensao | só registro | — | — | `ctx.mes.panturrilha` existe | — | null |

Nota: a PoC classificava peso estável como `'atencao'`; o catálogo (`faixa.pouco`) descreve exatamente esse caso como "pouco — não é problema". Segue-se o catálogo, que é a fonte dos textos de faixa; a UI mostra o rótulo do catálogo.

- [ ] **Step 1: Teste de `emagreca-devagar` (falha)**

`app/src/dominio/metas/emagrecaDevagar.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { emagrecaDevagar } from './emagrecaDevagar';
import { HOJE, ctxBase, diaBase, perfilBase } from './_fixtures';

/** As médias vêm de derivados (plano 01); fixamos por override. Peso 90 → meta até 0,5 kg/sem, demais > 0,9. */
function ctxPeso(atual: number | null, anterior: number | null) {
  return ctxBase({
    hoje: diaBase(HOJE, { peso: atual ?? undefined }),
    derivados: { pesoMedioSemana: atual, pesoMedioSemanaAnterior: anterior },
  });
}

describe('emagreca-devagar', () => {
  it('aplica a todo perfil', () => {
    expect(emagrecaDevagar.id).toBe('emagreca-devagar');
    expect(emagrecaDevagar.aplica(perfilBase)).toBe(true);
  });

  it('pouco: peso estável', () => {
    const m = emagrecaDevagar.meta(ctxPeso(90, 90));
    expect(m.zona).toBe('pouco');
    expect(m.valor).toBe(0);
    expect(m.texto).toBe('peso estável esta semana (meta até 0.5 kg)');
    expect(m.proximoPasso).toBe('peso estável: não é problema; se quer perder, o déficit moderado está nas Medidas');
    expect(m.posicao).toBe(0.15);
    expect(m.faixa).toEqual({ pouco: 0, meta: 0.5, demais: 0.9 });
    expect(m.seguranca).toBeUndefined();
  });

  it('pouco: ganhou 0,5 kg', () => {
    const m = emagrecaDevagar.meta(ctxPeso(90, 89.5));
    expect(m.zona).toBe('pouco');
    expect(m.valor).toBe(-0.5);
    expect(m.texto).toBe('+0.5 kg esta semana (meta até 0.5 kg)');
  });

  it('meta: perdeu 0,4 kg', () => {
    const m = emagrecaDevagar.meta(ctxPeso(90, 90.4));
    expect(m.zona).toBe('meta');
    expect(m.valor).toBe(0.4);
    expect(m.texto).toBe('−0.4 kg esta semana (meta até 0.5 kg)');
    expect(m.proximoPasso).toBe('ritmo certo — panturrilha estável confirma que é gordura');
    expect(m.posicao).toBeCloseTo(0.611, 2);
  });

  it('atencao: perdeu 0,8 kg', () => {
    const m = emagrecaDevagar.meta(ctxPeso(90, 90.8));
    expect(m.zona).toBe('atencao');
    expect(m.proximoPasso).toBe('rápido demais: não cortar mais nada esta semana; manter proteína e força');
    expect(m.posicao).toBeCloseTo(0.722, 2);
  });

  it('demais: perdeu 1,5 kg', () => {
    const m = emagrecaDevagar.meta(ctxPeso(90, 91.5));
    expect(m.zona).toBe('demais');
    expect(m.texto).toBe('−1.5 kg esta semana (meta até 0.5 kg)');
    expect(m.posicao).toBeCloseTo(0.917, 2);
  });

  it('sem-dado: falta a semana anterior ou a atual', () => {
    const m = emagrecaDevagar.meta(ctxPeso(90, null));
    expect(m.zona).toBe('sem-dado');
    expect(m.precisaDe).toEqual(['dia.peso']);
    expect(m.texto).toBe('precisa do peso em duas semanas seguidas');
    expect(emagrecaDevagar.meta(ctxPeso(null, null)).zona).toBe('sem-dado');
  });

  it('segurança: remédio para tireoide', () => {
    const ctx = ctxPeso(90, 90.4);
    const m = emagrecaDevagar.meta({ ...ctx, perfil: { ...perfilBase, remedios: ['tireoide'] } });
    expect(m.seguranca).toContain('remédio para tireoide');
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

```
cd app && pnpm vitest run src/dominio/metas/emagrecaDevagar.test.ts
```
Saída esperada: `FAIL … Failed to load url ./emagrecaDevagar`.

- [ ] **Step 3: Implementar `emagrecaDevagar.ts`**

`app/src/dominio/metas/emagrecaDevagar.ts`:

```ts
import { pos, r1 } from '../derivados';
import { aplicarSeguranca, semDado } from './_util';
import type { AcaoMeta, Zona } from './tipos';

export const emagrecaDevagar: AcaoMeta = {
  id: 'emagreca-devagar',
  aplica: () => true,
  meta(ctx) {
    const w = ctx.derivados.pesoMedioSemana;
    const w0 = ctx.derivados.pesoMedioSemanaAnterior;
    if (w === null || w0 === null) return semDado(['dia.peso'], 'precisa do peso em duas semanas seguidas');

    const ideal = r1(0.005 * w); // 0,5 % por semana
    const max = r1(0.01 * w); // 1 %
    const dl = r1(w0 - w); // perda (positivo = emagreceu)

    const zona: Zona = dl <= 0 ? 'pouco' : dl <= ideal ? 'meta' : dl <= max ? 'atencao' : 'demais';
    const delta = dl === 0 ? 'peso estável' : `${dl > 0 ? '−' : '+'}${Math.abs(dl)} kg`;
    const proximoPasso =
      dl <= 0
        ? 'peso estável: não é problema; se quer perder, o déficit moderado está nas Medidas'
        : dl <= ideal
          ? 'ritmo certo — panturrilha estável confirma que é gordura'
          : 'rápido demais: não cortar mais nada esta semana; manter proteína e força';

    return aplicarSeguranca('emagreca-devagar', ctx.perfil, {
      zona,
      valor: dl,
      faixa: { pouco: 0, meta: ideal, demais: max },
      posicao: dl <= 0 ? 0.15 : pos(dl, 0, max),
      texto: `${delta} esta semana (meta até ${ideal} kg)`,
      proximoPasso,
    });
  },
};
```

- [ ] **Step 4: Rodar e ver passar**

```
cd app && pnpm vitest run src/dominio/metas/emagrecaDevagar.test.ts
```
Saída esperada: `✓ … (8 tests)`.

- [ ] **Step 5: Commit**

```
git add app/src/dominio/metas/emagrecaDevagar.ts app/src/dominio/metas/emagrecaDevagar.test.ts
git commit -m "feat: meta emagreca-devagar"
```

- [ ] **Step 6: Teste de `meca-a-cintura` (falha)**

`app/src/dominio/metas/mecaACintura.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { mecaACintura } from './mecaACintura';
import { ctxBase, perfilBase, semanaBase } from './_fixtures';

describe('meca-a-cintura (só registro)', () => {
  it('aplica a todo perfil', () => {
    expect(mecaACintura.id).toBe('meca-a-cintura');
    expect(mecaACintura.aplica(perfilBase)).toBe(true);
  });

  it('meta: a semana mais recente tem cintura', () => {
    const m = mecaACintura.meta(ctxBase({ semana: semanaBase({ cintura: 100 }) }));
    expect(m).toEqual({
      zona: 'meta',
      valor: 100,
      faixa: null,
      posicao: null,
      texto: 'cintura 100 cm registrada (2026-W38)',
      proximoPasso: 'medir de novo na próxima segunda',
    });
  });

  it('meta: vale a semana mais recente mesmo que não seja a corrente', () => {
    const m = mecaACintura.meta(ctxBase({ semana: semanaBase({ semana: '2026-W37', cintura: 101 }) }));
    expect(m.zona).toBe('meta');
    expect(m.texto).toBe('cintura 101 cm registrada (2026-W37)');
  });

  it('sem-dado: semana sem cintura', () => {
    const m = mecaACintura.meta(ctxBase({ semana: semanaBase({ sessoesTiros: 2 }) }));
    expect(m.zona).toBe('sem-dado');
    expect(m.precisaDe).toEqual(['semana.cintura']);
    expect(m.texto).toBe('sem medida esta semana');
  });

  it('sem-dado: sem semana', () => {
    expect(mecaACintura.meta(ctxBase()).zona).toBe('sem-dado');
  });

  it('nunca é pouco, atencao ou demais', () => {
    expect(mecaACintura.meta(ctxBase({ semana: semanaBase({ cintura: 130 }) })).zona).toBe('meta');
    expect(mecaACintura.meta(ctxBase({ semana: semanaBase({ cintura: 60 }) })).zona).toBe('meta');
  });
});
```

- [ ] **Step 7: Rodar e ver falhar**

```
cd app && pnpm vitest run src/dominio/metas/mecaACintura.test.ts
```
Saída esperada: `FAIL … Failed to load url ./mecaACintura`.

- [ ] **Step 8: Implementar `mecaACintura.ts`**

`app/src/dominio/metas/mecaACintura.ts`:

```ts
import { aplicarSeguranca, semDado } from './_util';
import type { AcaoMeta } from './tipos';

/** Hábito de medida: aparece como Medida (whtr) na UI, não como card. Meta = mediu na semana mais recente. */
export const mecaACintura: AcaoMeta = {
  id: 'meca-a-cintura',
  aplica: () => true,
  meta(ctx) {
    const cintura = ctx.semana?.cintura;
    if (ctx.semana === undefined || cintura === undefined) {
      return semDado(['semana.cintura'], 'sem medida esta semana');
    }
    return aplicarSeguranca('meca-a-cintura', ctx.perfil, {
      zona: 'meta',
      valor: cintura,
      faixa: null,
      posicao: null,
      texto: `cintura ${cintura} cm registrada (${ctx.semana.semana})`,
      proximoPasso: 'medir de novo na próxima segunda',
    });
  },
};
```

- [ ] **Step 9: Rodar e ver passar**

```
cd app && pnpm vitest run src/dominio/metas/mecaACintura.test.ts
```
Saída esperada: `✓ … (6 tests)`.

- [ ] **Step 10: Commit**

```
git add app/src/dominio/metas/mecaACintura.ts app/src/dominio/metas/mecaACintura.test.ts
git commit -m "feat: meta meca-a-cintura"
```

- [ ] **Step 11: Teste de `panturrilha-preensao` (falha)**

`app/src/dominio/metas/panturrilhaPreensao.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { panturrilhaPreensao } from './panturrilhaPreensao';
import { ctxBase, mesBase, perfilBase } from './_fixtures';

describe('panturrilha-preensao (só registro)', () => {
  it('aplica a todo perfil', () => {
    expect(panturrilhaPreensao.id).toBe('panturrilha-preensao');
    expect(panturrilhaPreensao.aplica(perfilBase)).toBe(true);
  });

  it('meta: o mês tem panturrilha', () => {
    const m = panturrilhaPreensao.meta(ctxBase({ mes: mesBase({ panturrilha: 38 }) }));
    expect(m).toEqual({
      zona: 'meta',
      valor: 38,
      faixa: null,
      posicao: null,
      texto: 'panturrilha 38 cm registrada (2026-09)',
      proximoPasso: 'medir de novo na primeira segunda do próximo mês',
    });
  });

  it('meta: com preensão o texto cita as duas', () => {
    const m = panturrilhaPreensao.meta(ctxBase({ mes: mesBase({ panturrilha: 38, preensao: 40 }) }));
    expect(m.texto).toBe('panturrilha 38 cm e preensão 40 kg registradas (2026-09)');
  });

  it('sem-dado: mês só com preensão', () => {
    const m = panturrilhaPreensao.meta(ctxBase({ mes: mesBase({ preensao: 40 }) }));
    expect(m.zona).toBe('sem-dado');
    expect(m.precisaDe).toEqual(['mes.panturrilha']);
    expect(m.texto).toBe('sem medida este mês');
  });

  it('sem-dado: sem mês', () => {
    expect(panturrilhaPreensao.meta(ctxBase()).zona).toBe('sem-dado');
  });

  it('nunca é pouco, atencao ou demais', () => {
    expect(panturrilhaPreensao.meta(ctxBase({ mes: mesBase({ panturrilha: 30 }) })).zona).toBe('meta');
    expect(panturrilhaPreensao.meta(ctxBase({ mes: mesBase({ panturrilha: 45 }) })).zona).toBe('meta');
  });
});
```

- [ ] **Step 12: Rodar e ver falhar**

```
cd app && pnpm vitest run src/dominio/metas/panturrilhaPreensao.test.ts
```
Saída esperada: `FAIL … Failed to load url ./panturrilhaPreensao`.

- [ ] **Step 13: Implementar `panturrilhaPreensao.ts`**

`app/src/dominio/metas/panturrilhaPreensao.ts`:

```ts
import { aplicarSeguranca, semDado } from './_util';
import type { AcaoMeta } from './tipos';

/** Hábito de medida mensal: aparece como Medida na UI. Meta = mediu a panturrilha no mês mais recente. */
export const panturrilhaPreensao: AcaoMeta = {
  id: 'panturrilha-preensao',
  aplica: () => true,
  meta(ctx) {
    const panturrilha = ctx.mes?.panturrilha;
    if (ctx.mes === undefined || panturrilha === undefined) {
      return semDado(['mes.panturrilha'], 'sem medida este mês');
    }
    const preensao = ctx.mes.preensao;
    const texto =
      preensao === undefined
        ? `panturrilha ${panturrilha} cm registrada (${ctx.mes.mes})`
        : `panturrilha ${panturrilha} cm e preensão ${preensao} kg registradas (${ctx.mes.mes})`;
    return aplicarSeguranca('panturrilha-preensao', ctx.perfil, {
      zona: 'meta',
      valor: panturrilha,
      faixa: null,
      posicao: null,
      texto,
      proximoPasso: 'medir de novo na primeira segunda do próximo mês',
    });
  },
};
```

- [ ] **Step 14: Rodar e ver passar**

```
cd app && pnpm vitest run src/dominio/metas/panturrilhaPreensao.test.ts
```
Saída esperada: `✓ … (6 tests)`.

- [ ] **Step 15: Commit**

```
git add app/src/dominio/metas/panturrilhaPreensao.ts app/src/dominio/metas/panturrilhaPreensao.test.ts
git commit -m "feat: meta panturrilha-preensao"
```

---

### Task 7: Registro `metas/index.ts` + teste de contrato

**Files:**
- Create: `app/src/dominio/metas/index.ts`
- Test: `app/src/dominio/metas/index.test.ts`

**Interfaces:**
- Consumes: `catalogo` (`../catalogo`), `AcaoCatalogo`, `AcaoId` (`../catalogo/tipos`), os 22 módulos de ação.
- Produces:
  - `export const METAS: Record<AcaoId, AcaoMeta>`
  - `export function metasAplicaveis(ctx: Contexto): Array<{ acao: AcaoCatalogo; meta: Meta }>` — só `aplica(perfil)`, na ordem do catálogo
  - `export function acoesEmFoco(ctx: Contexto, n = 3): Array<{ acao: AcaoCatalogo; meta: Meta }>` — zona `pouco`/`atencao`, ordenado por `posicao` desc (mais perto da meta primeiro), no máximo `n`

- [ ] **Step 1: Teste de contrato (falha)**

`app/src/dominio/metas/index.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { catalogo } from '../catalogo';
import { METAS, acoesEmFoco, metasAplicaveis } from './index';
import { HOJE, ctxBase, diaBase, perfilBase, semanaBase } from './_fixtures';

describe('contrato catálogo ↔ METAS', () => {
  it('as chaves de METAS são exatamente os 22 ids do catálogo', () => {
    const ids = catalogo.acoes.map((a) => a.id).sort();
    expect(ids).toHaveLength(22);
    expect(Object.keys(METAS).sort()).toEqual(ids);
  });

  it('cada módulo declara o próprio id', () => {
    for (const [id, modulo] of Object.entries(METAS)) expect(modulo.id).toBe(id);
  });

  it('com contexto vazio todo módulo devolve sem-dado e nunca chuta valor', () => {
    const ctx = ctxBase();
    for (const modulo of Object.values(METAS)) {
      const m = modulo.meta(ctx);
      expect(m.zona, modulo.id).toBe('sem-dado');
      expect(m.valor, modulo.id).toBeNull();
      expect(m.faixa, modulo.id).toBeNull();
      expect(m.posicao, modulo.id).toBeNull();
      expect(m.precisaDe?.length, modulo.id).toBeGreaterThan(0);
    }
  });
});

describe('metasAplicaveis', () => {
  it('esconde ultimo-cafe e se-beber com perfil "nao"', () => {
    const r = metasAplicaveis(ctxBase({ perfil: { ...perfilBase, cafe: 'nao', alcool: 'nao' } }));
    const ids = r.map((x) => x.acao.id);
    expect(ids).toHaveLength(20);
    expect(ids).not.toContain('ultimo-cafe');
    expect(ids).not.toContain('se-beber');
  });

  it('com café diário e álcool às vezes mostra as 22 na ordem do catálogo, com o AcaoCatalogo inteiro', () => {
    const r = metasAplicaveis(ctxBase());
    expect(r.map((x) => x.acao.id)).toEqual(catalogo.acoes.map((a) => a.id));
    expect(r[0].acao.titulo).toBe(catalogo.acoes[0].titulo);
    expect(r[0].meta.zona).toBe('sem-dado');
  });
});

describe('acoesEmFoco', () => {
  it('contexto vazio: nada em foco', () => {
    expect(acoesEmFoco(ctxBase())).toEqual([]);
  });

  it('só pouco/atencao, mais perto da meta primeiro, no máximo n', () => {
    const ctx = ctxBase({
      hoje: diaBase(HOJE, { passos: 4000, fibraG: 20, proteinaG: 60, refeicoesCozinhadas: 2, minPosJantar: 0 }),
      semana: semanaBase({ sessoesTiros: 3 }),
      derivados: { diasParado: 0 },
    });
    // posições: passos 0.375 (atencao) > fibra 0.1875 (atencao) > proteína 0.167 (pouco) > jantar 0.06 (pouco)
    // fora: tres-tiros (meta), comida-de-verdade (meta), nunca-dois-dias (meta), o resto sem-dado
    const tres = acoesEmFoco(ctx);
    expect(tres.map((x) => x.acao.id)).toEqual(['seis-mil-passos', 'fibra-no-prato', 'proteina-no-prato']);
    for (const x of tres) expect(x.meta.proximoPasso.length).toBeGreaterThan(0);

    const quatro = acoesEmFoco(ctx, 4);
    expect(quatro.map((x) => x.acao.id)).toEqual([
      'seis-mil-passos',
      'fibra-no-prato',
      'proteina-no-prato',
      'ande-depois-do-jantar',
    ]);
  });

  it('respeita aplica(): se-beber em atencao some com perfil "nao"', () => {
    const base = { semana: semanaBase({ alcoolDoses: 3 }) };
    expect(acoesEmFoco(ctxBase(base)).map((x) => x.acao.id)).toContain('se-beber');
    expect(
      acoesEmFoco(ctxBase({ ...base, perfil: { ...perfilBase, alcool: 'nao' } })).map((x) => x.acao.id),
    ).not.toContain('se-beber');
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

```
cd app && pnpm vitest run src/dominio/metas/index.test.ts
```
Saída esperada: `FAIL … Failed to load url ./index`.

- [ ] **Step 3: Implementar `index.ts`**

`app/src/dominio/metas/index.ts`:

```ts
import { catalogo } from '../catalogo';
import type { AcaoCatalogo, AcaoId } from '../catalogo/tipos';
import { andeDepoisDoJantar } from './andeDepoisDoJantar';
import { anoteOSono } from './anoteOSono';
import { bebaPelaSede } from './bebaPelaSede';
import { comidaDeVerdade } from './comidaDeVerdade';
import { durma7 } from './durma7';
import { emagrecaDevagar } from './emagrecaDevagar';
import { fecheACozinha } from './fecheACozinha';
import { fibraNoPrato } from './fibraNoPrato';
import { janteCedo } from './janteCedo';
import { levanteACada30 } from './levanteACada30';
import { levantePeso } from './levantePeso';
import { mecaACintura } from './mecaACintura';
import { nuncaDoisDias } from './nuncaDoisDias';
import { panturrilhaPreensao } from './panturrilhaPreensao';
import { pergunteAFome } from './pergunteAFome';
import { proteinaNoPrato } from './proteinaNoPrato';
import { seBeber } from './seBeber';
import { seisMilPassos } from './seisMilPassos';
import { some150 } from './some150';
import type { AcaoMeta, Contexto, Meta } from './tipos';
import { tresTiros } from './tresTiros';
import { troqueODoce } from './troqueODoce';
import { ultimoCafe } from './ultimoCafe';

export type { AcaoMeta, Contexto, Faixa, Meta, Zona } from './tipos';

export const METAS: Record<AcaoId, AcaoMeta> = {
  'tres-tiros': tresTiros,
  'levante-peso': levantePeso,
  'some-150': some150,
  'levante-a-cada-30': levanteACada30,
  'ande-depois-do-jantar': andeDepoisDoJantar,
  'nunca-dois-dias': nuncaDoisDias,
  'seis-mil-passos': seisMilPassos,
  'durma-7': durma7,
  'ultimo-cafe': ultimoCafe,
  'jante-cedo': janteCedo,
  'anote-o-sono': anoteOSono,
  'proteina-no-prato': proteinaNoPrato,
  'fibra-no-prato': fibraNoPrato,
  'feche-a-cozinha': fecheACozinha,
  'troque-o-doce': troqueODoce,
  'comida-de-verdade': comidaDeVerdade,
  'beba-pela-sede': bebaPelaSede,
  'se-beber': seBeber,
  'pergunte-a-fome': pergunteAFome,
  'emagreca-devagar': emagrecaDevagar,
  'meca-a-cintura': mecaACintura,
  'panturrilha-preensao': panturrilhaPreensao,
};

export interface AcaoComMeta {
  acao: AcaoCatalogo;
  meta: Meta;
}

/** Só as ações cujo `aplica(perfil)` é verdadeiro, na ordem do catálogo. */
export function metasAplicaveis(ctx: Contexto): AcaoComMeta[] {
  return catalogo.acoes
    .filter((acao) => METAS[acao.id].aplica(ctx.perfil))
    .map((acao) => ({ acao, meta: METAS[acao.id].meta(ctx) }));
}

/** As `n` ações em `pouco`/`atencao` mais perto da meta (maior `posicao` primeiro). */
export function acoesEmFoco(ctx: Contexto, n = 3): AcaoComMeta[] {
  return metasAplicaveis(ctx)
    .filter(({ meta }) => meta.zona === 'pouco' || meta.zona === 'atencao')
    .sort((a, b) => (b.meta.posicao ?? -1) - (a.meta.posicao ?? -1))
    .slice(0, n);
}
```

- [ ] **Step 4: Rodar e ver passar**

```
cd app && pnpm vitest run src/dominio/metas/index.test.ts
```
Saída esperada: `✓ src/dominio/metas/index.test.ts (8 tests)`. Se o teste "contexto vazio" falhar em `nunca-dois-dias`, `durma-7`, `feche-a-cozinha` ou `emagreca-devagar`, é `derivar()` do plano 01 devolvendo número em vez de `null` com entrada vazia — corrija lá.

- [ ] **Step 5: Commit**

```
git add app/src/dominio/metas/index.ts app/src/dominio/metas/index.test.ts
git commit -m "feat: registro METAS, metasAplicaveis e acoesEmFoco com teste de contrato"
```

---

### Task 8: Medidas (`medidas/index.ts`)

**Files:**
- Create: `app/src/dominio/medidas/index.ts`
- Test: `app/src/dominio/medidas/index.test.ts`

**Interfaces:**
- Consumes: `Contexto`, `Zona` (`../metas/tipos`), `r1` (`../derivados`), fixtures de `../metas/_fixtures`.
- Produces:
  - `export type MedidaId = 'imc' | 'whtr' | 'panturrilha' | 'preensao' | 'fc_repouso' | 'fc_max' | 'rmr' | 'agua' | 'peso'`
  - `export interface MedidaResultado { id: MedidaId; valor: number | null; unidade: string; zona: Zona | 'neutra'; texto: string; zonas: Array<{ tom: 'ok' | 'weak' | 'bad'; rotulo: string }> }`
  - `export function medidas(ctx: Contexto): MedidaResultado[]` — sempre as 9, nesta ordem

Transcrição de `medida()` da PoC. Mapeamento de `'none'` da PoC: sem valor → `'sem-dado'`; com valor mas sem zona (referência) → `'neutra'`. Fontes dos valores:

| medida | valor | zona |
|---|---|---|
| imc | `derivados.imc` | < 25 meta; < 30 atencao; ≥ 30 pouco |
| whtr | `semana.cintura / perfil.altura` (2 casas) | < 0,50 meta; cintura < `corteCintura` atencao; senão pouco |
| panturrilha | `mes.panturrilha` | ≥ `pantCorte` meta; ≥ `pantGrave` atencao; senão pouco |
| preensao | `mes.preensao` | ≥ `preensaoCorte` meta; senão pouco |
| fc_repouso | `derivados.fcRepousoMedia7d` | ≤ 75 meta; ≤ 85 atencao; > 85 pouco |
| fc_max | `derivados.fcMax` | neutra |
| rmr | `derivados.rmr` (+ pal, tdee, defLo, defHi) | neutra |
| agua | valor = `derivados.coposMeta`; zona por `hoje.copos` | < 60 % pouco; < ref atencao; ≥ ref meta; sem copos hoje → neutra |
| peso | `derivados.pesoMedioSemana` vs `pesoMedioSemanaAnterior` | perda ≤ 0 neutra; ≤ 0,5 % meta; ≤ 1 % atencao; > 1 % pouco; sem anterior → neutra |

- [ ] **Step 1: Teste das 9 medidas (falha)**

`app/src/dominio/medidas/index.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { medidas, type MedidaId, type MedidaResultado } from './index';
import { HOJE, ctxBase, diaBase, mesBase, perfilBase, semanaBase, type CtxParcial } from '../metas/_fixtures';

function medida(id: MedidaId, parcial: CtxParcial = {}): MedidaResultado {
  const r = medidas(ctxBase(parcial)).find((m) => m.id === id);
  if (!r) throw new Error(`medida ${id} não veio`);
  return r;
}

describe('medidas(ctx)', () => {
  it('devolve sempre as 9, na ordem do catálogo', () => {
    expect(medidas(ctxBase()).map((m) => m.id)).toEqual([
      'imc',
      'whtr',
      'panturrilha',
      'preensao',
      'fc_repouso',
      'fc_max',
      'rmr',
      'agua',
      'peso',
    ]);
  });
});

describe('imc', () => {
  it('atencao: 29,4 sobrepeso', () => {
    const m = medida('imc', { derivados: { imc: 29.4 } });
    expect(m.valor).toBe(29.4);
    expect(m.unidade).toBe('');
    expect(m.zona).toBe('atencao');
    expect(m.texto).toBe('Categoria: sobrepeso. Tiros no máximo são o padrão dos estudos.');
    expect(m.zonas).toEqual([
      { tom: 'weak', rotulo: '< 18,5 abaixo' },
      { tom: 'ok', rotulo: '18,5–24,9' },
      { tom: 'weak', rotulo: '25–29,9 sobrepeso' },
      { tom: 'bad', rotulo: '≥ 30 obesidade' },
    ]);
  });

  it('pouco: 32 obesidade I com o ponto de partida dos tiros', () => {
    const m = medida('imc', { derivados: { imc: 32 } });
    expect(m.zona).toBe('pouco');
    expect(m.texto).toBe(
      'Categoria: obesidade I. Ponto de partida dos tiros: 70% do esforço já mantém o ganho enzimático (Boyd 2013). Não é falha, é dose de entrada.',
    );
  });

  it('meta: 23 normal; categorias extremas', () => {
    expect(medida('imc', { derivados: { imc: 23 } }).zona).toBe('meta');
    expect(medida('imc', { derivados: { imc: 17 } }).texto).toContain('Categoria: abaixo.');
    expect(medida('imc', { derivados: { imc: 37 } }).texto).toContain('Categoria: obesidade II.');
    expect(medida('imc', { derivados: { imc: 41 } }).texto).toContain('Categoria: obesidade III.');
  });

  it('sem-dado', () => {
    const m = medida('imc', { derivados: { imc: null } });
    expect(m.zona).toBe('sem-dado');
    expect(m.valor).toBeNull();
    expect(m.texto).toBe('preencha peso e altura no perfil');
  });
});

describe('whtr (altura 175 → meta abaixo de 88 cm; corte de risco H = 88)', () => {
  it('pouco: cintura 100', () => {
    const m = medida('whtr', { semana: semanaBase({ cintura: 100 }) });
    expect(m.valor).toBeCloseTo(0.571, 3);
    expect(m.zona).toBe('pouco');
    expect(m.texto).toBe('Meta: abaixo de 88 cm (0,5 × 175). Hoje 100 cm — acima do corte de risco (88 cm). Faltam 12 cm.');
    expect(m.zonas).toEqual([
      { tom: 'ok', rotulo: '< 0,50' },
      { tom: 'weak', rotulo: '0,50–0,59' },
      { tom: 'bad', rotulo: '≥ 0,60' },
    ]);
  });

  it('atencao: cintura 87,5 (0,50, abaixo do corte)', () => {
    const m = medida('whtr', { semana: semanaBase({ cintura: 87.5 }) });
    expect(m.valor).toBeCloseTo(0.5, 3);
    expect(m.zona).toBe('atencao');
  });

  it('meta: cintura 86', () => {
    const m = medida('whtr', { semana: semanaBase({ cintura: 86 }) });
    expect(m.valor).toBeCloseTo(0.491, 3);
    expect(m.zona).toBe('meta');
    expect(m.texto).toBe('Meta: abaixo de 88 cm (0,5 × 175). Hoje 86 cm. Faltam 0 cm.');
  });

  it('sem-dado: sem cintura', () => {
    const m = medida('whtr');
    expect(m.zona).toBe('sem-dado');
    expect(m.valor).toBeNull();
    expect(m.texto).toBe('registre a cintura na revisão de segunda');
  });
});

describe('panturrilha (H: corte 34 / grave 32)', () => {
  it('meta: 38 cm', () => {
    const m = medida('panturrilha', { mes: mesBase({ panturrilha: 38 }) });
    expect(m.valor).toBe(38);
    expect(m.unidade).toBe('cm');
    expect(m.zona).toBe('meta');
    expect(m.texto).toBe('Corte: 34 cm (baixa) / 32 cm (grave). Meta: estável ou subindo enquanto a cintura cai.');
    expect(m.zonas).toEqual([
      { tom: 'bad', rotulo: '< 32 grave' },
      { tom: 'weak', rotulo: '32–33.9 baixa' },
      { tom: 'ok', rotulo: '≥ 34' },
    ]);
  });

  it('atencao 33; pouco 31', () => {
    expect(medida('panturrilha', { mes: mesBase({ panturrilha: 33 }) }).zona).toBe('atencao');
    expect(medida('panturrilha', { mes: mesBase({ panturrilha: 31 }) }).zona).toBe('pouco');
  });

  it('mulher usa 33 / 31', () => {
    const m = medida('panturrilha', { perfil: { ...perfilBase, sexo: 'M' }, mes: mesBase({ panturrilha: 33.5 }) });
    expect(m.zona).toBe('meta');
    expect(m.texto).toContain('Corte: 33 cm (baixa) / 31 cm (grave)');
  });

  it('sem-dado', () => {
    const m = medida('panturrilha');
    expect(m.zona).toBe('sem-dado');
    expect(m.texto).toBe('meça a panturrilha na primeira segunda do mês');
  });
});

describe('preensao (H: corte 27 kg)', () => {
  it('meta: 30 kg', () => {
    const m = medida('preensao', { mes: mesBase({ preensao: 30 }) });
    expect(m.valor).toBe(30);
    expect(m.unidade).toBe('kg');
    expect(m.zona).toBe('meta');
    expect(m.texto).toBe('Corte: 27 kg. Meta: subir com o treino de força em 4–8 semanas.');
    expect(m.zonas).toEqual([
      { tom: 'bad', rotulo: '< 27 kg' },
      { tom: 'ok', rotulo: '≥ 27 kg' },
    ]);
  });

  it('pouco: 20 kg', () => {
    expect(medida('preensao', { mes: mesBase({ preensao: 20 }) }).zona).toBe('pouco');
  });

  it('sem-dado com a dica do exercício fixo', () => {
    const m = medida('preensao');
    expect(m.zona).toBe('sem-dado');
    expect(m.valor).toBeNull();
    expect(m.texto).toBe(
      'Sem dinamômetro: anote repetições até falhar num exercício fixo (flexão ou agachamento) e compare semana a semana.',
    );
    expect(m.zonas).toHaveLength(2);
  });
});

describe('fc_repouso', () => {
  it('meta: 58 e 72', () => {
    const m = medida('fc_repouso', { derivados: { fcRepousoMedia7d: 72 } });
    expect(m.valor).toBe(72);
    expect(m.unidade).toBe('bpm');
    expect(m.zona).toBe('meta');
    expect(m.texto).toBe(
      'Meta: cair 3–10 bpm em 4–8 semanas de treino regular. Subiu 5+ bpm na média de 7 dias? Excesso, infecção, álcool ou sono ruim.',
    );
    expect(medida('fc_repouso', { derivados: { fcRepousoMedia7d: 58 } }).zona).toBe('meta');
    expect(m.zonas).toEqual([
      { tom: 'ok', rotulo: '< 75 (treinado: < 60)' },
      { tom: 'weak', rotulo: '75–85' },
      { tom: 'bad', rotulo: '> 85 ou subindo' },
    ]);
  });

  it('atencao 80; pouco 90', () => {
    expect(medida('fc_repouso', { derivados: { fcRepousoMedia7d: 80 } }).zona).toBe('atencao');
    expect(medida('fc_repouso', { derivados: { fcRepousoMedia7d: 90 } }).zona).toBe('pouco');
  });

  it('sem-dado', () => {
    const m = medida('fc_repouso', { derivados: { fcRepousoMedia7d: null } });
    expect(m.zona).toBe('sem-dado');
    expect(m.texto).toBe('registre a FC ao acordar por 7 dias');
  });
});

describe('fc_max', () => {
  it('neutra com as zonas de esforço', () => {
    const m = medida('fc_max', { derivados: { fcMax: 180, fc60: 108, fc70: 126, fc85: 153 } });
    expect(m.valor).toBe(180);
    expect(m.unidade).toBe('bpm');
    expect(m.zona).toBe('neutra');
    expect(m.texto).toBe(
      'Ritmo de conversa ≈ 108–126 bpm (60–70%). Tiros no máximo: acima de ~153 (85%). Recuperação: cair pelo menos 12 bpm no 1º minuto após o último tiro.',
    );
    expect(m.zonas).toEqual([
      { tom: 'ok', rotulo: 'conversa 60–70%' },
      { tom: 'weak', rotulo: 'moderado-forte 70–85%' },
      { tom: 'bad', rotulo: 'máximo > 85%' },
    ]);
  });

  it('sem-dado sem idade', () => {
    const m = medida('fc_max', { derivados: { fcMax: null, fc60: null, fc70: null, fc85: null } });
    expect(m.zona).toBe('sem-dado');
    expect(m.texto).toBe('preencha a idade no perfil');
  });
});

describe('rmr', () => {
  it('neutra com déficit moderado', () => {
    const m = medida('rmr', { derivados: { rmr: 1799, pal: 1.4, tdee: 2519, defLo: 378, defHi: 630 } });
    expect(m.valor).toBe(1799);
    expect(m.unidade).toBe('kcal/dia');
    expect(m.zona).toBe('neutra');
    expect(m.texto).toBe(
      'Com seu nível de atividade (fator 1.4): gasto total ≈ 2519 kcal/dia. Déficit moderado = 378–630 kcal/dia → ~0,5 kg/semana, adaptação de 50–120 kcal/dia. Abaixo de 1260 kcal/dia é severo.',
    );
    expect(m.zonas).toEqual([
      { tom: 'ok', rotulo: 'déficit 15–25%' },
      { tom: 'weak', rotulo: '25–40%' },
      { tom: 'bad', rotulo: '≥ 40–50% ou comer pouco e treinar muito' },
    ]);
  });

  it('sem-dado', () => {
    const m = medida('rmr', { derivados: { rmr: null, pal: null, tdee: null, defLo: null, defHi: null } });
    expect(m.zona).toBe('sem-dado');
    expect(m.texto).toBe('preencha peso, altura e idade no perfil');
  });
});

describe('agua (referência fixada em 8 copos / 2 L)', () => {
  const ref = { coposMeta: 8, aguaMetaL: 2 };

  it('neutra sem copos hoje', () => {
    const m = medida('agua', { derivados: ref });
    expect(m.valor).toBe(8);
    expect(m.unidade).toBe('copos (2 L)');
    expect(m.zona).toBe('neutra');
    expect(m.texto).toBe('Base 2,0 L de bebidas + 0 L pelo treino de hoje. Hoje: — copos. Urina cor 1–3 confirma; café conta.');
    expect(m.zonas).toEqual([
      { tom: 'bad', rotulo: 'urina escura, < 60% da referência' },
      { tom: 'ok', rotulo: 'referência ± sede' },
      { tom: 'bad', rotulo: '> 1 L/h além da sede em exercício longo' },
    ]);
  });

  it('pouco 4, atencao 5, meta 9', () => {
    expect(medida('agua', { hoje: diaBase(HOJE, { copos: 4 }), derivados: ref }).zona).toBe('pouco');
    const m = medida('agua', { hoje: diaBase(HOJE, { copos: 5 }), derivados: ref });
    expect(m.zona).toBe('atencao');
    expect(m.texto).toContain('Hoje: 5 copos.');
    expect(medida('agua', { hoje: diaBase(HOJE, { copos: 9 }), derivados: ref }).zona).toBe('meta');
  });

  it('mulher: base 1,6 L; treino de hoje soma na referência', () => {
    const m = medida('agua', { perfil: { ...perfilBase, sexo: 'M' }, derivados: { coposMeta: 8, aguaMetaL: 2 } });
    expect(m.texto).toContain('Base 1,6 L de bebidas + 0.4 L pelo treino de hoje.');
  });
});

describe('peso (média 90 → meta até 0,5 kg/sem, 1 % = 0,9)', () => {
  it('meta: −0,4 kg', () => {
    const m = medida('peso', { derivados: { pesoMedioSemana: 90, pesoMedioSemanaAnterior: 90.4 } });
    expect(m.valor).toBe(90);
    expect(m.unidade).toBe('kg');
    expect(m.zona).toBe('meta');
    expect(m.texto).toBe('Esta semana: −0.4 kg. Meta de velocidade: até 0.5 kg/semana (0,5%); acima de 0.9 é rápido demais.');
    expect(m.zonas).toEqual([
      { tom: 'ok', rotulo: 'até 0,5%/sem' },
      { tom: 'weak', rotulo: '0,5–1%/sem' },
      { tom: 'bad', rotulo: '> 1%/sem sustentado' },
    ]);
  });

  it('atencao −0,8; pouco −1,5; neutra estável ou ganhou', () => {
    expect(medida('peso', { derivados: { pesoMedioSemana: 90, pesoMedioSemanaAnterior: 90.8 } }).zona).toBe('atencao');
    expect(medida('peso', { derivados: { pesoMedioSemana: 90, pesoMedioSemanaAnterior: 91.5 } }).zona).toBe('pouco');
    const estavel = medida('peso', { derivados: { pesoMedioSemana: 90, pesoMedioSemanaAnterior: 90 } });
    expect(estavel.zona).toBe('neutra');
    expect(estavel.texto).toContain('Esta semana: peso estável.');
    const ganhou = medida('peso', { derivados: { pesoMedioSemana: 90, pesoMedioSemanaAnterior: 89.5 } });
    expect(ganhou.zona).toBe('neutra');
    expect(ganhou.texto).toContain('Esta semana: +0.5 kg.');
  });

  it('neutra sem semana anterior', () => {
    const m = medida('peso', { derivados: { pesoMedioSemana: 90, pesoMedioSemanaAnterior: null } });
    expect(m.zona).toBe('neutra');
    expect(m.valor).toBe(90);
    expect(m.texto).toBe('Média da semana. Registre mais uma semana para ver a velocidade.');
  });

  it('sem-dado sem peso', () => {
    const m = medida('peso', { derivados: { pesoMedioSemana: null, pesoMedioSemanaAnterior: null } });
    expect(m.zona).toBe('sem-dado');
    expect(m.valor).toBeNull();
    expect(m.texto).toBe('registre o peso alguns dias na semana');
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

```
cd app && pnpm vitest run src/dominio/medidas/index.test.ts
```
Saída esperada: `FAIL … Failed to load url ./index`.

- [ ] **Step 3: Implementar `medidas/index.ts`**

`app/src/dominio/medidas/index.ts`:

```ts
import { r1 } from '../derivados';
import type { Contexto, Zona } from '../metas/tipos';

export type MedidaId = 'imc' | 'whtr' | 'panturrilha' | 'preensao' | 'fc_repouso' | 'fc_max' | 'rmr' | 'agua' | 'peso';

export interface MedidaResultado {
  id: MedidaId;
  valor: number | null;
  unidade: string;
  zona: Zona | 'neutra';
  texto: string;
  zonas: Array<{ tom: 'ok' | 'weak' | 'bad'; rotulo: string }>;
}

type Rotulo = MedidaResultado['zonas'][number];
const z = (tom: Rotulo['tom'], rotulo: string): Rotulo => ({ tom, rotulo });

function imc(ctx: Contexto): MedidaResultado {
  const zonas = [z('weak', '< 18,5 abaixo'), z('ok', '18,5–24,9'), z('weak', '25–29,9 sobrepeso'), z('bad', '≥ 30 obesidade')];
  const v = ctx.derivados.imc;
  if (v === null) return { id: 'imc', valor: null, unidade: '', zona: 'sem-dado', texto: 'preencha peso e altura no perfil', zonas };

  const categoria =
    v < 18.5 ? 'abaixo' : v < 25 ? 'normal' : v < 30 ? 'sobrepeso' : v < 35 ? 'obesidade I' : v < 40 ? 'obesidade II' : 'obesidade III';
  const zona: Zona = v < 25 ? 'meta' : v < 30 ? 'atencao' : 'pouco';
  const texto =
    `Categoria: ${categoria}. ` +
    (v >= 30
      ? 'Ponto de partida dos tiros: 70% do esforço já mantém o ganho enzimático (Boyd 2013). Não é falha, é dose de entrada.'
      : 'Tiros no máximo são o padrão dos estudos.');
  return { id: 'imc', valor: v, unidade: '', zona, texto, zonas };
}

function whtr(ctx: Contexto): MedidaResultado {
  const zonas = [z('ok', '< 0,50'), z('weak', '0,50–0,59'), z('bad', '≥ 0,60')];
  const c = ctx.semana?.cintura;
  const h = ctx.perfil.altura;
  if (c === undefined || !h) {
    return { id: 'whtr', valor: null, unidade: '', zona: 'sem-dado', texto: 'registre a cintura na revisão de segunda', zonas };
  }
  const corte = ctx.derivados.corteCintura;
  const r = r1((c / h) * 100) / 100;
  const zona: Zona = r < 0.5 ? 'meta' : c < corte ? 'atencao' : 'pouco';
  const metaCm = Math.round(h / 2);
  const texto =
    `Meta: abaixo de ${metaCm} cm (0,5 × ${h}). Hoje ${c} cm` +
    (c >= corte ? ` — acima do corte de risco (${corte} cm)` : '') +
    `. Faltam ${Math.max(0, c - metaCm)} cm.`;
  return { id: 'whtr', valor: r, unidade: '', zona, texto, zonas };
}

function panturrilha(ctx: Contexto): MedidaResultado {
  const { pantCorte, pantGrave } = ctx.derivados;
  const zonas = [z('bad', `< ${pantGrave} grave`), z('weak', `${pantGrave}–${r1(pantCorte - 0.1)} baixa`), z('ok', `≥ ${pantCorte}`)];
  const p = ctx.mes?.panturrilha;
  if (p === undefined) {
    return { id: 'panturrilha', valor: null, unidade: 'cm', zona: 'sem-dado', texto: 'meça a panturrilha na primeira segunda do mês', zonas };
  }
  const zona: Zona = p >= pantCorte ? 'meta' : p >= pantGrave ? 'atencao' : 'pouco';
  const texto = `Corte: ${pantCorte} cm (baixa) / ${pantGrave} cm (grave). Meta: estável ou subindo enquanto a cintura cai.`;
  return { id: 'panturrilha', valor: p, unidade: 'cm', zona, texto, zonas };
}

function preensao(ctx: Contexto): MedidaResultado {
  const corte = ctx.derivados.preensaoCorte;
  const zonas = [z('bad', `< ${corte} kg`), z('ok', `≥ ${corte} kg`)];
  const p = ctx.mes?.preensao;
  if (p === undefined) {
    return {
      id: 'preensao',
      valor: null,
      unidade: 'kg',
      zona: 'sem-dado',
      texto: 'Sem dinamômetro: anote repetições até falhar num exercício fixo (flexão ou agachamento) e compare semana a semana.',
      zonas,
    };
  }
  const zona: Zona = p >= corte ? 'meta' : 'pouco';
  return { id: 'preensao', valor: p, unidade: 'kg', zona, texto: `Corte: ${corte} kg. Meta: subir com o treino de força em 4–8 semanas.`, zonas };
}

function fcRepouso(ctx: Contexto): MedidaResultado {
  const zonas = [z('ok', '< 75 (treinado: < 60)'), z('weak', '75–85'), z('bad', '> 85 ou subindo')];
  const f = ctx.derivados.fcRepousoMedia7d;
  if (f === null) return { id: 'fc_repouso', valor: null, unidade: 'bpm', zona: 'sem-dado', texto: 'registre a FC ao acordar por 7 dias', zonas };
  const zona: Zona = f <= 75 ? 'meta' : f <= 85 ? 'atencao' : 'pouco';
  const texto =
    'Meta: cair 3–10 bpm em 4–8 semanas de treino regular. Subiu 5+ bpm na média de 7 dias? Excesso, infecção, álcool ou sono ruim.';
  return { id: 'fc_repouso', valor: f, unidade: 'bpm', zona, texto, zonas };
}

function fcMax(ctx: Contexto): MedidaResultado {
  const zonas = [z('ok', 'conversa 60–70%'), z('weak', 'moderado-forte 70–85%'), z('bad', 'máximo > 85%')];
  const { fcMax: v, fc60, fc70, fc85 } = ctx.derivados;
  if (v === null || fc60 === null || fc70 === null || fc85 === null) {
    return { id: 'fc_max', valor: null, unidade: 'bpm', zona: 'sem-dado', texto: 'preencha a idade no perfil', zonas };
  }
  const texto = `Ritmo de conversa ≈ ${fc60}–${fc70} bpm (60–70%). Tiros no máximo: acima de ~${fc85} (85%). Recuperação: cair pelo menos 12 bpm no 1º minuto após o último tiro.`;
  return { id: 'fc_max', valor: v, unidade: 'bpm', zona: 'neutra', texto, zonas };
}

function rmr(ctx: Contexto): MedidaResultado {
  const zonas = [z('ok', 'déficit 15–25%'), z('weak', '25–40%'), z('bad', '≥ 40–50% ou comer pouco e treinar muito')];
  const { rmr: v, pal, tdee, defLo, defHi } = ctx.derivados;
  if (v === null || pal === null || tdee === null || defLo === null || defHi === null) {
    return { id: 'rmr', valor: null, unidade: 'kcal/dia', zona: 'sem-dado', texto: 'preencha peso, altura e idade no perfil', zonas };
  }
  const texto = `Com seu nível de atividade (fator ${pal}): gasto total ≈ ${tdee} kcal/dia. Déficit moderado = ${defLo}–${defHi} kcal/dia → ~0,5 kg/semana, adaptação de 50–120 kcal/dia. Abaixo de ${Math.round(tdee * 0.5)} kcal/dia é severo.`;
  return { id: 'rmr', valor: v, unidade: 'kcal/dia', zona: 'neutra', texto, zonas };
}

function agua(ctx: Contexto): MedidaResultado {
  const zonas = [z('bad', 'urina escura, < 60% da referência'), z('ok', 'referência ± sede'), z('bad', '> 1 L/h além da sede em exercício longo')];
  const { coposMeta, aguaMetaL } = ctx.derivados;
  const homem = ctx.perfil.sexo === 'H';
  const base = homem ? 2.0 : 1.6;
  const n = ctx.hoje?.copos;
  const zona: Zona | 'neutra' = n === undefined ? 'neutra' : n < coposMeta * 0.6 ? 'pouco' : n < coposMeta ? 'atencao' : 'meta';
  const texto = `Base ${homem ? '2,0' : '1,6'} L de bebidas + ${r1(Math.max(0, aguaMetaL - base))} L pelo treino de hoje. Hoje: ${n === undefined ? '—' : n} copos. Urina cor 1–3 confirma; café conta.`;
  return { id: 'agua', valor: coposMeta, unidade: `copos (${aguaMetaL} L)`, zona, texto, zonas };
}

function peso(ctx: Contexto): MedidaResultado {
  const zonas = [z('ok', 'até 0,5%/sem'), z('weak', '0,5–1%/sem'), z('bad', '> 1%/sem sustentado')];
  const w = ctx.derivados.pesoMedioSemana;
  const w0 = ctx.derivados.pesoMedioSemanaAnterior;
  if (w === null) return { id: 'peso', valor: null, unidade: 'kg', zona: 'sem-dado', texto: 'registre o peso alguns dias na semana', zonas };
  if (w0 === null) {
    return { id: 'peso', valor: w, unidade: 'kg', zona: 'neutra', texto: 'Média da semana. Registre mais uma semana para ver a velocidade.', zonas };
  }
  const dl = r1(w0 - w);
  const zona: Zona | 'neutra' = dl <= 0 ? 'neutra' : dl <= 0.005 * w ? 'meta' : dl <= 0.01 * w ? 'atencao' : 'pouco';
  const delta = dl === 0 ? 'peso estável' : `${dl > 0 ? '−' : '+'}${Math.abs(dl)} kg`;
  const texto = `Esta semana: ${delta}. Meta de velocidade: até ${r1(0.005 * w)} kg/semana (0,5%); acima de ${r1(0.01 * w)} é rápido demais.`;
  return { id: 'peso', valor: w, unidade: 'kg', zona, texto, zonas };
}

/** As 9 medidas, na ordem do catálogo (`acoes.json` → `medidas`). */
export function medidas(ctx: Contexto): MedidaResultado[] {
  return [imc(ctx), whtr(ctx), panturrilha(ctx), preensao(ctx), fcRepouso(ctx), fcMax(ctx), rmr(ctx), agua(ctx), peso(ctx)];
}
```

- [ ] **Step 4: Rodar e ver passar**

```
cd app && pnpm vitest run src/dominio/medidas/index.test.ts
```
Saída esperada: `✓ src/dominio/medidas/index.test.ts (30 tests)`.

- [ ] **Step 5: Commit**

```
git add app/src/dominio/medidas/index.ts app/src/dominio/medidas/index.test.ts
git commit -m "feat: medidas (imc, whtr, panturrilha, preensao, fc, rmr, agua, peso)"
```

- [ ] **Step 6: Verificação final do plano**

```
cd app && pnpm lint && pnpm exec tsc --noEmit && pnpm vitest run
```
Saída esperada: lint limpo; `tsc` sem erros; todos os testes de `src/dominio` verdes (os do plano 01 continuam passando). Confirmar a regra de dependência: `grep -rn "from 'react'\|from 'dexie'\|/dados/\|/ui/" app/src/dominio` não retorna nada.

```
git status
```
Deve estar limpo (tudo commitado).

---

## Auto-revisão (feita ao escrever o plano)

1. **22 ações com task e código:** Movimento 7 (Task 3), Sono 4 (Task 4), Alimentação 8 (Task 5), Corpo 3 (Task 6) = 22; todas registradas em `METAS` (Task 7). **9 medidas** com código e teste (Task 8).
2. **Placeholders:** nenhum "TBD", "idem", "semelhante à Task N". Cada módulo e cada teste estão inteiros.
3. **Nomes e tipos vs contratos / plano 01:** usa `derivar(perfil, dias, eventos, semana, hoje)`, `pos(v, lo, hi)`, `horaParaMin`, `minParaHora`, `horasEntre`, `r1` de `derivados.ts`; `catalogo` de `catalogo/index.ts` (`acaoDoCatalogo` não é necessário aqui — `metasAplicaveis` itera `catalogo.acoes` diretamente); `CampoId` de `campos.ts`; `Zona`/`Contexto`/`Meta`/`AcaoMeta` idênticos ao contrato; `METAS`, `metasAplicaveis`, `acoesEmFoco`, `avisoSeguranca`, `MedidaId`, `MedidaResultado`, `medidas` com as assinaturas do contrato. Acréscimos (não renomeações): helpers em `metas/_util.ts`, fixtures em `metas/_fixtures.ts`, o tipo `AcaoComMeta` e o re-export de tipos em `metas/index.ts`.
4. **Pontos que dependem do plano 01** (se um teste falhar, olhar lá primeiro): com `dias = []` e `eventos = []`, `derivar()` precisa devolver `null` em `sonoHoras`, `jejumHoras`, `pesoMedioSemana`, `pesoMedioSemanaAnterior` e `fcRepousoMedia7d` (o teste de contrato da Task 7 exige `sem-dado` em todos os módulos com contexto vazio); `coposMeta` para H sem treino hoje = 8; `pos()` é a versão do contrato (lo → 0.5, hi → 0.75, clamp 0.02–0.98). Os testes que dependem de um derivado como entrada (`sonoHoras`, `jejumHoras`, `diasParado`, `coposMeta`, `pesoMedioSemana*`) fixam o valor por override em `ctxBase({ derivados })`, para não testar `derivar()` duas vezes.
5. **Desvios conscientes da PoC**, todos anotados no código: `seis-mil-passos` +500/semana (spec) em vez de +1000; `jante-cedo` e `ultimo-cafe` avançam 15 min por vez (spec) em vez de 30 min / "mover direto para o corte"; `emagreca-devagar` peso estável = `'pouco'` (texto do catálogo) em vez de `'atencao'`; `durma-7` lê o sono real (`derivados.sonoHoras`) em vez do horário habitual do perfil; próximos passos de proteína/fibra/água/doce/álcool são incrementais (+10 g, +5 g, +2 copos, −2, −1) em vez de "faltam N".
