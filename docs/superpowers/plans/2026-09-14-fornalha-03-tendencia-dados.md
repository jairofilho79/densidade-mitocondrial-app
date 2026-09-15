# Fornalha 03 — Tendência e dados: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar a única tendência da v1 (sono × fome × café, em `dominio/`) e toda a camada `dados/`: datas ISO, banco Dexie, repositórios por cadência, montagem do `Contexto`, export/import JSON com merge e detecção de IndexedDB indisponível.

**Architecture:** `src/dominio/tendencias/sonoFomeCafe.ts` é TypeScript puro (só importa `tipos`, `campos` e `derivados`) e devolve frases prontas para a UI. `src/dados/` é a única camada que conhece Dexie: `db.ts` declara o schema, `repositorios/*` encapsulam leitura/escrita por tabela, `contexto.ts` é a única ponte `dados/ → dominio/` (chama `derivar`), `exportImport.ts` valida tudo antes de gravar dentro de uma transação, e `disponibilidade.ts` responde se o IndexedDB abre. Testes de `dados/` rodam com `fake-indexeddb` em ambiente Node.

**Tech Stack:** TypeScript 5 (strict), Dexie 4, Vitest 3, fake-indexeddb, pnpm.

**Spec:** docs/superpowers/specs/2026-09-14-fornalha-app-design.md
**Contratos:** docs/superpowers/plans/2026-09-14-fornalha-00-contratos.md
**Depende de:** planos 01 e 02 concluídos

## Global Constraints

- `src/dominio/**` não importa de `src/dados`, `src/ui`, `src/app`, `react` nem `dexie` (a regra ESLint do plano 01 falha o lint se isso acontecer; os testes em `dominio/` também obedecem).
- Comparação sempre com a própria pessoa (ADR-005): nunca com tabela externa; toda frase mostra `n`; sem teste estatístico.
- `importar` nunca altera nada se o JSON for inválido: validar tudo antes de gravar, e gravar dentro de uma única `db.transaction('rw', ...)`.
- Textos ao usuário em português com acento; identificadores em português sem acento (`proteinaG`, `comiSemFome`).
- Nomes e assinaturas dos contratos (arquivo 00) são obrigatórios; este plano só acrescenta (`segundaDaSemana` em `datas.ts`), nunca renomeia.
- Gerenciador de pacotes: `pnpm`. Comandos rodam dentro de `app/`; `git` roda na raiz do repo.
- Commits pequenos, mensagem em português, prefixo `feat:`/`test:`/`chore:`/`fix:`.
- Convenção de registro do `Dia` (dos contratos): os campos do dia D descrevem o dia D, **exceto** `fome` e `comiSemFome` (descrevem o dia anterior, D−1, porque o check-in é de manhã) e `deitou`/`levantou` (descrevem a noite D−1→D). Consequência: "fome após a noite registrada em D" é a `fome` de D+1; "sono após o café registrado em D" é o sono registrado em D+1.
- Datas são strings `YYYY-MM-DD` comparáveis lexicograficamente; nunca use `new Date('YYYY-MM-DD')` com hora local (é interpretado como UTC e vira o dia errado em fuso negativo). Use `Date.UTC(...)` para aritmética.

---

### Task 1: Tendência sono × fome × café (`dominio/tendencias/sonoFomeCafe.ts`)

**Files:**
- Create: `app/src/dominio/tendencias/sonoFomeCafe.ts`
- Test: `app/src/dominio/tendencias/sonoFomeCafe.test.ts`

**Interfaces:**
- Consumes (plano 01):
  - `import type { Dia, Perfil, Hora, DataISO } from '@/dominio/tipos'`
  - `import type { CampoId } from '@/dominio/campos'`
  - `import { horasEntre, horaParaMin, minParaHora, mediana, media, r1 } from '@/dominio/derivados'` — `horasEntre(inicio: Hora, fim: Hora): number`, `horaParaMin(h: Hora): number`, `minParaHora(m: number): Hora`, `mediana(xs: number[]): number | null`, `media(xs: number[]): number | null`, `r1(n: number): number`.
- Produces (contratos):
  ```ts
  export type FraseTipo = 'sono-fome' | 'sono-comer-sem-fome' | 'cafe-sono';
  export interface Frase { tipo: FraseTipo; texto: string; n: number; nComparacao?: number; }
  export type Tendencia =
    | { pronta: false; faltam: number; precisaDe: CampoId[]; oQueVaiDizer: string }
    | { pronta: true; baseline: number; frases: Frase[] };
  export function sonoFomeCafe(dias: Dia[], perfil: Perfil): Tendencia;
  ```

**Regras (resumo do que o código implementa):**
- Check-in = dia com `deitou`, `levantou` e `fome` definidos. Sono do dia = `horasEntre(deitou, levantou) − 0.33`.
- Pronta se ≥ 7 check-ins **e** ≥ 5 deles com sono ≥ 7 h. Senão `faltam = max(7 − checkins, 5 − normais)`.
- Baseline = mediana da `fome` registrada no dia **seguinte** a cada noite normal (sono ≥ 7 h).
- `sono-fome`: noites com sono < 6 h → `fome` do dia seguinte; delta = média − baseline (1 casa, sinal ±, vírgula decimal). n < 3 → "Ainda poucas noites curtas para comparar (n = X)."
- `sono-comer-sem-fome`: proporção de `comiSemFome === true` no dia seguinte a noites curtas vs normais. Omitida se noites curtas com o dado < 3.
- `cafe-sono`: `'nao'` → omitida. `'diario'` → café (dia D) depois do corte (`horaParaMin(perfil.deitar) − 540`, normalizado para 0–1439) vs antes; sono da noite registrada em D+1; diferença em minutos. `'as-vezes'` → `ultimoCafe` string vs `null`. Omitida se qualquer lado < 3. Diferença ≤ 0 → "não dormiu menos".
- Ordem das frases: `sono-fome`, `sono-comer-sem-fome`, `cafe-sono`.

- [ ] **Step 1: Escrever o teste com o construtor de fixtures e os casos de "não pronta"**

Crie `app/src/dominio/tendencias/sonoFomeCafe.test.ts` com este conteúdo completo. O construtor `gerar` recebe a especificação de cada dia (noite `N` = 23:00→07:00 = 7,67 h; `C` = 01:00→06:00 = 4,67 h; `M` = 23:30→06:00 = 6,17 h) e devolve os dias **do mais recente para o mais antigo**, como o `Contexto` entrega — a função deve ordenar por conta própria.

```ts
import { describe, expect, it } from 'vitest';
import type { DataISO, Dia, Hora, Perfil } from '@/dominio/tipos';
import { sonoFomeCafe } from './sonoFomeCafe';

// ---------- fixtures ----------

type Noite = 'N' | 'C' | 'M'; // N = normal (7,67 h) · C = curta (4,67 h) · M = média (6,17 h: nem curta nem normal)
const HORAS: Record<Noite, [Hora, Hora]> = {
  N: ['23:00', '07:00'],
  C: ['01:00', '06:00'],
  M: ['23:30', '06:00'],
};

interface EspecDia {
  noite?: Noite;
  fome?: number;
  comiSemFome?: boolean;
  ultimoCafe?: Hora | null;
}

// Aritmética local de datas: testes de dominio/ não importam de dados/.
function diaSeguinte(d: DataISO): DataISO {
  const [ano, mes, dia] = d.split('-').map(Number);
  return new Date(Date.UTC(ano, mes - 1, dia + 1)).toISOString().slice(0, 10);
}

/** Gera dias consecutivos a partir de `inicio` e devolve MAIS RECENTE PRIMEIRO (como o Contexto). */
function gerar(inicio: DataISO, espec: EspecDia[]): Dia[] {
  const dias: Dia[] = [];
  let data = inicio;
  for (const e of espec) {
    const dia: Dia = { data, atualizadoEm: '2026-09-14T08:00:00.000Z' };
    if (e.noite) [dia.deitou, dia.levantou] = HORAS[e.noite];
    if (e.fome !== undefined) dia.fome = e.fome;
    if (e.comiSemFome !== undefined) dia.comiSemFome = e.comiSemFome;
    if ('ultimoCafe' in e) dia.ultimoCafe = e.ultimoCafe; // null é valor válido ("não tomou")
    dias.push(dia);
    data = diaSeguinte(data);
  }
  return dias.reverse();
}

function perfil(cafe: Perfil['cafe']): Perfil {
  return {
    peso: 80, altura: 175, idade: 40, sexo: 'H',
    levantar: '07:00', deitar: '23:00',
    cafe, alcool: 'nao', remedios: [], fuma: 'nao', examesQueTem: [],
    atualizadoEm: '2026-09-14T08:00:00.000Z',
  };
}

const PERFIS: Array<Perfil['cafe']> = ['nao', 'as-vezes', 'diario'];

// 7 dias: 5 normais, 2 curtas (índices 2 e 5). Fome após as curtas = fome dos índices 3 e 6.
const SETE: EspecDia[] = [
  { noite: 'N', fome: 5 }, { noite: 'N', fome: 5 }, { noite: 'C', fome: 5 }, { noite: 'N', fome: 8 },
  { noite: 'N', fome: 5 }, { noite: 'C', fome: 5 }, { noite: 'N', fome: 8 },
];

// 14 dias com café e "comi sem fome" registrados todos os dias.
const QUATORZE: EspecDia[] = [
  { noite: 'N', fome: 5, comiSemFome: false, ultimoCafe: null },
  { noite: 'N', fome: 5, comiSemFome: false, ultimoCafe: '16:00' },
  { noite: 'C', fome: 5, comiSemFome: false, ultimoCafe: null },
  { noite: 'N', fome: 7, comiSemFome: true, ultimoCafe: '17:00' },
  { noite: 'C', fome: 5, comiSemFome: false, ultimoCafe: null },
  { noite: 'M', fome: 7, comiSemFome: true, ultimoCafe: '16:00' },
  { noite: 'N', fome: 5, comiSemFome: false, ultimoCafe: null },
  { noite: 'C', fome: 5, comiSemFome: false, ultimoCafe: '15:00' },
  { noite: 'M', fome: 8, comiSemFome: true, ultimoCafe: null },
  { noite: 'N', fome: 5, comiSemFome: false, ultimoCafe: '16:00' },
  { noite: 'N', fome: 5, comiSemFome: true, ultimoCafe: null },
  { noite: 'C', fome: 5, comiSemFome: false, ultimoCafe: '16:00' },
  { noite: 'N', fome: 8, comiSemFome: false, ultimoCafe: null },
  { noite: 'N', fome: 5, comiSemFome: false, ultimoCafe: '16:00' },
];

/**
 * 28 dias. Café tarde (17:00) nos índices ímpares, café cedo (`cedo`) nos pares.
 * A noite registrada em i reflete o café de i−1: após café tarde a noite é M (6,17 h), após cedo é N (7,67 h).
 * Quatro noites curtas nos índices 5, 12, 19, 26; no dia seguinte a cada uma, fome 8 e comiSemFome true; nos demais fome 4.
 */
function vinteOito(cedo: Hora | null): EspecDia[] {
  const espec: EspecDia[] = [];
  for (let i = 0; i < 28; i++) {
    const cafeTarde = i % 2 === 1;
    const cafeOntemTarde = i > 0 && (i - 1) % 2 === 1;
    let noite: Noite = cafeOntemTarde ? 'M' : 'N';
    if ([5, 12, 19, 26].includes(i)) noite = 'C';
    const ontemCurta = i > 0 && espec[i - 1].noite === 'C';
    espec.push({
      noite,
      fome: noite === 'C' ? 5 : ontemCurta ? 8 : 4,
      comiSemFome: ontemCurta,
      ultimoCafe: cafeTarde ? '17:00' : cedo,
    });
  }
  return espec;
}

function frase(t: ReturnType<typeof sonoFomeCafe>, tipo: string) {
  if (!t.pronta) throw new Error('tendência não está pronta');
  return t.frases.find((f) => f.tipo === tipo);
}

// ---------- não pronta ----------

describe('sonoFomeCafe — pré-requisito', () => {
  it('com 6 check-ins e 3 normais não está pronta e faltam 2', () => {
    const dias = gerar('2026-08-01', [
      { noite: 'N', fome: 5 }, { noite: 'N', fome: 5 }, { noite: 'C', fome: 5 },
      { noite: 'C', fome: 8 }, { noite: 'C', fome: 5 }, { noite: 'N', fome: 5 },
    ]);
    const t = sonoFomeCafe(dias, perfil('diario'));
    expect(t.pronta).toBe(false);
    if (t.pronta) return;
    expect(t.faltam).toBe(2); // max(7 − 6, 5 − 3)
    expect(t.precisaDe).toEqual(['dia.deitou', 'dia.levantou', 'dia.fome']);
    expect(t.oQueVaiDizer).toContain('fome');
    expect(t.oQueVaiDizer).toContain('café');
  });

  it('com 7 check-ins mas só 4 normais não está pronta e falta 1', () => {
    const dias = gerar('2026-08-01', [
      { noite: 'N', fome: 5 }, { noite: 'N', fome: 5 }, { noite: 'M', fome: 5 }, { noite: 'N', fome: 8 },
      { noite: 'M', fome: 5 }, { noite: 'M', fome: 5 }, { noite: 'N', fome: 8 },
    ]);
    const t = sonoFomeCafe(dias, perfil('nao'));
    expect(t.pronta).toBe(false);
    if (t.pronta) return;
    expect(t.faltam).toBe(1);
    expect(t.oQueVaiDizer).not.toContain('café'); // perfil sem café não promete frase de café
  });

  it('dia sem fome não conta como check-in', () => {
    const dias = gerar('2026-08-01', [...SETE.slice(0, 6), { noite: 'N' }]);
    const t = sonoFomeCafe(dias, perfil('nao'));
    expect(t.pronta).toBe(false);
    if (t.pronta) return;
    expect(t.faltam).toBe(1);
  });

  it('dias vazios não estão prontos e faltam 7', () => {
    const t = sonoFomeCafe([], perfil('as-vezes'));
    expect(t).toMatchObject({ pronta: false, faltam: 7 });
  });
});
```

- [ ] **Step 2: Rodar e ver falhar (módulo não existe)**

Em `app/`:

```
pnpm vitest run src/dominio/tendencias/sonoFomeCafe.test.ts
```

Esperado: falha de import — `Failed to resolve import "./sonoFomeCafe"` (ou `Cannot find module`). Nenhum teste passa.

- [ ] **Step 3: Implementar o esqueleto com o pré-requisito**

Crie `app/src/dominio/tendencias/sonoFomeCafe.ts`:

```ts
import type { DataISO, Dia, Perfil } from '@/dominio/tipos';
import type { CampoId } from '@/dominio/campos';
import { horaParaMin, horasEntre, media, mediana, minParaHora, r1 } from '@/dominio/derivados';

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

function diaSeguinte(d: DataISO): DataISO {
  const [ano, mes, dia] = d.split('-').map(Number);
  return new Date(Date.UTC(ano, mes - 1, dia + 1)).toISOString().slice(0, 10);
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

  return { pronta: true, baseline: 0, frases: [] };
}
```

- [ ] **Step 4: Rodar e ver os 4 testes de pré-requisito passarem**

```
pnpm vitest run src/dominio/tendencias/sonoFomeCafe.test.ts
```

Esperado: `4 passed`.

- [ ] **Step 5: Acrescentar os testes de baseline e da frase sono-fome (incluindo o deslocamento D/D+1)**

Acrescente ao final de `sonoFomeCafe.test.ts`:

```ts
// ---------- pronta: sono → fome ----------

describe('sonoFomeCafe — sono → fome', () => {
  it.each(PERFIS)('7 dias, perfil %s: pronta, baseline 5, só "poucas noites curtas" (n = 2) e sem frase de café', (cafe) => {
    const t = sonoFomeCafe(gerar('2026-08-01', SETE), perfil(cafe));
    expect(t.pronta).toBe(true);
    if (!t.pronta) return;
    expect(t.baseline).toBe(5);
    expect(t.frases).toEqual([
      { tipo: 'sono-fome', texto: 'Ainda poucas noites curtas para comparar (n = 2).', n: 2 },
    ]);
  });

  it('usa a fome do dia SEGUINTE à noite curta (deslocamento D/D+1)', () => {
    // Noites curtas nos índices 2, 4, 6. No MESMO dia a fome é 3; no dia SEGUINTE é 9.
    // Com o deslocamento correto: média(9, 9, 9) − baseline. Baseline = mediana da fome
    // no dia seguinte às noites normais (índices 0, 1, 3, 5, 7 → fomes 5, 3, 3, 3, 5) = 3. Delta = +6,0.
    // Se a implementação usasse o mesmo dia, daria média(3, 3, 3) − mediana(5, 5, 9, 9, 9, 5) = −4,0.
    const dias = gerar('2026-08-01', [
      { noite: 'N', fome: 5 }, { noite: 'N', fome: 5 }, { noite: 'C', fome: 3 }, { noite: 'N', fome: 9 },
      { noite: 'C', fome: 3 }, { noite: 'N', fome: 9 }, { noite: 'C', fome: 3 }, { noite: 'N', fome: 9 },
      { noite: 'N', fome: 5 },
    ]);
    const t = sonoFomeCafe(dias, perfil('nao'));
    expect(t.pronta).toBe(true);
    if (!t.pronta) return;
    expect(t.baseline).toBe(3);
    expect(frase(t, 'sono-fome')).toEqual({
      tipo: 'sono-fome',
      texto: 'Nos dias após dormir menos de 6 h, sua fome ficou +6,0 acima do seu normal (n = 3).',
      n: 3,
    });
    expect(frase(t, 'sono-fome')?.texto).not.toContain('−4,0');
  });

  it('delta negativo usa sinal − e "abaixo"', () => {
    const dias = gerar('2026-08-01', [
      { noite: 'N', fome: 6 }, { noite: 'N', fome: 6 }, { noite: 'C', fome: 6 }, { noite: 'N', fome: 2 },
      { noite: 'C', fome: 6 }, { noite: 'N', fome: 2 }, { noite: 'C', fome: 6 }, { noite: 'N', fome: 2 },
      { noite: 'N', fome: 6 },
    ]);
    const t = sonoFomeCafe(dias, perfil('nao'));
    expect(t.pronta).toBe(true);
    if (!t.pronta) return;
    expect(t.baseline).toBe(6);
    expect(frase(t, 'sono-fome')?.texto).toBe(
      'Nos dias após dormir menos de 6 h, sua fome ficou −4,0 abaixo do seu normal (n = 3).',
    );
  });

  it('14 dias: delta +2,5 com n = 4', () => {
    const t = sonoFomeCafe(gerar('2026-08-01', QUATORZE), perfil('nao'));
    expect(t.pronta).toBe(true);
    if (!t.pronta) return;
    expect(t.baseline).toBe(5);
    expect(frase(t, 'sono-fome')).toEqual({
      tipo: 'sono-fome',
      texto: 'Nos dias após dormir menos de 6 h, sua fome ficou +2,5 acima do seu normal (n = 4).',
      n: 4,
    });
  });
});
```

- [ ] **Step 6: Rodar e ver os novos testes falharem**

```
pnpm vitest run src/dominio/tendencias/sonoFomeCafe.test.ts
```

Esperado: os 3 `it.each` de 7 dias e os 3 seguintes falham (`baseline` é 0 e `frases` é `[]`); os 4 de pré-requisito continuam passando.

- [ ] **Step 7: Implementar baseline e a frase sono-fome**

Em `sonoFomeCafe.ts`, substitua a linha `return { pronta: true, baseline: 0, frases: [] };` por:

```ts
  const curtas = checkins.filter((n) => n.sono < SONO_CURTO_H);

  const baseline = mediana(fomeSeguinte(normais));
  if (baseline === null) {
    // Há noites normais, mas nenhuma tem o dia seguinte registrado com fome: falta 1 check-in.
    return { pronta: false, faltam: 1, precisaDe: PRECISA_DE, oQueVaiDizer: oQueVaiDizer(perfil) };
  }

  const frases: Frase[] = [fraseSonoFome(curtas, baseline)];

  return { pronta: true, baseline, frases };
```

E acrescente, antes de `export function sonoFomeCafe`, as funções auxiliares:

```ts
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
```

- [ ] **Step 8: Rodar e ver passar**

```
pnpm vitest run src/dominio/tendencias/sonoFomeCafe.test.ts
```

Esperado: `10 passed`.

- [ ] **Step 9: Acrescentar os testes de "comer sem fome" e de café (três perfis, 14 e 28 dias)**

Acrescente ao final de `sonoFomeCafe.test.ts`:

```ts
// ---------- pronta: sono → comer sem fome ----------

describe('sonoFomeCafe — sono → comer sem fome', () => {
  it('14 dias: 3 de 4 noites curtas vs 1 de 7 normais', () => {
    const t = sonoFomeCafe(gerar('2026-08-01', QUATORZE), perfil('nao'));
    expect(frase(t, 'sono-comer-sem-fome')).toEqual({
      tipo: 'sono-comer-sem-fome',
      texto: 'Comeu sem fome em 3 de 4 noites curtas vs 1 de 7 normais.',
      n: 4,
      nComparacao: 7,
    });
  });

  it('é omitida quando há menos de 3 noites curtas com o dado', () => {
    const espec = SETE.map((e) => ({ ...e, comiSemFome: true }));
    const t = sonoFomeCafe(gerar('2026-08-01', espec), perfil('nao'));
    expect(frase(t, 'sono-comer-sem-fome')).toBeUndefined();
  });

  it('28 dias: 4 de 4 noites curtas vs 0 de 12 normais', () => {
    const t = sonoFomeCafe(gerar('2026-08-01', vinteOito('13:00')), perfil('nao'));
    expect(frase(t, 'sono-comer-sem-fome')?.texto).toBe('Comeu sem fome em 4 de 4 noites curtas vs 0 de 12 normais.');
  });
});

// ---------- pronta: café → sono ----------

describe('sonoFomeCafe — café → sono', () => {
  it.each([7, 14, 28] as const)('perfil "nao" nunca tem frase de café (%s dias)', (n) => {
    const espec = n === 7 ? SETE : n === 14 ? QUATORZE : vinteOito('13:00');
    const t = sonoFomeCafe(gerar('2026-08-01', espec), perfil('nao'));
    expect(t.pronta).toBe(true);
    expect(frase(t, 'cafe-sono')).toBeUndefined();
  });

  it('as-vezes, 14 dias: 11 min a menos (n = 6 com, 7 sem) — sono da noite registrada no dia seguinte ao café', () => {
    const t = sonoFomeCafe(gerar('2026-08-01', QUATORZE), perfil('as-vezes'));
    expect(frase(t, 'cafe-sono')).toEqual({
      tipo: 'cafe-sono',
      texto: 'Nas noites após café, dormiu 11 min a menos (n = 6 com, 7 sem).',
      n: 6,
      nComparacao: 7,
    });
  });

  it('diario, 14 dias: omitida porque todos os cafés são depois do corte (lado "antes" < 3)', () => {
    const t = sonoFomeCafe(gerar('2026-08-01', QUATORZE), perfil('diario'));
    expect(t.pronta).toBe(true);
    if (!t.pronta) return;
    expect(t.frases.map((f) => f.tipo)).toEqual(['sono-fome', 'sono-comer-sem-fome']);
  });

  it('diario, 28 dias: corte = deitar 23:00 − 9 h = 14:00; 78 min a menos (n = 13 vs 14)', () => {
    const t = sonoFomeCafe(gerar('2026-08-01', vinteOito('13:00')), perfil('diario'));
    expect(t.pronta).toBe(true);
    if (!t.pronta) return;
    expect(t.frases.map((f) => f.tipo)).toEqual(['sono-fome', 'sono-comer-sem-fome', 'cafe-sono']);
    expect(frase(t, 'cafe-sono')).toEqual({
      tipo: 'cafe-sono',
      texto: 'Nos dias com café depois das 14:00, dormiu 78 min a menos (n = 13 vs 14).',
      n: 13,
      nComparacao: 14,
    });
  });

  it('as-vezes, 28 dias com null nos dias sem café: 78 min a menos (n = 13 com, 14 sem)', () => {
    const t = sonoFomeCafe(gerar('2026-08-01', vinteOito(null)), perfil('as-vezes'));
    expect(frase(t, 'cafe-sono')?.texto).toBe('Nas noites após café, dormiu 78 min a menos (n = 13 com, 14 sem).');
  });

  it('as-vezes, 28 dias sem nenhum null: omitida (lado "sem" < 3)', () => {
    const t = sonoFomeCafe(gerar('2026-08-01', vinteOito('13:00')), perfil('as-vezes'));
    expect(frase(t, 'cafe-sono')).toBeUndefined();
  });

  it('diario: diferença ≤ 0 diz "não dormiu menos"', () => {
    // Café tarde nos ímpares → noite seguinte N (7,67 h); café cedo nos pares → noite seguinte M (6,17 h).
    const espec: EspecDia[] = [];
    for (let i = 0; i < 10; i++) {
      const ontemTarde = i > 0 && (i - 1) % 2 === 1;
      espec.push({ noite: i === 0 || ontemTarde ? 'N' : 'M', fome: 5, ultimoCafe: i % 2 === 1 ? '17:00' : '13:00' });
    }
    const t = sonoFomeCafe(gerar('2026-08-01', espec), perfil('diario'));
    expect(frase(t, 'cafe-sono')).toEqual({
      tipo: 'cafe-sono',
      texto: 'Nos dias com café depois das 14:00, não dormiu menos (n = 4 vs 5).',
      n: 4,
      nComparacao: 5,
    });
    // com o mesmo padrão, o perfil as-vezes (café cedo vira null) também diz "não dormiu menos"
    const t2 = sonoFomeCafe(
      gerar('2026-08-01', espec.map((e) => ({ ...e, ultimoCafe: e.ultimoCafe === '13:00' ? null : e.ultimoCafe }))),
      perfil('as-vezes'),
    );
    expect(frase(t2, 'cafe-sono')?.texto).toBe('Nas noites após café, não dormiu menos (n = 4 com, 5 sem).');
  });

  it('diario: corte normaliza quando deitar − 9 h passa da meia-noite (deitar 00:30 → 15:30)', () => {
    const p = { ...perfil('diario'), deitar: '00:30' };
    const espec = vinteOito('13:00').map((e) => ({ ...e, ultimoCafe: e.ultimoCafe === '17:00' ? '16:00' : '15:00' }));
    const t = sonoFomeCafe(gerar('2026-08-01', espec), p);
    expect(frase(t, 'cafe-sono')?.texto).toContain('depois das 15:30');
  });
});
```

- [ ] **Step 10: Rodar e ver os novos testes falharem**

```
pnpm vitest run src/dominio/tendencias/sonoFomeCafe.test.ts
```

Esperado: os testes de "comer sem fome" (exceto o de omissão) e os de café com frase esperada falham com `undefined` em vez da frase; os de pré-requisito e sono-fome continuam passando.

- [ ] **Step 11: Implementar as frases de "comer sem fome" e café**

Em `sonoFomeCafe.ts`, substitua `const frases: Frase[] = [fraseSonoFome(curtas, baseline)];` por:

```ts
  const frases: Frase[] = [fraseSonoFome(curtas, baseline)];
  const comerSemFome = fraseComerSemFome(curtas, normais);
  if (comerSemFome) frases.push(comerSemFome);
  const cafe = fraseCafeSono(ordenados, porData, perfil);
  if (cafe) frases.push(cafe);
```

E acrescente, antes de `export function sonoFomeCafe`:

```ts
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
```

- [ ] **Step 12: Rodar tudo e ver passar; rodar o lint**

```
pnpm vitest run src/dominio/tendencias/sonoFomeCafe.test.ts
pnpm lint
```

Esperado: `23 passed`; lint sem erros (em especial, nenhuma violação de `no-restricted-paths` — o módulo só importa de `@/dominio/*`).

- [ ] **Step 13: Commit**

Na raiz do repo:

```
git add app/src/dominio/tendencias/sonoFomeCafe.ts app/src/dominio/tendencias/sonoFomeCafe.test.ts
git commit -m "feat: tendência sono × fome × café com fixtures de 7, 14 e 28 dias"
```

---

### Task 2: Datas ISO (`dados/datas.ts`)

**Files:**
- Create: `app/src/dados/datas.ts`
- Test: `app/src/dados/datas.test.ts`

**Interfaces:**
- Consumes: `import type { DataISO, MesISO, SemanaISO } from '@/dominio/tipos'`
- Produces (contratos + uma adição):
  ```ts
  export function hojeISO(agora?: Date): DataISO;          // data LOCAL do aparelho
  export function semanaISO(d: DataISO): SemanaISO;        // ISO 8601, segunda inicia, "YYYY-Www"
  export function mesISO(d: DataISO): MesISO;              // "YYYY-MM"
  export function ontem(d: DataISO): DataISO;
  export function somarDias(d: DataISO, n: number): DataISO;  // reexportado de @/dominio/derivados (mesma função)
  export function segundaDaSemana(s: SemanaISO): DataISO;  // ADIÇÃO deste plano; usada por preencherSemana
  ```

- [ ] **Step 1: Escrever o teste**

Crie `app/src/dados/datas.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { hojeISO, mesISO, ontem, segundaDaSemana, semanaISO, somarDias } from './datas';
import { semanaISO as semanaISODominio } from '@/dominio/metas/_util';

describe('hojeISO', () => {
  it('usa a data local, não UTC', () => {
    expect(hojeISO(new Date(2026, 8, 14, 23, 30))).toBe('2026-09-14');
    expect(hojeISO(new Date(2026, 0, 1, 0, 5))).toBe('2026-01-01');
  });
});

describe('somarDias / ontem', () => {
  it('atravessa mês, ano e fevereiro bissexto', () => {
    expect(somarDias('2026-03-01', -1)).toBe('2026-02-28');
    expect(somarDias('2024-02-28', 1)).toBe('2024-02-29');
    expect(somarDias('2026-12-31', 1)).toBe('2027-01-01');
    expect(somarDias('2026-09-14', -27)).toBe('2026-08-18');
    expect(somarDias('2026-09-14', 0)).toBe('2026-09-14');
    expect(ontem('2026-01-01')).toBe('2025-12-31');
  });
});

describe('mesISO', () => {
  it('recorta ano e mês', () => {
    expect(mesISO('2026-09-14')).toBe('2026-09');
  });
});

describe('semanaISO (ISO 8601, segunda como início)', () => {
  it('semana comum: segunda a domingo', () => {
    expect(semanaISO('2026-09-14')).toBe('2026-W38'); // segunda
    expect(semanaISO('2026-09-20')).toBe('2026-W38'); // domingo
    expect(semanaISO('2026-09-13')).toBe('2026-W37'); // domingo anterior
    expect(semanaISO('2026-09-21')).toBe('2026-W39');
  });

  it('virada de ano: 2026 tem 53 semanas (1º de janeiro foi quinta)', () => {
    expect(semanaISO('2026-12-31')).toBe('2026-W53'); // quinta
    expect(semanaISO('2027-01-01')).toBe('2026-W53'); // sexta, ainda na W53 de 2026
    expect(semanaISO('2027-01-03')).toBe('2026-W53'); // domingo
    expect(semanaISO('2027-01-04')).toBe('2027-W01'); // segunda
  });

  it('início de ano que pertence à W01 do ano seguinte', () => {
    expect(semanaISO('2025-12-29')).toBe('2026-W01'); // segunda
    expect(semanaISO('2026-01-01')).toBe('2026-W01');
    expect(semanaISO('2025-12-28')).toBe('2025-W52'); // domingo
    expect(semanaISO('2024-12-30')).toBe('2025-W01');
    expect(semanaISO('2021-01-03')).toBe('2020-W53');
  });
});

describe('concordância com o domínio (plano 02 tem cópia própria de semanaISO em metas/_util.ts; somarDias já é o mesmo reexport)', () => {
  it('semanaISO do domínio dá o mesmo resultado nas datas de borda', () => {
    for (const d of ['2026-09-14', '2026-09-20', '2026-12-31', '2027-01-01', '2027-01-04', '2025-12-29', '2025-12-28', '2024-12-30', '2021-01-03']) {
      expect(semanaISODominio(d)).toBe(semanaISO(d));
    }
  });
});

describe('segundaDaSemana', () => {
  it('é a inversa de semanaISO para a segunda-feira', () => {
    expect(segundaDaSemana('2026-W38')).toBe('2026-09-14');
    expect(segundaDaSemana('2026-W53')).toBe('2026-12-28');
    expect(segundaDaSemana('2027-W01')).toBe('2027-01-04');
    expect(segundaDaSemana('2026-W01')).toBe('2025-12-29');
    expect(segundaDaSemana('2025-W01')).toBe('2024-12-30');
    for (const d of ['2026-09-14', '2026-12-31', '2027-01-01', '2025-12-29']) {
      const segunda = segundaDaSemana(semanaISO(d));
      expect(semanaISO(segunda)).toBe(semanaISO(d));
      expect(segunda <= d).toBe(true);
      expect(somarDias(segunda, 6) >= d).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

```
pnpm vitest run src/dados/datas.test.ts
```

Esperado: falha de import (`Failed to resolve import "./datas"`).

- [ ] **Step 3: Implementar**

Crie `app/src/dados/datas.ts`:

```ts
import { somarDias } from '@/dominio/derivados';
import type { DataISO, MesISO, SemanaISO } from '@/dominio/tipos';

export { somarDias } from '@/dominio/derivados';

const DIA_MS = 86_400_000;

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** "YYYY-MM-DD" → timestamp UTC da meia-noite desse dia. Nunca use `new Date(string)` aqui: viraria o dia em fuso negativo. */
function utcDe(d: DataISO): number {
  const [ano, mes, dia] = d.split('-').map(Number);
  return Date.UTC(ano, mes - 1, dia);
}

function isoDe(utcMs: number): DataISO {
  return new Date(utcMs).toISOString().slice(0, 10);
}

/** Data local do aparelho (o dia que a pessoa vive), não UTC. */
export function hojeISO(agora: Date = new Date()): DataISO {
  return `${agora.getFullYear()}-${pad2(agora.getMonth() + 1)}-${pad2(agora.getDate())}`;
}

export function ontem(d: DataISO): DataISO {
  return somarDias(d, -1);
}

export function mesISO(d: DataISO): MesISO {
  return d.slice(0, 7);
}

/** Segunda-feira da semana 1 do ano ISO `ano`: a semana que contém 4 de janeiro. */
function segundaDaSemana1(ano: number): number {
  const jan4 = Date.UTC(ano, 0, 4);
  const diaDaSemana = (new Date(jan4).getUTCDay() + 6) % 7; // segunda = 0 … domingo = 6
  return jan4 - diaDaSemana * DIA_MS;
}

/** ISO 8601: a semana começa na segunda; o ano ISO é o ano da quinta-feira daquela semana. */
export function semanaISO(d: DataISO): SemanaISO {
  const t = utcDe(d);
  const diaDaSemana = (new Date(t).getUTCDay() + 6) % 7;
  const quinta = t - diaDaSemana * DIA_MS + 3 * DIA_MS;
  const anoISO = new Date(quinta).getUTCFullYear();
  const semana = Math.round((quinta - segundaDaSemana1(anoISO)) / (7 * DIA_MS)) + 1;
  return `${anoISO}-W${pad2(semana)}`;
}

export function segundaDaSemana(s: SemanaISO): DataISO {
  const [ano, semana] = s.split('-W').map(Number);
  return isoDe(segundaDaSemana1(ano) + (semana - 1) * 7 * DIA_MS);
}
```

- [ ] **Step 4: Rodar e ver passar**

```
pnpm vitest run src/dados/datas.test.ts
```

Esperado: `8 passed` (se o teste de concordância falhar, corrija `semanaISO` em `app/src/dominio/metas/_util.ts` — o domínio é a fonte; não ajuste o teste).

- [ ] **Step 5: Commit**

```
git add app/src/dados/datas.ts app/src/dados/datas.test.ts
git commit -m "feat: utilitários de data ISO (hoje, semana ISO 8601, mês, somar dias)"
```

---

### Task 3: Banco Dexie (`dados/db.ts`) + setup de teste com fake-indexeddb

**Files:**
- Create: `app/src/dados/db.ts`
- Create: `app/src/dados/testes/banco.ts` (helpers de teste: limpar banco e um perfil pronto)
- Modify: `app/vitest.setup.ts` (acrescentar `import 'fake-indexeddb/auto'`)
- Test: `app/src/dados/db.test.ts`

**Interfaces:**
- Consumes: `Dexie`, `Table` de `dexie`; tipos de `@/dominio/tipos`.
- Produces (contratos):
  ```ts
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
  ```
  Helpers de teste (adição): `limparBanco(): Promise<void>`, `PERFIL_TESTE: Omit<Perfil, 'atualizadoEm'>`.

**Sobre o ambiente de teste:** os testes de `dados/` não precisam de DOM. Cada arquivo de teste desta camada começa com o comentário `// @vitest-environment node`, que faz o Vitest rodar aquele arquivo em Node (mais rápido, e `crypto.randomUUID()` é garantido). `fake-indexeddb/auto` instala `indexedDB` no `globalThis` em qualquer ambiente.

- [ ] **Step 1: Garantir a dependência e o setup**

Em `app/`:

```
pnpm add -D fake-indexeddb
```

(Se `pnpm ls fake-indexeddb` já mostrar a versão, nada muda.) Abra `app/vitest.setup.ts` (criado pelo plano 01, referenciado em `setupFiles` de `app/vitest.config.ts`) e acrescente como **primeira linha**:

```ts
import 'fake-indexeddb/auto';
```

Se por algum motivo `app/vitest.setup.ts` não existir, crie-o só com essa linha e confira que `app/vitest.config.ts` tem `test.setupFiles: ['./vitest.setup.ts']`.

- [ ] **Step 2: Escrever o teste do banco**

Crie `app/src/dados/db.test.ts`:

```ts
// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { db } from './db';

describe('FornalhaDB', () => {
  it('abre e tem as 7 tabelas com as chaves dos contratos', async () => {
    await db.open();
    expect(db.isOpen()).toBe(true);
    expect(db.verno).toBe(1);
    const tabelas = db.tables.map((t) => t.name).sort();
    expect(tabelas).toEqual(['dia', 'eventoRefeicao', 'eventoTreino', 'exame', 'mes', 'perfil', 'semana']);
    expect(db.perfil.schema.primKey.keyPath).toBe('id');
    expect(db.dia.schema.primKey.keyPath).toBe('data');
    expect(db.eventoTreino.schema.primKey.keyPath).toBe('id');
    expect(db.eventoTreino.schema.indexes.map((i) => i.keyPath)).toEqual(['data']);
    expect(db.eventoRefeicao.schema.indexes.map((i) => i.keyPath)).toEqual(['data']);
    expect(db.semana.schema.primKey.keyPath).toBe('semana');
    expect(db.mes.schema.primKey.keyPath).toBe('mes');
    expect(db.exame.schema.primKey.keyPath).toBe('data');
  });

  it('grava e lê um dia', async () => {
    await db.dia.put({ data: '2026-09-14', passos: 6000, atualizadoEm: '2026-09-14T08:00:00.000Z' });
    const dia = await db.dia.get('2026-09-14');
    expect(dia?.passos).toBe(6000);
  });
});
```

- [ ] **Step 3: Rodar e ver falhar**

```
pnpm vitest run src/dados/db.test.ts
```

Esperado: falha de import (`Failed to resolve import "./db"`).

- [ ] **Step 4: Implementar `db.ts` e os helpers de teste**

Crie `app/src/dados/db.ts`:

```ts
import Dexie, { type Table } from 'dexie';
import type { DataISO, Dia, EventoRefeicao, EventoTreino, Exame, Mes, MesISO, Perfil, Semana, SemanaISO } from '@/dominio/tipos';

/**
 * Uma tabela por cadência, chaves naturais (data, semana ISO, mês) onde existem.
 * Índices secundários só em `data` dos eventos (consulta por janela de dias).
 * Migrações futuras: acrescente `this.version(2).stores({...}).upgrade(...)` ABAIXO da version(1), nunca edite a 1.
 */
export class FornalhaDB extends Dexie {
  perfil!: Table<Perfil & { id: 'me' }, 'me'>;
  dia!: Table<Dia, DataISO>;
  eventoTreino!: Table<EventoTreino, string>;
  eventoRefeicao!: Table<EventoRefeicao, string>;
  semana!: Table<Semana, SemanaISO>;
  mes!: Table<Mes, MesISO>;
  exame!: Table<Exame, DataISO>;

  constructor() {
    super('fornalha');
    this.version(1).stores({
      perfil: 'id',
      dia: 'data',
      eventoTreino: 'id, data',
      eventoRefeicao: 'id, data',
      semana: 'semana',
      mes: 'mes',
      exame: 'data',
    });
  }
}

export const db = new FornalhaDB();
```

Crie `app/src/dados/testes/banco.ts`:

```ts
import type { Perfil } from '@/dominio/tipos';
import { db } from '@/dados/db';

/** Apaga e reabre o banco. Use em `beforeEach` de todo teste de dados/. */
export async function limparBanco(): Promise<void> {
  await db.delete();
  await db.open();
}

export const PERFIL_TESTE: Omit<Perfil, 'atualizadoEm'> = {
  peso: 80,
  altura: 175,
  idade: 40,
  sexo: 'H',
  levantar: '07:00',
  deitar: '23:00',
  cafe: 'diario',
  alcool: 'as-vezes',
  remedios: [],
  fuma: 'nao',
  examesQueTem: [],
};
```

- [ ] **Step 5: Rodar e ver passar**

```
pnpm vitest run src/dados/db.test.ts
```

Esperado: `2 passed`. Se aparecer `ReferenceError: indexedDB is not defined`, o import de `fake-indexeddb/auto` não está no `vitest.setup.ts` ou o `setupFiles` não aponta para ele.

- [ ] **Step 6: Commit**

```
git add app/package.json app/pnpm-lock.yaml app/vitest.setup.ts app/src/dados/db.ts app/src/dados/db.test.ts app/src/dados/testes/banco.ts
git commit -m "feat: banco Dexie version(1) com as 7 tabelas e setup de fake-indexeddb"
```

---

### Task 4: Repositórios (`dados/repositorios/{perfil,dia,eventos,semana,mes,exame}.ts`)

**Files:**
- Create: `app/src/dados/repositorios/perfil.ts`
- Create: `app/src/dados/repositorios/dia.ts`
- Create: `app/src/dados/repositorios/eventos.ts`
- Create: `app/src/dados/repositorios/semana.ts`
- Create: `app/src/dados/repositorios/mes.ts`
- Create: `app/src/dados/repositorios/exame.ts`
- Test: `app/src/dados/repositorios/perfilDia.test.ts`
- Test: `app/src/dados/repositorios/eventos.test.ts`
- Test: `app/src/dados/repositorios/semanaMesExame.test.ts`

**Interfaces:**
- Consumes: `db` (Task 3), `somarDias`, `segundaDaSemana` (Task 2), `mediana` de `@/dominio/derivados`, tipos de `@/dominio/tipos`.
- Produces (contratos, assinaturas exatas):
  ```ts
  // perfil.ts
  export function lerPerfil(): Promise<Perfil | undefined>;
  export function salvarPerfil(p: Omit<Perfil, 'atualizadoEm'>): Promise<Perfil>;
  // dia.ts
  export function lerDia(data: DataISO): Promise<Dia | undefined>;
  export function salvarDia(data: DataISO, parcial: Partial<Omit<Dia, 'data' | 'atualizadoEm'>>): Promise<Dia>;
  export function diasRecentes(ate: DataISO, n: number): Promise<Dia[]>;
  // eventos.ts
  export function registrarTreino(e: Omit<EventoTreino, 'id' | 'atualizadoEm'>): Promise<EventoTreino>;
  export function registrarRefeicao(e: Omit<EventoRefeicao, 'id' | 'atualizadoEm'>): Promise<EventoRefeicao>;
  export function treinosEntre(de: DataISO, ate: DataISO): Promise<EventoTreino[]>;
  export function refeicoesEntre(de: DataISO, ate: DataISO): Promise<EventoRefeicao[]>;
  // semana.ts
  export function lerSemana(s: SemanaISO): Promise<Semana | undefined>;
  export function salvarSemana(s: SemanaISO, parcial: Partial<Omit<Semana, 'semana' | 'atualizadoEm'>>): Promise<Semana>;
  export function semanaMaisRecente(): Promise<Semana | undefined>;
  export function preencherSemana(s: SemanaISO): Promise<Partial<Semana>>;
  // mes.ts
  export function lerMes(m: MesISO): Promise<Mes | undefined>;
  export function salvarMes(m: MesISO, parcial: Partial<Omit<Mes, 'mes' | 'atualizadoEm'>>): Promise<Mes>;
  export function mesMaisRecente(): Promise<Mes | undefined>;
  // exame.ts
  export function listarExames(): Promise<Exame[]>;
  export function salvarExame(e: Omit<Exame, 'atualizadoEm'>): Promise<Exame>;
  export function ultimoExame(): Promise<Exame | undefined>;
  ```

**Decisões fixas:**
- Todo `salvar*` faz merge com a linha existente (`{ ...atual, ...parcial }`) e grava `atualizadoEm = new Date().toISOString()`.
- Listas por janela usam o índice `data` com `between(de, ate, true, true)` (inclusivo nas duas pontas) e são ordenadas em JS: dias e eventos **mais recente primeiro** (eventos: `data` desc, depois `hora` desc).
- `semanaMaisRecente`/`mesMaisRecente`/`ultimoExame` usam `orderBy(chave).last()`: as chaves `YYYY-Www`, `YYYY-MM` e `YYYY-MM-DD` ordenam cronologicamente como texto.
- `preencherSemana` **não grava**. Retorna sempre `sessoesTiros`, `sessoesForca`, `minAtiv` (0 quando não há eventos); `alcoolDoses` e `docesSemana` só quando pelo menos um dia da semana tem o campo (número, não `null`); `maiorBlocoTipico` só quando há algum `dia.maiorBloco`.

- [ ] **Step 1: Testes de perfil e dia**

Crie `app/src/dados/repositorios/perfilDia.test.ts`:

```ts
// @vitest-environment node
import { beforeEach, describe, expect, it } from 'vitest';
import { limparBanco, PERFIL_TESTE } from '@/dados/testes/banco';
import { lerPerfil, salvarPerfil } from './perfil';
import { diasRecentes, lerDia, salvarDia } from './dia';

beforeEach(limparBanco);

describe('perfil', () => {
  it('sem perfil retorna undefined', async () => {
    expect(await lerPerfil()).toBeUndefined();
  });

  it('salva com atualizadoEm e lê de volta sem o id interno', async () => {
    const salvo = await salvarPerfil(PERFIL_TESTE);
    expect(salvo.atualizadoEm).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    const lido = await lerPerfil();
    expect(lido).toEqual(salvo);
    expect(lido).not.toHaveProperty('id');
  });

  it('salvar de novo substitui (chave fixa "me")', async () => {
    await salvarPerfil(PERFIL_TESTE);
    await salvarPerfil({ ...PERFIL_TESTE, peso: 78 });
    expect((await lerPerfil())?.peso).toBe(78);
  });
});

describe('dia', () => {
  it('lerDia de data sem registro retorna undefined', async () => {
    expect(await lerDia('2026-09-14')).toBeUndefined();
  });

  it('salvarDia cria, faz merge e atualiza atualizadoEm', async () => {
    const primeiro = await salvarDia('2026-09-14', { passos: 5000, fome: 4 });
    expect(primeiro).toMatchObject({ data: '2026-09-14', passos: 5000, fome: 4 });
    expect(primeiro.atualizadoEm).toMatch(/^\d{4}-\d{2}-\d{2}T/);

    await new Promise((r) => setTimeout(r, 5));
    const segundo = await salvarDia('2026-09-14', { copos: 6, fome: 7 });
    expect(segundo).toMatchObject({ data: '2026-09-14', passos: 5000, fome: 7, copos: 6 });
    expect(segundo.atualizadoEm > primeiro.atualizadoEm).toBe(true);
    expect(await lerDia('2026-09-14')).toEqual(segundo);
  });

  it('salvarDia aceita null como "não se aplica hoje"', async () => {
    await salvarDia('2026-09-14', { ultimoCafe: null, alcoolDoses: null });
    const dia = await lerDia('2026-09-14');
    expect(dia?.ultimoCafe).toBeNull();
    expect(dia?.alcoolDoses).toBeNull();
  });

  it('diasRecentes devolve a janela [ate − (n−1), ate], mais recente primeiro, só dias existentes', async () => {
    for (const data of ['2026-09-10', '2026-09-12', '2026-09-14', '2026-09-15', '2026-09-07']) {
      await salvarDia(data, { passos: 1 });
    }
    const dias = await diasRecentes('2026-09-14', 7); // 2026-09-08 … 2026-09-14
    expect(dias.map((d) => d.data)).toEqual(['2026-09-14', '2026-09-12', '2026-09-10']);
  });

  it('diasRecentes com n = 1 devolve só o próprio dia', async () => {
    await salvarDia('2026-09-13', { passos: 1 });
    await salvarDia('2026-09-14', { passos: 2 });
    expect((await diasRecentes('2026-09-14', 1)).map((d) => d.data)).toEqual(['2026-09-14']);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

```
pnpm vitest run src/dados/repositorios/perfilDia.test.ts
```

Esperado: falha de import (`./perfil` / `./dia` não existem).

- [ ] **Step 3: Implementar `perfil.ts` e `dia.ts`**

Crie `app/src/dados/repositorios/perfil.ts`:

```ts
import type { Perfil } from '@/dominio/tipos';
import { db } from '@/dados/db';

const CHAVE = 'me' as const;

export async function lerPerfil(): Promise<Perfil | undefined> {
  const linha = await db.perfil.get(CHAVE);
  if (!linha) return undefined;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- separa o id interno da tabela
  const { id, ...perfil } = linha;
  return perfil;
}

export async function salvarPerfil(p: Omit<Perfil, 'atualizadoEm'>): Promise<Perfil> {
  const perfil: Perfil = { ...p, atualizadoEm: new Date().toISOString() };
  await db.perfil.put({ ...perfil, id: CHAVE });
  return perfil;
}
```

Crie `app/src/dados/repositorios/dia.ts`:

```ts
import type { DataISO, Dia } from '@/dominio/tipos';
import { db } from '@/dados/db';
import { somarDias } from '@/dados/datas';

export function lerDia(data: DataISO): Promise<Dia | undefined> {
  return db.dia.get(data);
}

/** Merge com o registro existente; `undefined` num campo do parcial apaga o campo (volta a "não registrou"). */
export function salvarDia(data: DataISO, parcial: Partial<Omit<Dia, 'data' | 'atualizadoEm'>>): Promise<Dia> {
  return db.transaction('rw', db.dia, async () => {
    const atual = await db.dia.get(data);
    const novo: Dia = { ...atual, ...parcial, data, atualizadoEm: new Date().toISOString() };
    await db.dia.put(novo);
    return novo;
  });
}

/** Os dias registrados na janela [ate − (n − 1), ate], mais recente primeiro. Dias sem registro não aparecem. */
export async function diasRecentes(ate: DataISO, n: number): Promise<Dia[]> {
  const de = somarDias(ate, -(n - 1));
  const dias = await db.dia.where('data').between(de, ate, true, true).toArray();
  return dias.sort((a, b) => (a.data < b.data ? 1 : -1));
}
```

- [ ] **Step 4: Rodar e ver passar**

```
pnpm vitest run src/dados/repositorios/perfilDia.test.ts
```

Esperado: `8 passed`.

- [ ] **Step 5: Commit**

```
git add app/src/dados/repositorios/perfil.ts app/src/dados/repositorios/dia.ts app/src/dados/repositorios/perfilDia.test.ts
git commit -m "feat: repositórios de perfil e dia com merge e janela de dias recentes"
```

- [ ] **Step 6: Testes de eventos**

Crie `app/src/dados/repositorios/eventos.test.ts`:

```ts
// @vitest-environment node
import { beforeEach, describe, expect, it } from 'vitest';
import { limparBanco } from '@/dados/testes/banco';
import { refeicoesEntre, registrarRefeicao, registrarTreino, treinosEntre } from './eventos';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

beforeEach(limparBanco);

describe('eventos de treino', () => {
  it('registrarTreino gera id uuid e atualizadoEm', async () => {
    const e = await registrarTreino({ data: '2026-09-14', hora: '18:00', tipo: 'tiros', minutos: 20, tiros: 4 });
    expect(e.id).toMatch(UUID);
    expect(e.atualizadoEm).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(e).toMatchObject({ data: '2026-09-14', hora: '18:00', tipo: 'tiros', minutos: 20, tiros: 4 });
  });

  it('dois registros no mesmo dia têm ids diferentes', async () => {
    const a = await registrarTreino({ data: '2026-09-14', hora: '07:00', tipo: 'forca', minutos: 30 });
    const b = await registrarTreino({ data: '2026-09-14', hora: '19:00', tipo: 'moderado', minutos: 40 });
    expect(a.id).not.toBe(b.id);
  });

  it('treinosEntre é inclusivo nas duas pontas e vem mais recente primeiro (data, depois hora)', async () => {
    await registrarTreino({ data: '2026-09-10', hora: '08:00', tipo: 'moderado', minutos: 30 });
    await registrarTreino({ data: '2026-09-12', hora: '07:00', tipo: 'forca', minutos: 30 });
    await registrarTreino({ data: '2026-09-12', hora: '19:00', tipo: 'tiros', minutos: 15 });
    await registrarTreino({ data: '2026-09-14', hora: '08:00', tipo: 'moderado', minutos: 30 });
    await registrarTreino({ data: '2026-09-15', hora: '08:00', tipo: 'moderado', minutos: 30 });
    await registrarTreino({ data: '2026-09-09', hora: '08:00', tipo: 'moderado', minutos: 30 });
    const lista = await treinosEntre('2026-09-10', '2026-09-14');
    expect(lista.map((e) => `${e.data} ${e.hora}`)).toEqual([
      '2026-09-14 08:00',
      '2026-09-12 19:00',
      '2026-09-12 07:00',
      '2026-09-10 08:00',
    ]);
  });
});

describe('eventos de refeição', () => {
  it('registrarRefeicao gera id e guarda comecouPelaFibra sem interpretar', async () => {
    const r = await registrarRefeicao({ data: '2026-09-14', hora: '12:30', proteinaG: 30, fibraG: 8, cozinhada: true, comecouPelaFibra: true });
    expect(r.id).toMatch(UUID);
    expect(r.comecouPelaFibra).toBe(true);
  });

  it('refeicoesEntre respeita a janela e a ordem', async () => {
    await registrarRefeicao({ data: '2026-09-13', hora: '08:00' });
    await registrarRefeicao({ data: '2026-09-14', hora: '08:00' });
    await registrarRefeicao({ data: '2026-09-14', hora: '13:00' });
    await registrarRefeicao({ data: '2026-09-16', hora: '08:00' });
    const lista = await refeicoesEntre('2026-09-14', '2026-09-15');
    expect(lista.map((r) => `${r.data} ${r.hora}`)).toEqual(['2026-09-14 13:00', '2026-09-14 08:00']);
  });
});
```

- [ ] **Step 7: Rodar e ver falhar**

```
pnpm vitest run src/dados/repositorios/eventos.test.ts
```

Esperado: falha de import (`./eventos` não existe).

- [ ] **Step 8: Implementar `eventos.ts`**

Crie `app/src/dados/repositorios/eventos.ts`:

```ts
import type { DataISO, EventoRefeicao, EventoTreino } from '@/dominio/tipos';
import { db } from '@/dados/db';

/** Mais recente primeiro: data desc, depois hora desc. */
function maisRecentePrimeiro<T extends { data: DataISO; hora: string }>(a: T, b: T): number {
  if (a.data !== b.data) return a.data < b.data ? 1 : -1;
  if (a.hora !== b.hora) return a.hora < b.hora ? 1 : -1;
  return 0;
}

export async function registrarTreino(e: Omit<EventoTreino, 'id' | 'atualizadoEm'>): Promise<EventoTreino> {
  const evento: EventoTreino = { ...e, id: crypto.randomUUID(), atualizadoEm: new Date().toISOString() };
  await db.eventoTreino.add(evento);
  return evento;
}

export async function registrarRefeicao(e: Omit<EventoRefeicao, 'id' | 'atualizadoEm'>): Promise<EventoRefeicao> {
  const evento: EventoRefeicao = { ...e, id: crypto.randomUUID(), atualizadoEm: new Date().toISOString() };
  await db.eventoRefeicao.add(evento);
  return evento;
}

export async function treinosEntre(de: DataISO, ate: DataISO): Promise<EventoTreino[]> {
  const lista = await db.eventoTreino.where('data').between(de, ate, true, true).toArray();
  return lista.sort(maisRecentePrimeiro);
}

export async function refeicoesEntre(de: DataISO, ate: DataISO): Promise<EventoRefeicao[]> {
  const lista = await db.eventoRefeicao.where('data').between(de, ate, true, true).toArray();
  return lista.sort(maisRecentePrimeiro);
}
```

- [ ] **Step 9: Rodar e ver passar**

```
pnpm vitest run src/dados/repositorios/eventos.test.ts
```

Esperado: `5 passed`.

- [ ] **Step 10: Commit**

```
git add app/src/dados/repositorios/eventos.ts app/src/dados/repositorios/eventos.test.ts
git commit -m "feat: repositório de eventos de treino e refeição com id uuid"
```

- [ ] **Step 11: Testes de semana, mês e exame (incluindo o pré-preenchimento)**

Crie `app/src/dados/repositorios/semanaMesExame.test.ts`:

```ts
// @vitest-environment node
import { beforeEach, describe, expect, it } from 'vitest';
import { limparBanco } from '@/dados/testes/banco';
import { salvarDia } from './dia';
import { registrarTreino } from './eventos';
import { lerSemana, preencherSemana, salvarSemana, semanaMaisRecente } from './semana';
import { lerMes, mesMaisRecente, salvarMes } from './mes';
import { listarExames, salvarExame, ultimoExame } from './exame';

beforeEach(limparBanco);

describe('semana', () => {
  it('lerSemana sem registro retorna undefined; semanaMaisRecente também', async () => {
    expect(await lerSemana('2026-W38')).toBeUndefined();
    expect(await semanaMaisRecente()).toBeUndefined();
  });

  it('salvarSemana cria e faz merge', async () => {
    await salvarSemana('2026-W38', { cintura: 92 });
    const s = await salvarSemana('2026-W38', { sessoesTiros: 2 });
    expect(s).toMatchObject({ semana: '2026-W38', cintura: 92, sessoesTiros: 2 });
    expect(await lerSemana('2026-W38')).toEqual(s);
  });

  it('semanaMaisRecente ordena pela chave ISO, inclusive na virada de ano', async () => {
    await salvarSemana('2026-W53', { cintura: 90 });
    await salvarSemana('2027-W01', { cintura: 89 });
    await salvarSemana('2026-W38', { cintura: 92 });
    expect((await semanaMaisRecente())?.semana).toBe('2027-W01');
  });

  it('preencherSemana conta eventos e soma dias da semana ISO, sem gravar', async () => {
    // 2026-W38 = 2026-09-14 (segunda) … 2026-09-20 (domingo)
    await registrarTreino({ data: '2026-09-14', hora: '07:00', tipo: 'tiros', minutos: 20 });
    await registrarTreino({ data: '2026-09-15', hora: '07:00', tipo: 'moderado', minutos: 30 });
    await registrarTreino({ data: '2026-09-16', hora: '07:00', tipo: 'forca', minutos: 40 });
    await registrarTreino({ data: '2026-09-19', hora: '07:00', tipo: 'moderado', minutos: 45 });
    await registrarTreino({ data: '2026-09-21', hora: '07:00', tipo: 'moderado', minutos: 60 }); // semana seguinte
    await registrarTreino({ data: '2026-09-13', hora: '07:00', tipo: 'tiros', minutos: 20 });    // semana anterior
    await salvarDia('2026-09-14', { alcoolDoses: 2, bebidaDoce: 1, maiorBloco: 60 });
    await salvarDia('2026-09-15', { alcoolDoses: null, bebidaDoce: 2, maiorBloco: 90 });
    await salvarDia('2026-09-17', { maiorBloco: 120 });
    await salvarDia('2026-09-13', { alcoolDoses: 5, bebidaDoce: 9, maiorBloco: 300 }); // fora da semana

    const p = await preencherSemana('2026-W38');
    expect(p).toEqual({
      sessoesTiros: 1,
      sessoesForca: 1,
      minAtiv: 75,
      alcoolDoses: 2,
      docesSemana: 3,
      maiorBlocoTipico: 90,
    });
    expect(await lerSemana('2026-W38')).toBeUndefined(); // não gravou
  });

  it('preencherSemana sem dados devolve só as contagens em zero', async () => {
    expect(await preencherSemana('2026-W38')).toEqual({ sessoesTiros: 0, sessoesForca: 0, minAtiv: 0 });
  });
});

describe('mes', () => {
  it('cria, faz merge e acha o mais recente', async () => {
    expect(await lerMes('2026-09')).toBeUndefined();
    await salvarMes('2026-09', { panturrilha: 37 });
    const m = await salvarMes('2026-09', { preensao: 40 });
    expect(m).toMatchObject({ mes: '2026-09', panturrilha: 37, preensao: 40 });
    await salvarMes('2026-08', { panturrilha: 36 });
    expect((await mesMaisRecente())?.mes).toBe('2026-09');
  });
});

describe('exame', () => {
  it('lista mais recente primeiro, faz merge por data e acha o último', async () => {
    expect(await listarExames()).toEqual([]);
    expect(await ultimoExame()).toBeUndefined();
    await salvarExame({ data: '2026-03-01', glicemia: 95 });
    await salvarExame({ data: '2026-09-01', glicemia: 90 });
    await salvarExame({ data: '2026-03-01', hba1c: 5.4 });
    const lista = await listarExames();
    expect(lista.map((e) => e.data)).toEqual(['2026-09-01', '2026-03-01']);
    expect(lista[1]).toMatchObject({ glicemia: 95, hba1c: 5.4 });
    expect((await ultimoExame())?.data).toBe('2026-09-01');
  });
});
```

- [ ] **Step 12: Rodar e ver falhar**

```
pnpm vitest run src/dados/repositorios/semanaMesExame.test.ts
```

Esperado: falha de import (`./semana`, `./mes`, `./exame` não existem).

- [ ] **Step 13: Implementar `semana.ts`, `mes.ts`, `exame.ts`**

Crie `app/src/dados/repositorios/semana.ts`:

```ts
import type { Semana, SemanaISO } from '@/dominio/tipos';
import { mediana } from '@/dominio/derivados';
import { db } from '@/dados/db';
import { segundaDaSemana, somarDias } from '@/dados/datas';

export function lerSemana(s: SemanaISO): Promise<Semana | undefined> {
  return db.semana.get(s);
}

export function salvarSemana(s: SemanaISO, parcial: Partial<Omit<Semana, 'semana' | 'atualizadoEm'>>): Promise<Semana> {
  return db.transaction('rw', db.semana, async () => {
    const atual = await db.semana.get(s);
    const nova: Semana = { ...atual, ...parcial, semana: s, atualizadoEm: new Date().toISOString() };
    await db.semana.put(nova);
    return nova;
  });
}

/** A chave "YYYY-Www" ordena cronologicamente como texto (W01 … W53). */
export function semanaMaisRecente(): Promise<Semana | undefined> {
  return db.semana.orderBy('semana').last();
}

/**
 * Pré-preenchimento da revisão de segunda a partir dos eventos e dos dias da semana ISO.
 * Não grava: a pessoa confirma ou corrige na tela e só então `salvarSemana` é chamado.
 */
export async function preencherSemana(s: SemanaISO): Promise<Partial<Semana>> {
  const segunda = segundaDaSemana(s);
  const domingo = somarDias(segunda, 6);
  const [treinos, dias] = await Promise.all([
    db.eventoTreino.where('data').between(segunda, domingo, true, true).toArray(),
    db.dia.where('data').between(segunda, domingo, true, true).toArray(),
  ]);

  const parcial: Partial<Semana> = {
    sessoesTiros: treinos.filter((t) => t.tipo === 'tiros').length,
    sessoesForca: treinos.filter((t) => t.tipo === 'forca').length,
    minAtiv: treinos.filter((t) => t.tipo === 'moderado').reduce((soma, t) => soma + t.minutos, 0),
  };

  const doses = dias.map((d) => d.alcoolDoses).filter((v): v is number => typeof v === 'number'); // null = não bebeu, não soma
  if (doses.length > 0) parcial.alcoolDoses = doses.reduce((a, b) => a + b, 0);

  const doces = dias.map((d) => d.bebidaDoce).filter((v): v is number => typeof v === 'number');
  if (doces.length > 0) parcial.docesSemana = doces.reduce((a, b) => a + b, 0);

  const blocoTipico = mediana(dias.map((d) => d.maiorBloco).filter((v): v is number => typeof v === 'number'));
  if (blocoTipico !== null) parcial.maiorBlocoTipico = blocoTipico;

  return parcial;
}
```

Crie `app/src/dados/repositorios/mes.ts`:

```ts
import type { Mes, MesISO } from '@/dominio/tipos';
import { db } from '@/dados/db';

export function lerMes(m: MesISO): Promise<Mes | undefined> {
  return db.mes.get(m);
}

export function salvarMes(m: MesISO, parcial: Partial<Omit<Mes, 'mes' | 'atualizadoEm'>>): Promise<Mes> {
  return db.transaction('rw', db.mes, async () => {
    const atual = await db.mes.get(m);
    const novo: Mes = { ...atual, ...parcial, mes: m, atualizadoEm: new Date().toISOString() };
    await db.mes.put(novo);
    return novo;
  });
}

export function mesMaisRecente(): Promise<Mes | undefined> {
  return db.mes.orderBy('mes').last();
}
```

Crie `app/src/dados/repositorios/exame.ts`:

```ts
import type { Exame } from '@/dominio/tipos';
import { db } from '@/dados/db';

/** Mais recente primeiro. */
export function listarExames(): Promise<Exame[]> {
  return db.exame.orderBy('data').reverse().toArray();
}

/** Merge por data: registrar só a hba1c num exame já existente não apaga a glicemia. */
export function salvarExame(e: Omit<Exame, 'atualizadoEm'>): Promise<Exame> {
  return db.transaction('rw', db.exame, async () => {
    const atual = await db.exame.get(e.data);
    const novo: Exame = { ...atual, ...e, atualizadoEm: new Date().toISOString() };
    await db.exame.put(novo);
    return novo;
  });
}

export function ultimoExame(): Promise<Exame | undefined> {
  return db.exame.orderBy('data').last();
}
```

- [ ] **Step 14: Rodar e ver passar**

```
pnpm vitest run src/dados/repositorios/semanaMesExame.test.ts
```

Esperado: `7 passed`.

- [ ] **Step 15: Commit**

```
git add app/src/dados/repositorios/semana.ts app/src/dados/repositorios/mes.ts app/src/dados/repositorios/exame.ts app/src/dados/repositorios/semanaMesExame.test.ts
git commit -m "feat: repositórios de semana (com pré-preenchimento), mês e exame"
```

---

### Task 5: Montagem do Contexto (`dados/contexto.ts`)

**Files:**
- Create: `app/src/dados/contexto.ts`
- Test: `app/src/dados/contexto.test.ts`

**Interfaces:**
- Consumes:
  - `import type { Contexto } from '@/dominio/metas/tipos'` (plano 01)
  - `import { derivar } from '@/dominio/derivados'` — `derivar(perfil: Perfil, dias: Dia[], eventos: EventoTreino[], semana: Semana | undefined, hoje: DataISO): Derivados`
  - repositórios da Task 4; `somarDias` da Task 2.
- Produces (contratos):
  ```ts
  export function montarContexto(hoje: DataISO, agora?: Date): Promise<Contexto | { semPerfil: true }>;
  ```

**Decisões fixas:** uma consulta por tabela; janela de 28 dias = `[somarDias(hoje, −27), hoje]`; `hoje` do contexto é `dias[0]` quando `dias[0].data === hoje`, senão `undefined`; `agora` default `new Date()`.

- [ ] **Step 1: Escrever o teste**

Crie `app/src/dados/contexto.test.ts`:

```ts
// @vitest-environment node
import { beforeEach, describe, expect, it } from 'vitest';
import { limparBanco, PERFIL_TESTE } from '@/dados/testes/banco';
import { salvarPerfil } from '@/dados/repositorios/perfil';
import { salvarDia } from '@/dados/repositorios/dia';
import { registrarRefeicao, registrarTreino } from '@/dados/repositorios/eventos';
import { salvarSemana } from '@/dados/repositorios/semana';
import { salvarMes } from '@/dados/repositorios/mes';
import { montarContexto } from './contexto';

beforeEach(limparBanco);

describe('montarContexto', () => {
  it('sem perfil retorna { semPerfil: true }', async () => {
    await salvarDia('2026-09-14', { passos: 1 });
    expect(await montarContexto('2026-09-14')).toEqual({ semPerfil: true });
  });

  it('com perfil e 3 dias monta o contexto com dias mais recentes primeiro e derivados calculados', async () => {
    await salvarPerfil(PERFIL_TESTE); // peso 80, altura 175 → imc 26,1
    await salvarDia('2026-09-12', { passos: 4000 });
    await salvarDia('2026-09-14', { passos: 6000, deitou: '23:00', levantou: '07:00' });
    await salvarDia('2026-09-13', { passos: 5000 });
    await salvarDia('2026-08-17', { passos: 9999 }); // 28 dias antes de 2026-09-14 seria 2026-08-18: fora da janela
    const agora = new Date(2026, 8, 14, 9, 0);

    const ctx = await montarContexto('2026-09-14', agora);
    expect('semPerfil' in ctx).toBe(false);
    if ('semPerfil' in ctx) return;

    expect(ctx.perfil.peso).toBe(80);
    expect(ctx.dias.length).toBe(3);
    expect(ctx.dias.map((d) => d.data)).toEqual(['2026-09-14', '2026-09-13', '2026-09-12']);
    expect(ctx.hoje?.data).toBe('2026-09-14');
    expect(ctx.hoje?.passos).toBe(6000);
    expect(ctx.derivados.imc).toBe(26.1);
    expect(ctx.derivados.sonoHoras).not.toBeNull(); // veio de deitou/levantou de 2026-09-14
    expect(ctx.eventos).toEqual([]);
    expect(ctx.refeicoes).toEqual([]);
    expect(ctx.semana).toBeUndefined();
    expect(ctx.mes).toBeUndefined();
    expect(ctx.agora).toBe(agora);
  });

  it('hoje é undefined quando o dia de hoje ainda não foi registrado', async () => {
    await salvarPerfil(PERFIL_TESTE);
    await salvarDia('2026-09-13', { passos: 5000 });
    const ctx = await montarContexto('2026-09-14');
    if ('semPerfil' in ctx) throw new Error('esperava contexto');
    expect(ctx.hoje).toBeUndefined();
    expect(ctx.dias.map((d) => d.data)).toEqual(['2026-09-13']);
  });

  it('traz eventos e refeições da janela de 28 dias, semana e mês mais recentes', async () => {
    await salvarPerfil(PERFIL_TESTE);
    await registrarTreino({ data: '2026-08-18', hora: '07:00', tipo: 'tiros', minutos: 20 }); // primeiro dia da janela
    await registrarTreino({ data: '2026-08-17', hora: '07:00', tipo: 'tiros', minutos: 20 }); // fora
    await registrarTreino({ data: '2026-09-14', hora: '07:00', tipo: 'forca', minutos: 30 });
    await registrarRefeicao({ data: '2026-09-10', hora: '12:00', proteinaG: 30 });
    await salvarSemana('2026-W37', { cintura: 92 });
    await salvarSemana('2026-W36', { cintura: 93 });
    await salvarMes('2026-09', { panturrilha: 37 });

    const ctx = await montarContexto('2026-09-14');
    if ('semPerfil' in ctx) throw new Error('esperava contexto');
    expect(ctx.eventos.map((e) => e.data)).toEqual(['2026-09-14', '2026-08-18']);
    expect(ctx.refeicoes.map((r) => r.data)).toEqual(['2026-09-10']);
    expect(ctx.semana?.semana).toBe('2026-W37');
    expect(ctx.mes?.mes).toBe('2026-09');
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

```
pnpm vitest run src/dados/contexto.test.ts
```

Esperado: falha de import (`./contexto` não existe).

- [ ] **Step 3: Implementar**

Crie `app/src/dados/contexto.ts`:

```ts
import type { DataISO } from '@/dominio/tipos';
import type { Contexto } from '@/dominio/metas/tipos';
import { derivar } from '@/dominio/derivados';
import { somarDias } from '@/dados/datas';
import { lerPerfil } from '@/dados/repositorios/perfil';
import { diasRecentes } from '@/dados/repositorios/dia';
import { refeicoesEntre, treinosEntre } from '@/dados/repositorios/eventos';
import { semanaMaisRecente } from '@/dados/repositorios/semana';
import { mesMaisRecente } from '@/dados/repositorios/mes';

const JANELA_DIAS = 28;

/**
 * Única ponte dados/ → dominio/: lê uma vez cada tabela na janela de 28 dias e calcula os derivados.
 * A UI reage a gravações via useLiveQuery (plano 04), chamando esta função de novo.
 */
export async function montarContexto(hoje: DataISO, agora: Date = new Date()): Promise<Contexto | { semPerfil: true }> {
  const perfil = await lerPerfil();
  if (!perfil) return { semPerfil: true };

  const inicio = somarDias(hoje, -(JANELA_DIAS - 1));
  const [dias, eventos, refeicoes, semana, mes] = await Promise.all([
    diasRecentes(hoje, JANELA_DIAS),
    treinosEntre(inicio, hoje),
    refeicoesEntre(inicio, hoje),
    semanaMaisRecente(),
    mesMaisRecente(),
  ]);

  return {
    perfil,
    hoje: dias[0]?.data === hoje ? dias[0] : undefined,
    dias,
    eventos,
    refeicoes,
    semana,
    mes,
    derivados: derivar(perfil, dias, eventos, semana, hoje),
    agora,
  };
}
```

- [ ] **Step 4: Rodar e ver passar**

```
pnpm vitest run src/dados/contexto.test.ts
```

Esperado: `4 passed`. Se `derivados.imc` vier diferente de 26.1, confira o arredondamento de `derivar` no plano 01 (contratos: `imc` com 1 casa) — o erro está lá, não aqui.

- [ ] **Step 5: Commit**

```
git add app/src/dados/contexto.ts app/src/dados/contexto.test.ts
git commit -m "feat: montarContexto lê a janela de 28 dias e calcula derivados"
```

---

### Task 6: Export / import JSON (`dados/exportImport.ts`)

**Files:**
- Create: `app/src/dados/exportImport.ts`
- Test: `app/src/dados/exportImport.test.ts`

**Interfaces:**
- Consumes: `db` (Task 3), `lerPerfil` (Task 4), tipos de `@/dominio/tipos`.
- Produces (contratos):
  ```ts
  export interface Exportacao {
    versao: 1; exportadoEm: string; perfil?: Perfil;
    dia: Dia[]; eventoTreino: EventoTreino[]; eventoRefeicao: EventoRefeicao[]; semana: Semana[]; mes: Mes[]; exame: Exame[];
  }
  export function exportar(): Promise<Exportacao>;
  export function importar(json: unknown): Promise<{ ok: true; contagem: Record<string, number> } | { ok: false; motivo: string }>;
  export function apagarTudo(): Promise<void>;
  ```

**Decisões fixas:**
- `importar` aceita o objeto já parseado **ou** o texto do arquivo (string): string malformada → `{ ok: false, motivo: 'O arquivo não é um JSON válido.' }`.
- Validação completa antes de qualquer gravação: objeto; `versao === 1`; nenhuma chave desconhecida (só `versao`, `exportadoEm`, `perfil` e as 6 tabelas); cada tabela ausente = `[]`, presente = array; cada linha é objeto com a chave da tabela (`data` / `id` / `semana` / `mes`) como string não vazia; `perfil`, se presente, é objeto.
- Merge dentro de `db.transaction('rw', todas as tabelas)`: grava a linha se não existe ou se `atualizadoEm` (string ISO, comparação lexicográfica) for maior que o existente; linha sem `atualizadoEm` conta como a mais antiga possível.
- `contagem` = linhas efetivamente gravadas por tabela (inclui `perfil`: 0 ou 1).

- [ ] **Step 1: Escrever o teste**

Crie `app/src/dados/exportImport.test.ts`:

```ts
// @vitest-environment node
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/dados/db';
import { limparBanco, PERFIL_TESTE } from '@/dados/testes/banco';
import { lerPerfil, salvarPerfil } from '@/dados/repositorios/perfil';
import { lerDia, salvarDia } from '@/dados/repositorios/dia';
import { registrarRefeicao, registrarTreino } from '@/dados/repositorios/eventos';
import { salvarSemana } from '@/dados/repositorios/semana';
import { salvarMes } from '@/dados/repositorios/mes';
import { salvarExame } from '@/dados/repositorios/exame';
import { apagarTudo, exportar, importar } from './exportImport';

beforeEach(limparBanco);

async function popular() {
  await salvarPerfil(PERFIL_TESTE);
  await salvarDia('2026-09-13', { passos: 5000 });
  await salvarDia('2026-09-14', { passos: 6000, ultimoCafe: null });
  await registrarTreino({ data: '2026-09-14', hora: '07:00', tipo: 'tiros', minutos: 20 });
  await registrarRefeicao({ data: '2026-09-14', hora: '12:00', proteinaG: 30 });
  await salvarSemana('2026-W37', { cintura: 92 });
  await salvarMes('2026-09', { panturrilha: 37 });
  await salvarExame({ data: '2026-09-01', glicemia: 90 });
}

async function contarTudo(): Promise<Record<string, number>> {
  const contagem: Record<string, number> = {};
  for (const t of db.tables) contagem[t.name] = await t.count();
  return contagem;
}

describe('exportar', () => {
  it('produz o envelope versionado com todas as tabelas', async () => {
    await popular();
    const e = await exportar();
    expect(e.versao).toBe(1);
    expect(e.exportadoEm).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(e.perfil?.peso).toBe(80);
    expect(e.perfil).not.toHaveProperty('id');
    expect(e.dia.map((d) => d.data).sort()).toEqual(['2026-09-13', '2026-09-14']);
    expect(e.eventoTreino).toHaveLength(1);
    expect(e.eventoRefeicao).toHaveLength(1);
    expect(e.semana).toHaveLength(1);
    expect(e.mes).toHaveLength(1);
    expect(e.exame).toHaveLength(1);
  });

  it('banco vazio exporta sem perfil e com listas vazias', async () => {
    const e = await exportar();
    expect(e.perfil).toBeUndefined();
    expect(e.dia).toEqual([]);
  });
});

describe('apagarTudo', () => {
  it('zera todas as tabelas', async () => {
    await popular();
    await apagarTudo();
    expect(await contarTudo()).toEqual({ perfil: 0, dia: 0, eventoTreino: 0, eventoRefeicao: 0, semana: 0, mes: 0, exame: 0 });
  });
});

describe('importar', () => {
  it('round-trip: exportar → apagarTudo → importar restaura tudo', async () => {
    await popular();
    const antes = await exportar();
    await apagarTudo();

    const r = await importar(JSON.parse(JSON.stringify(antes)));
    expect(r).toEqual({
      ok: true,
      contagem: { perfil: 1, dia: 2, eventoTreino: 1, eventoRefeicao: 1, semana: 1, mes: 1, exame: 1 },
    });

    const depois = await exportar();
    expect({ ...depois, exportadoEm: '' }).toEqual({ ...antes, exportadoEm: '' });
    expect(await lerPerfil()).toEqual(antes.perfil);
    expect((await lerDia('2026-09-14'))?.ultimoCafe).toBeNull();
  });

  it('aceita o texto do arquivo (string JSON)', async () => {
    const r = await importar(JSON.stringify({ versao: 1, dia: [{ data: '2026-09-14', passos: 1, atualizadoEm: '2026-09-14T00:00:00.000Z' }] }));
    expect(r.ok).toBe(true);
    expect((await lerDia('2026-09-14'))?.passos).toBe(1);
  });

  it('merge: mantém a linha mais recente de cada lado', async () => {
    await salvarDia('2026-09-14', { passos: 6000 }); // atualizadoEm = agora (mais recente que 2020)
    await salvarDia('2026-09-13', { passos: 5000 });
    const r = await importar({
      versao: 1,
      dia: [
        { data: '2026-09-14', passos: 1, atualizadoEm: '2020-01-01T00:00:00.000Z' },  // mais antiga: ignorada
        { data: '2026-09-13', passos: 2, atualizadoEm: '2099-01-01T00:00:00.000Z' },  // mais recente: vence
        { data: '2026-09-12', passos: 3, atualizadoEm: '2020-01-01T00:00:00.000Z' },  // não existia: gravada
      ],
    });
    expect(r).toEqual({ ok: true, contagem: { perfil: 0, dia: 2, eventoTreino: 0, eventoRefeicao: 0, semana: 0, mes: 0, exame: 0 } });
    expect((await lerDia('2026-09-14'))?.passos).toBe(6000);
    expect((await lerDia('2026-09-13'))?.passos).toBe(2);
    expect((await lerDia('2026-09-12'))?.passos).toBe(3);
  });

  it('merge do perfil segue a mesma regra', async () => {
    await salvarPerfil(PERFIL_TESTE);
    const r = await importar({ versao: 1, perfil: { ...PERFIL_TESTE, peso: 70, atualizadoEm: '2020-01-01T00:00:00.000Z' } });
    expect(r).toMatchObject({ ok: true, contagem: { perfil: 0 } });
    expect((await lerPerfil())?.peso).toBe(80);
    const r2 = await importar({ versao: 1, perfil: { ...PERFIL_TESTE, peso: 70, atualizadoEm: '2099-01-01T00:00:00.000Z' } });
    expect(r2).toMatchObject({ ok: true, contagem: { perfil: 1 } });
    expect((await lerPerfil())?.peso).toBe(70);
  });

  it('versão 2 é rejeitada e nada muda', async () => {
    await popular();
    const antes = await contarTudo();
    const r = await importar({ versao: 2, dia: [{ data: '2000-01-01', atualizadoEm: '2000-01-01T00:00:00.000Z' }] });
    expect(r).toEqual({ ok: false, motivo: 'Versão de exportação não suportada: 2 (esperada 1).' });
    expect(await contarTudo()).toEqual(antes);
    expect(await lerDia('2000-01-01')).toBeUndefined();
  });

  it('JSON malformado (string) é rejeitado com motivo', async () => {
    const r = await importar('{ isto não é json');
    expect(r).toEqual({ ok: false, motivo: 'O arquivo não é um JSON válido.' });
  });

  it('valores que não são objeto são rejeitados', async () => {
    expect(await importar(null)).toEqual({ ok: false, motivo: 'O arquivo não é um objeto de exportação.' });
    expect(await importar([1, 2])).toEqual({ ok: false, motivo: 'O arquivo não é um objeto de exportação.' });
    expect(await importar(42)).toEqual({ ok: false, motivo: 'O arquivo não é um objeto de exportação.' });
  });

  it('tabela desconhecida é rejeitada', async () => {
    const r = await importar({ versao: 1, treinos: [] });
    expect(r).toEqual({ ok: false, motivo: 'Tabela desconhecida: treinos.' });
  });

  it('tabela que não é lista é rejeitada', async () => {
    const r = await importar({ versao: 1, dia: { data: '2026-09-14' } });
    expect(r).toEqual({ ok: false, motivo: 'A tabela dia deveria ser uma lista.' });
  });

  it('linha sem chave é rejeitada antes de gravar qualquer outra linha', async () => {
    const r = await importar({
      versao: 1,
      dia: [{ data: '2026-09-14', atualizadoEm: '2026-09-14T00:00:00.000Z' }],
      semana: [{ cintura: 90 }],
    });
    expect(r).toEqual({ ok: false, motivo: 'Linha 1 da tabela semana sem o campo "semana".' });
    expect(await lerDia('2026-09-14')).toBeUndefined(); // a tabela dia, válida, também não foi gravada
  });

  it('perfil que não é objeto é rejeitado', async () => {
    expect(await importar({ versao: 1, perfil: 'eu' })).toEqual({ ok: false, motivo: 'O perfil não é um objeto.' });
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

```
pnpm vitest run src/dados/exportImport.test.ts
```

Esperado: falha de import (`./exportImport` não existe).

- [ ] **Step 3: Implementar**

Crie `app/src/dados/exportImport.ts`:

```ts
import type { Dia, EventoRefeicao, EventoTreino, Exame, Mes, Perfil, Semana } from '@/dominio/tipos';
import { db } from '@/dados/db';
import { lerPerfil } from '@/dados/repositorios/perfil';

export interface Exportacao {
  versao: 1;
  exportadoEm: string;
  perfil?: Perfil;
  dia: Dia[];
  eventoTreino: EventoTreino[];
  eventoRefeicao: EventoRefeicao[];
  semana: Semana[];
  mes: Mes[];
  exame: Exame[];
}

type Tabela = 'dia' | 'eventoTreino' | 'eventoRefeicao' | 'semana' | 'mes' | 'exame';
const TABELAS: Tabela[] = ['dia', 'eventoTreino', 'eventoRefeicao', 'semana', 'mes', 'exame'];
const CHAVE: Record<Tabela, string> = { dia: 'data', eventoTreino: 'id', eventoRefeicao: 'id', semana: 'semana', mes: 'mes', exame: 'data' };
const CHAVES_PERMITIDAS = new Set<string>(['versao', 'exportadoEm', 'perfil', ...TABELAS]);

type Linha = Record<string, unknown> & { atualizadoEm?: unknown };

interface Validado {
  perfil?: Linha;
  tabelas: Record<Tabela, Linha[]>;
}

type Resultado = { ok: true; contagem: Record<string, number> } | { ok: false; motivo: string };

function ehObjeto(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Valida TUDO e devolve o conteúdo normalizado (tabelas ausentes = []). Nunca toca no banco. */
function validar(json: unknown): { ok: true; dados: Validado } | { ok: false; motivo: string } {
  if (!ehObjeto(json)) return { ok: false, motivo: 'O arquivo não é um objeto de exportação.' };
  if (json.versao !== 1) return { ok: false, motivo: `Versão de exportação não suportada: ${String(json.versao)} (esperada 1).` };

  for (const chave of Object.keys(json)) {
    if (!CHAVES_PERMITIDAS.has(chave)) return { ok: false, motivo: `Tabela desconhecida: ${chave}.` };
  }

  let perfil: Linha | undefined;
  if (json.perfil !== undefined) {
    if (!ehObjeto(json.perfil)) return { ok: false, motivo: 'O perfil não é um objeto.' };
    perfil = json.perfil;
  }

  const tabelas = {} as Record<Tabela, Linha[]>;
  for (const tabela of TABELAS) {
    const valor = json[tabela] ?? [];
    if (!Array.isArray(valor)) return { ok: false, motivo: `A tabela ${tabela} deveria ser uma lista.` };
    const chave = CHAVE[tabela];
    for (let i = 0; i < valor.length; i++) {
      const linha: unknown = valor[i];
      if (!ehObjeto(linha) || typeof linha[chave] !== 'string' || linha[chave] === '') {
        return { ok: false, motivo: `Linha ${i + 1} da tabela ${tabela} sem o campo "${chave}".` };
      }
    }
    tabelas[tabela] = valor as Linha[];
  }

  return { ok: true, dados: { perfil, tabelas } };
}

/** A linha nova vence se não há existente ou se seu atualizadoEm (ISO) é maior. Sem atualizadoEm = a mais antiga possível. */
function maisRecente(nova: Linha, atual: Linha | undefined): boolean {
  if (!atual) return true;
  const a = typeof nova.atualizadoEm === 'string' ? nova.atualizadoEm : '';
  const b = typeof atual.atualizadoEm === 'string' ? atual.atualizadoEm : '';
  return a > b;
}

export async function exportar(): Promise<Exportacao> {
  const [perfil, dia, eventoTreino, eventoRefeicao, semana, mes, exame] = await Promise.all([
    lerPerfil(),
    db.dia.toArray(),
    db.eventoTreino.toArray(),
    db.eventoRefeicao.toArray(),
    db.semana.toArray(),
    db.mes.toArray(),
    db.exame.toArray(),
  ]);
  const exportacao: Exportacao = { versao: 1, exportadoEm: new Date().toISOString(), dia, eventoTreino, eventoRefeicao, semana, mes, exame };
  if (perfil) exportacao.perfil = perfil;
  return exportacao;
}

/**
 * Importa com merge por chave (atualizadoEm mais recente vence).
 * Aceita o objeto já parseado ou o texto do arquivo. Se qualquer coisa for inválida, nada é gravado.
 */
export async function importar(json: unknown): Promise<Resultado> {
  let conteudo = json;
  if (typeof json === 'string') {
    try {
      conteudo = JSON.parse(json);
    } catch {
      return { ok: false, motivo: 'O arquivo não é um JSON válido.' };
    }
  }

  const validacao = validar(conteudo);
  if (!validacao.ok) return validacao;
  const { perfil, tabelas } = validacao.dados;

  const contagem: Record<string, number> = { perfil: 0 };
  for (const tabela of TABELAS) contagem[tabela] = 0;

  await db.transaction('rw', db.tables, async () => {
    if (perfil) {
      const atual = await db.perfil.get('me');
      if (maisRecente(perfil, atual)) {
        await db.perfil.put({ ...(perfil as unknown as Perfil), id: 'me' });
        contagem.perfil = 1;
      }
    }
    for (const tabela of TABELAS) {
      const tabelaDb = db.table(tabela);
      for (const linha of tabelas[tabela]) {
        const chave = linha[CHAVE[tabela]] as string; // validar() já garantiu que é string não vazia
        const atual = (await tabelaDb.get(chave)) as Linha | undefined;
        if (maisRecente(linha, atual)) {
          await tabelaDb.put(linha);
          contagem[tabela] += 1;
        }
      }
    }
  });

  return { ok: true, contagem };
}

export async function apagarTudo(): Promise<void> {
  await db.transaction('rw', db.tables, async () => {
    await Promise.all(db.tables.map((t) => t.clear()));
  });
}
```

- [ ] **Step 4: Rodar e ver passar**

```
pnpm vitest run src/dados/exportImport.test.ts
```

Esperado: `14 passed`. Nota sobre `db.transaction('rw', db.tables, fn)`: a assinatura de Dexie 4 aceita um array de tabelas como segundo argumento; se o TypeScript reclamar, confira que `dexie` está na versão 4 (`pnpm ls dexie`).

- [ ] **Step 5: Rodar lint e typecheck**

```
pnpm lint
pnpm tsc --noEmit -p tsconfig.app.json
```

(Se o projeto do plano 01 não tiver `tsconfig.app.json`, use `pnpm tsc --noEmit`.) Esperado: sem erros.

- [ ] **Step 6: Commit**

```
git add app/src/dados/exportImport.ts app/src/dados/exportImport.test.ts
git commit -m "feat: export e import JSON versionado com validação completa e merge por atualizadoEm"
```

---

### Task 7: Disponibilidade do IndexedDB (`dados/disponibilidade.ts`)

**Files:**
- Create: `app/src/dados/disponibilidade.ts`
- Test: `app/src/dados/disponibilidade.test.ts`

**Interfaces:**
- Consumes: `db` (Task 3).
- Produces (adição deste plano; a UI do plano 04 chama na abertura para mostrar a mensagem única do spec §9):
  ```ts
  export function indexedDbDisponivel(): Promise<boolean>;
  ```

**Decisões fixas:** retorna `false` se `indexedDB` não existe no `globalThis` ou se `db.open()` rejeita (modo privado, cota, bloqueio). Nunca lança. Não fecha o banco quando abre: a app continua usando a mesma instância.

- [ ] **Step 1: Escrever o teste**

Crie `app/src/dados/disponibilidade.test.ts`:

```ts
// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/dados/db';
import { indexedDbDisponivel } from './disponibilidade';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('indexedDbDisponivel', () => {
  it('true quando o banco abre (fake-indexeddb)', async () => {
    expect(await indexedDbDisponivel()).toBe(true);
    expect(db.isOpen()).toBe(true);
  });

  it('false quando não existe indexedDB no ambiente', async () => {
    vi.stubGlobal('indexedDB', undefined);
    expect(await indexedDbDisponivel()).toBe(false);
  });

  it('false quando db.open() rejeita, sem lançar', async () => {
    vi.spyOn(db, 'open').mockRejectedValueOnce(new Error('bloqueado'));
    await expect(indexedDbDisponivel()).resolves.toBe(false);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

```
pnpm vitest run src/dados/disponibilidade.test.ts
```

Esperado: falha de import (`./disponibilidade` não existe).

- [ ] **Step 3: Implementar**

Crie `app/src/dados/disponibilidade.ts`:

```ts
import { db } from '@/dados/db';

/**
 * Spec §9: com IndexedDB indisponível (modo privado, cota, bloqueio) a app mostra uma mensagem única
 * na abertura e segue em memória na sessão. Esta função só responde a pergunta; nunca lança.
 */
export async function indexedDbDisponivel(): Promise<boolean> {
  if (typeof globalThis.indexedDB === 'undefined') return false;
  try {
    await db.open();
    return true;
  } catch {
    return false;
  }
}
```

- [ ] **Step 4: Rodar e ver passar**

```
pnpm vitest run src/dados/disponibilidade.test.ts
```

Esperado: `3 passed`.

- [ ] **Step 5: Rodar a suíte inteira, lint e build; commit**

```
pnpm test
pnpm lint
pnpm build
```

Esperado: todos os testes dos planos 01, 02 e 03 passam; lint sem erros (em especial nenhuma import de `dados/` ou `dexie` dentro de `src/dominio/`); build ok.

```
git add app/src/dados/disponibilidade.ts app/src/dados/disponibilidade.test.ts
git commit -m "feat: detecção de IndexedDB indisponível para a mensagem única da abertura"
```

---

## Checklist final do plano 03

- [ ] `pnpm test` verde com estes arquivos novos: `sonoFomeCafe.test.ts` (23), `datas.test.ts` (7), `db.test.ts` (2), `perfilDia.test.ts` (8), `eventos.test.ts` (5), `semanaMesExame.test.ts` (7), `contexto.test.ts` (4), `exportImport.test.ts` (14), `disponibilidade.test.ts` (3).
- [ ] Nenhum arquivo em `src/dominio/` importa de `src/dados/`, `dexie` ou `react`.
- [ ] Os nomes exportados batem com os contratos: `sonoFomeCafe`, `Tendencia`, `Frase`, `FraseTipo`; `FornalhaDB`, `db`; `lerPerfil`, `salvarPerfil`, `lerDia`, `salvarDia`, `diasRecentes`, `registrarTreino`, `registrarRefeicao`, `treinosEntre`, `refeicoesEntre`, `lerSemana`, `salvarSemana`, `semanaMaisRecente`, `preencherSemana`, `lerMes`, `salvarMes`, `mesMaisRecente`, `listarExames`, `salvarExame`, `ultimoExame`; `montarContexto`; `Exportacao`, `exportar`, `importar`, `apagarTudo`; `hojeISO`, `semanaISO`, `mesISO`, `ontem`, `somarDias`. Adições (não renomeiam nada): `segundaDaSemana`, `indexedDbDisponivel`, `limparBanco`, `PERFIL_TESTE`.
- [ ] O plano 04 (UI) pode consumir: `montarContexto` no `useContexto`, `sonoFomeCafe(ctx.dias, ctx.perfil)` na tela Tendências, `preencherSemana(semanaISO(hojeISO()))` na tela Segunda, `exportar`/`importar`/`apagarTudo` em Ajustes e `indexedDbDisponivel()` no shell.
