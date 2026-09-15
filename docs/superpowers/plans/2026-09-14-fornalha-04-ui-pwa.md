# Fornalha 04 — UI e PWA: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar as seis telas do spec (§5) — Perfil, Hoje, Ações, Segunda (+ Exames), Tendências, Ajustes — como PWA instalável e offline, geradas a partir do registro de campos e do motor de metas já existentes, com um teste de fumaça por tela e por componente.

**Architecture:** `src/ui/` (telas, componentes, hooks) só lê do domínio (`src/dominio/**`) e grava pelos repositórios (`src/dados/**`). Os hooks usam `useLiveQuery` (dexie-react-hooks) para que qualquer gravação re-renderize a tela. O shell (`src/app/`) monta o `HashRouter`, a navegação inferior e a guarda "sem perfil → /perfil". As telas de registro não conhecem campo nenhum pelo nome: iteram `camposDe(tabela, perfil, nivel)` e delegam ao componente `CampoRegistro`, que renderiza pelo `Campo.tipo` e valida com `validar()`. Zona, meta, próximo passo e tendência vêm prontos do domínio; a UI nunca calcula.

**Tech Stack:** React 19, react-router 7 (`HashRouter`, pacote `react-router`), dexie-react-hooks, CSS puro com custom properties (sem Tailwind), Vite 6, vite-plugin-pwa, Vitest 3 + @testing-library/react + @testing-library/jest-dom + jsdom + fake-indexeddb, sharp (só script de ícones).

**Spec:** docs/superpowers/specs/2026-09-14-fornalha-app-design.md
**Contratos:** docs/superpowers/plans/2026-09-14-fornalha-00-contratos.md
**Depende de:** planos 01, 02 e 03 concluídos

## Global Constraints

- Telas geradas do registro de campos: nenhum `if (campo.id === 'dia.ultimoCafe')` na UI. Condições de perfil vivem em `Campo.condicao`; a UI só chama `camposDe(...)`. Única exceção documentada: `dia.moveu` some quando houve treino ontem — condição que depende de eventos, não do perfil, e por isso não cabe em `condicao` (Task 5).
- A UI nunca calcula zona, meta, faixa, próximo passo, derivados ou tendência: só chama `METAS`, `metasAplicaveis`, `acoesEmFoco`, `medidas`, `derivar`, `sonoFomeCafe`.
- Todo import de `@/dominio/...` e `@/dados/...` usa exatamente um nome e um caminho do arquivo de contratos. Não renomear, não reexportar com outro nome.
- Sem push, sem streaks, sem gamificação além do contador `diasParado`.
- Textos ao usuário em português com acento; identificadores (arquivos, variáveis, classes CSS, `data-*`) sem acento.
- Tema claro/escuro só por tokens (`--bg --fg --muted --line --ok --weak --bad --accent` + os auxiliares de `tema.css`); nenhuma cor literal fora de `tema.css`.
- Largura mínima 400 px sem scroll horizontal: grids com `auto-fill/minmax`, nada com `min-width` maior que a tela, `padding-inline` ≥ 16 px no `body`.
- `pnpm` sempre. Comandos `pnpm ...` rodam dentro de `app/`. Git roda na raiz do repo: a partir de `app/`, use `git -C .. add app/...` e `git -C .. commit`.
- Commits pequenos, em português, com prefixo `feat:` / `test:` / `chore:` / `fix:`.
- Ciclo por task: teste que falha → rodar e ver falhar → implementação mínima → rodar e ver passar → commit. Não pular o "ver falhar".
- Ordem das tasks: preparação → hooks → componentes → telas → shell → PWA → brain. O shell fica depois das telas porque seu teste de fumaça precisa da tela Perfil existir.

---

### Task 1: Preparação — dependências, tema, setup de testes, utilitários de formato

**Files:**
- Create: `app/src/app/tema.css`
- Create: `app/src/test/setup.ts`
- Create: `app/src/test/fixtures.ts`
- Create: `app/src/ui/formato.ts`
- Test: `app/src/ui/formato.test.ts`
- Modify: `app/vite.config.ts` (bloco `test`: `environment: 'jsdom'`, `setupFiles`)
- Modify: `app/package.json` (via `pnpm add`)

**Interfaces:**
- Consumes: `Campo` (`@/dominio/campos`), `Zona` (`@/dominio/metas/tipos`), `DataISO`, `Hora`, `Perfil` (`@/dominio/tipos`).
- Produces (`app/src/ui/formato.ts`):
  ```ts
  export function chaveDe(c: Campo): string;                 // 'dia.passos' → 'passos'
  export function listar(itens: string[]): string;           // ['a','b','c'] → 'a, b e c'
  export const ROTULO_ZONA: Record<Zona, string>;            // pouco→'pouco', atencao→'perto', meta→'na meta', demais→'demais', 'sem-dado'→'sem dado'
  export function horaAgora(agora?: Date): Hora;             // 'HH:MM' local
  export function primeiraSegundaDoMes(d: DataISO): boolean; // segunda-feira com dia ≤ 7
  export function diasEntre(de: DataISO, ate: DataISO): number;
  export function formatarData(d: DataISO): string;          // '2026-09-14' → '14/09/2026'
  ```
- Produces (`app/src/test/fixtures.ts`): `export const PERFIL: Omit<Perfil, 'atualizadoEm'>` (café `diario`, álcool `nao`) e `export const PERFIL_SEM_CAFE` (igual, com `cafe: 'nao'`).

- [ ] **Step 1: Instalar dependências**

Em `app/`:

```bash
pnpm add react-router dexie-react-hooks
pnpm add -D @testing-library/jest-dom vite-plugin-pwa sharp
```

`react-router`, `dexie-react-hooks`, `@testing-library/react`, `jsdom` e `fake-indexeddb` podem já estar instalados pelo plano 01/03 — `pnpm add` é idempotente.

- [ ] **Step 2: Setup de testes e fixtures**

`app/src/test/setup.ts`:

```ts
import 'fake-indexeddb/auto';
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});
```

`app/src/test/fixtures.ts`:

```ts
import type { Perfil } from '@/dominio/tipos';

export const PERFIL: Omit<Perfil, 'atualizadoEm'> = {
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
};

export const PERFIL_SEM_CAFE: Omit<Perfil, 'atualizadoEm'> = { ...PERFIL, cafe: 'nao' };
```

Em `app/vite.config.ts`, garanta que o bloco `test` tenha exatamente estas duas chaves (mantendo o resto que o plano 01 escreveu — `plugins`, `resolve.alias`):

```ts
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
```

Se o plano 01 criou um `vitest.config.ts` separado, faça a mesma alteração nele e não crie outro. Se o plano 03 tinha um `setupFiles` próprio (por exemplo só com `fake-indexeddb/auto`), substitua pelo caminho acima — o novo setup já importa `fake-indexeddb/auto`.

Rode toda a suíte para confirmar que nada dos planos 01–03 quebrou com o jsdom:

```bash
pnpm vitest run
```

Esperado: todos os testes anteriores continuam `passed`.

- [ ] **Step 3: Teste dos utilitários de formato (falha)**

`app/src/ui/formato.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import { chaveDe, listar, ROTULO_ZONA, horaAgora, primeiraSegundaDoMes, diasEntre, formatarData } from './formato';
import type { Campo } from '@/dominio/campos';

const campoPassos: Campo = { id: 'dia.passos', nivel: 1, tipo: 'inteiro', rotulo: 'Passos', desbloqueia: ['seis-mil-passos'] };

describe('formato', () => {
  test('chaveDe tira o prefixo da tabela', () => {
    expect(chaveDe(campoPassos)).toBe('passos');
  });

  test('listar junta com vírgula e "e"', () => {
    expect(listar([])).toBe('');
    expect(listar(['a'])).toBe('a');
    expect(listar(['a', 'b'])).toBe('a e b');
    expect(listar(['a', 'b', 'c'])).toBe('a, b e c');
  });

  test('ROTULO_ZONA cobre as cinco zonas', () => {
    expect(ROTULO_ZONA.meta).toBe('na meta');
    expect(ROTULO_ZONA['sem-dado']).toBe('sem dado');
    expect(ROTULO_ZONA.atencao).toBe('perto');
  });

  test('horaAgora formata com dois dígitos', () => {
    expect(horaAgora(new Date(2026, 8, 14, 7, 5))).toBe('07:05');
  });

  test('primeiraSegundaDoMes', () => {
    expect(primeiraSegundaDoMes('2026-09-07')).toBe(true);  // segunda, dia 7
    expect(primeiraSegundaDoMes('2026-09-14')).toBe(false); // segunda, dia 14
    expect(primeiraSegundaDoMes('2026-09-01')).toBe(false); // terça
  });

  test('diasEntre e formatarData', () => {
    expect(diasEntre('2026-06-22', '2026-09-14')).toBe(84);
    expect(formatarData('2026-09-14')).toBe('14/09/2026');
  });
});
```

- [ ] **Step 4: Rodar e ver falhar**

```bash
pnpm vitest run src/ui/formato.test.ts
```

Esperado: `Error: Failed to resolve import "./formato"`.

- [ ] **Step 5: Implementar `formato.ts`**

`app/src/ui/formato.ts`:

```ts
import type { Campo } from '@/dominio/campos';
import type { Zona } from '@/dominio/metas/tipos';
import type { DataISO, Hora } from '@/dominio/tipos';

/** 'dia.passos' → 'passos' — a chave dentro do objeto da tabela. */
export function chaveDe(c: Campo): string {
  return c.id.slice(c.id.indexOf('.') + 1);
}

/** ['a', 'b', 'c'] → 'a, b e c' */
export function listar(itens: string[]): string {
  if (itens.length <= 1) return itens.join('');
  return `${itens.slice(0, -1).join(', ')} e ${itens[itens.length - 1]}`;
}

export const ROTULO_ZONA: Record<Zona, string> = {
  pouco: 'pouco',
  atencao: 'perto',
  meta: 'na meta',
  demais: 'demais',
  'sem-dado': 'sem dado',
};

export function horaAgora(agora: Date = new Date()): Hora {
  const h = String(agora.getHours()).padStart(2, '0');
  const m = String(agora.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

function aoMeioDia(d: DataISO): Date {
  return new Date(`${d}T12:00:00`);
}

export function primeiraSegundaDoMes(d: DataISO): boolean {
  const dt = aoMeioDia(d);
  return dt.getDay() === 1 && dt.getDate() <= 7;
}

export function diasEntre(de: DataISO, ate: DataISO): number {
  const ms = aoMeioDia(ate).getTime() - aoMeioDia(de).getTime();
  return Math.round(ms / 86_400_000);
}

export function formatarData(d: DataISO): string {
  const [a, m, dia] = d.split('-');
  return `${dia}/${m}/${a}`;
}
```

- [ ] **Step 6: Rodar e ver passar**

```bash
pnpm vitest run src/ui/formato.test.ts
```

Esperado: `✓ src/ui/formato.test.ts (6 tests)` — `Test Files 1 passed`.

- [ ] **Step 7: Tema (tokens, base, layout, nav, formulários)**

`app/src/app/tema.css` — arquivo completo. Todas as cores da app nascem aqui.

```css
/* ---------- tokens ---------- */
:root {
  color-scheme: light;
  --bg: #F5F6F3;
  --surface: #FFFFFF;
  --fg: #1C2421;
  --muted: #5C6763;
  --line: #D7DCD8;
  --ok: #35845A;      --ok-tint: #E4F1E9;
  --weak: #B8690F;    --weak-tint: #F8EEDF;
  --bad: #B23F38;     --bad-tint: #F6E4E2;
  --accent: #2F6B9A;  --accent-tint: #E6EFF6;
  --none-tint: #ECEEEB;
  --sans: "IBM Plex Sans", "Helvetica Neue", Arial, sans-serif;
  --mono: "IBM Plex Mono", "SF Mono", Menlo, Consolas, monospace;
  --raio: 6px;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    color-scheme: dark;
    --bg: #151A18;
    --surface: #1E2522;
    --fg: #E7ECE9;
    --muted: #9AA6A0;
    --line: #2F3935;
    --ok: #7CC49A;      --ok-tint: #1A2B21;
    --weak: #E5A253;    --weak-tint: #2F2519;
    --bad: #E07A72;     --bad-tint: #30201E;
    --accent: #7FB3DE;  --accent-tint: #1B2732;
    --none-tint: #262D2A;
  }
}
:root[data-theme="dark"] {
  color-scheme: dark;
  --bg: #151A18;
  --surface: #1E2522;
  --fg: #E7ECE9;
  --muted: #9AA6A0;
  --line: #2F3935;
  --ok: #7CC49A;      --ok-tint: #1A2B21;
  --weak: #E5A253;    --weak-tint: #2F2519;
  --bad: #E07A72;     --bad-tint: #30201E;
  --accent: #7FB3DE;  --accent-tint: #1B2732;
  --none-tint: #262D2A;
}

/* ---------- base ---------- */
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body {
  margin: 0;
  background: var(--bg);
  color: var(--fg);
  font-family: var(--sans);
  font-size: 15px;
  line-height: 1.5;
  padding-inline: clamp(16px, 4vw, 32px);
  padding-block: 0;
  overflow-x: hidden;
}
h1, h2, h3 { margin: 0; line-height: 1.2; text-wrap: balance; font-weight: 600; }
h1 { font-size: 26px; }
h2 { font-size: 20px; }
h3 { font-size: 17px; }
p { margin: 0; }
a { color: var(--accent); }
.sub { color: var(--muted); max-width: 70ch; }
.mono { font-family: var(--mono); font-variant-numeric: tabular-nums; }
.eyebrow { font-family: var(--mono); font-size: 11px; letter-spacing: .1em; text-transform: uppercase; color: var(--muted); }
.carregando { color: var(--muted); padding-block: 24px; }
.aviso { border: 1px solid var(--weak); background: var(--weak-tint); color: var(--fg); border-radius: var(--raio); padding: 10px 12px; font-size: 13.5px; }
.aviso a { color: inherit; font-weight: 600; }
.erro { color: var(--bad); font-size: 12.5px; margin: 0; }
.sucesso { color: var(--ok); font-size: 13px; }

/* ---------- layout do shell ---------- */
.app { min-height: 100vh; }
.conteudo { max-width: 720px; margin: 0 auto; padding-block: 16px 92px; display: grid; gap: 24px; }
.tela { display: grid; gap: 20px; }
.tela > header { display: grid; gap: 4px; }
.secao { display: grid; gap: 10px; }

.nav {
  position: fixed; inset-inline: 0; bottom: 0; z-index: 10;
  display: grid; grid-template-columns: repeat(5, 1fr);
  background: var(--surface); border-top: 1px solid var(--line);
  padding-bottom: env(safe-area-inset-bottom);
}
.nav a {
  display: grid; place-items: center; gap: 2px;
  padding: 10px 4px; text-decoration: none; color: var(--muted);
  font-family: var(--mono); font-size: 11px; letter-spacing: .04em; text-transform: uppercase;
}
.nav a.ativo { color: var(--accent); box-shadow: inset 0 3px 0 var(--accent); }
.nav a:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }

/* ---------- painéis e cartões genéricos ---------- */
.painel { border: 1px solid var(--line); border-radius: var(--raio); background: var(--surface); padding: 16px; display: grid; gap: 14px; }
.painel .ph { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 8px; }
.painel .ph .k { font-family: var(--mono); font-size: 11px; letter-spacing: .1em; text-transform: uppercase; color: var(--accent); }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 12px 14px; }
.grid-2 { display: grid; grid-template-columns: 1fr; gap: 12px; }
@media (min-width: 640px) { .grid-2 { grid-template-columns: 1fr 1fr; } }

/* ---------- formulários ---------- */
.campo, .field { display: grid; gap: 4px; align-content: start; }
.campo label, .field label, .campo .rotulo { font-size: 13px; color: var(--muted); line-height: 1.3; }
.campo .u { font-family: var(--mono); font-size: 11px; color: var(--muted); }
.campo .ajuda { font-size: 12px; color: var(--muted); }
input, select, textarea {
  font: 15px var(--mono); color: var(--fg); background: var(--bg);
  border: 1px solid var(--line); border-radius: 4px; padding: 8px 10px; width: 100%; max-width: 100%;
}
textarea { font-family: var(--sans); min-height: 72px; resize: vertical; }
input:focus-visible, select:focus-visible, textarea:focus-visible, button:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }
input[type="checkbox"], input[type="radio"] { width: auto; margin: 0 6px 0 0; accent-color: var(--accent); }
.opcoes { display: flex; flex-wrap: wrap; gap: 8px 14px; }
.opcoes label { display: inline-flex; align-items: center; font-size: 14px; color: var(--fg); }

.botao {
  font: 500 14px var(--sans); color: var(--fg); background: var(--surface);
  border: 1px solid var(--line); border-radius: 4px; padding: 9px 14px; cursor: pointer;
  min-height: 40px;
}
.botao:hover { border-color: var(--muted); }
.botao.primario { background: var(--accent); border-color: var(--accent); color: var(--surface); }
.botao.perigo { color: var(--bad); border-color: var(--bad); }
.botao.perigo:disabled { opacity: .5; cursor: not-allowed; }
.botao[aria-pressed="true"] { background: var(--accent-tint); border-color: var(--accent); color: var(--accent); }
.botoes { display: flex; flex-wrap: wrap; gap: 8px; }
.escolha { display: flex; flex-wrap: wrap; gap: 6px; }
.escolha .botao { min-width: 40px; padding: 8px 10px; font-family: var(--mono); }
.ou-nao { display: grid; grid-template-columns: auto 1fr; gap: 8px; align-items: center; }

/* ---------- utilitários ---------- */
.lista-limpa { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
.tabela-scroll { overflow-x: auto; }
table { border-collapse: collapse; font-family: var(--mono); font-size: 13px; width: 100%; }
th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid var(--line); white-space: nowrap; }
th { color: var(--muted); font-weight: 500; font-size: 11px; letter-spacing: .05em; text-transform: uppercase; }
```

- [ ] **Step 8: Commit**

```bash
git -C .. add app/package.json app/pnpm-lock.yaml app/vite.config.ts app/src/app/tema.css app/src/test/setup.ts app/src/test/fixtures.ts app/src/ui/formato.ts app/src/ui/formato.test.ts
git -C .. commit -m "chore: tema, setup de testes de UI e utilitários de formato"
```

---

### Task 2: Hooks `usePerfil`, `useDia`, `useContexto`

**Files:**
- Create: `app/src/ui/hooks/usePerfil.ts`
- Create: `app/src/ui/hooks/useDia.ts`
- Create: `app/src/ui/hooks/useContexto.ts`
- Test: `app/src/ui/hooks/useContexto.test.tsx`

**Interfaces:**
- Consumes: `lerPerfil` (`@/dados/repositorios/perfil`), `lerDia` (`@/dados/repositorios/dia`), `montarContexto` (`@/dados/contexto`), `hojeISO` (`@/dados/datas`), `Contexto` (`@/dominio/metas/tipos`), `Perfil`, `Dia`, `DataISO` (`@/dominio/tipos`), `useLiveQuery` (`dexie-react-hooks`).
- Produces:
  ```ts
  export function usePerfil(): Perfil | undefined;                       // undefined = carregando ou sem perfil
  export function useDia(data: DataISO): Dia | undefined;
  export interface EstadoContexto { ctx: Contexto | undefined; carregando: boolean; semPerfil: boolean; }
  export function useContexto(): EstadoContexto;
  ```

Por que `useLiveQuery(() => montarContexto(hojeISO()), [])` reage a qualquer tabela: `useLiveQuery` observa as consultas Dexie feitas dentro do callback (mesmo através de `await`), e `montarContexto` consulta as sete tabelas. Gravou em qualquer uma, o contexto recalcula.

- [ ] **Step 1: Teste do hook (falha)**

`app/src/ui/hooks/useContexto.test.tsx`:

```tsx
import { beforeEach, describe, expect, test } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useContexto } from './useContexto';
import { usePerfil } from './usePerfil';
import { useDia } from './useDia';
import { salvarPerfil } from '@/dados/repositorios/perfil';
import { salvarDia } from '@/dados/repositorios/dia';
import { apagarTudo } from '@/dados/exportImport';
import { hojeISO } from '@/dados/datas';
import { PERFIL } from '@/test/fixtures';

beforeEach(async () => {
  await apagarTudo();
});

describe('useContexto', () => {
  test('sem perfil → semPerfil; ao salvar perfil, entrega o contexto', async () => {
    const { result } = renderHook(() => useContexto());
    expect(result.current.carregando).toBe(true);

    await waitFor(() => expect(result.current.semPerfil).toBe(true));
    expect(result.current.ctx).toBeUndefined();

    await salvarPerfil(PERFIL);

    await waitFor(() => expect(result.current.ctx?.perfil.peso).toBe(90));
    expect(result.current.semPerfil).toBe(false);
    expect(result.current.carregando).toBe(false);
  });

  test('recalcula quando o dia muda', async () => {
    await salvarPerfil(PERFIL);
    const { result } = renderHook(() => useContexto());
    await waitFor(() => expect(result.current.ctx).toBeDefined());

    await salvarDia(hojeISO(), { passos: 4321 });

    await waitFor(() => expect(result.current.ctx?.hoje?.passos).toBe(4321));
  });
});

describe('usePerfil e useDia', () => {
  test('acompanham as gravações', async () => {
    const perfil = renderHook(() => usePerfil());
    const dia = renderHook(() => useDia(hojeISO()));
    expect(perfil.result.current).toBeUndefined();

    await salvarPerfil(PERFIL);
    await salvarDia(hojeISO(), { copos: 3 });

    await waitFor(() => expect(perfil.result.current?.altura).toBe(175));
    await waitFor(() => expect(dia.result.current?.copos).toBe(3));
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

```bash
pnpm vitest run src/ui/hooks/useContexto.test.tsx
```

Esperado: `Error: Failed to resolve import "./useContexto"`.

- [ ] **Step 3: Implementar os três hooks**

`app/src/ui/hooks/usePerfil.ts`:

```ts
import { useLiveQuery } from 'dexie-react-hooks';
import type { Perfil } from '@/dominio/tipos';
import { lerPerfil } from '@/dados/repositorios/perfil';

/** undefined enquanto carrega ou quando não há perfil. */
export function usePerfil(): Perfil | undefined {
  return useLiveQuery(() => lerPerfil(), []);
}
```

`app/src/ui/hooks/useDia.ts`:

```ts
import { useLiveQuery } from 'dexie-react-hooks';
import type { DataISO, Dia } from '@/dominio/tipos';
import { lerDia } from '@/dados/repositorios/dia';

export function useDia(data: DataISO): Dia | undefined {
  return useLiveQuery(() => lerDia(data), [data]);
}
```

`app/src/ui/hooks/useContexto.ts`:

```ts
import { useLiveQuery } from 'dexie-react-hooks';
import type { Contexto } from '@/dominio/metas/tipos';
import { montarContexto } from '@/dados/contexto';
import { hojeISO } from '@/dados/datas';

export interface EstadoContexto {
  ctx: Contexto | undefined;
  carregando: boolean;
  semPerfil: boolean;
}

/**
 * Recalcula sempre que qualquer tabela muda: useLiveQuery observa todas as
 * consultas Dexie feitas dentro do callback, e montarContexto consulta as sete.
 */
export function useContexto(): EstadoContexto {
  const r = useLiveQuery(() => montarContexto(hojeISO()), []);
  if (r === undefined) return { ctx: undefined, carregando: true, semPerfil: false };
  if ('semPerfil' in r) return { ctx: undefined, carregando: false, semPerfil: true };
  return { ctx: r, carregando: false, semPerfil: false };
}
```

- [ ] **Step 4: Rodar e ver passar**

```bash
pnpm vitest run src/ui/hooks/useContexto.test.tsx
```

Esperado: `✓ src/ui/hooks/useContexto.test.tsx (3 tests)`.

- [ ] **Step 5: Commit**

```bash
git -C .. add app/src/ui/hooks
git -C .. commit -m "feat: hooks usePerfil, useDia e useContexto com useLiveQuery"
```

---

### Task 3: Componentes genéricos — `CampoRegistro`, `BarraZona`, `ConviteRegistro`, `CardAcao`, `CartaoMedida`

**Files:**
- Create: `app/src/ui/componentes/componentes.css`
- Create: `app/src/ui/componentes/CampoRegistro.tsx`
- Create: `app/src/ui/componentes/BarraZona.tsx`
- Create: `app/src/ui/componentes/ConviteRegistro.tsx`
- Create: `app/src/ui/componentes/CardAcao.tsx`
- Create: `app/src/ui/componentes/CartaoMedida.tsx`
- Test: `app/src/ui/componentes/CampoRegistro.test.tsx`
- Test: `app/src/ui/componentes/BarraZona.test.tsx`
- Test: `app/src/ui/componentes/ConviteRegistro.test.tsx`
- Test: `app/src/ui/componentes/CardAcao.test.tsx`
- Test: `app/src/ui/componentes/CartaoMedida.test.tsx`

**Interfaces:**
- Consumes: `Campo`, `CAMPOS`, `validar` (`@/dominio/campos`); `Zona`, `Meta` (`@/dominio/metas/tipos`); `AcaoCatalogo` (`@/dominio/catalogo/tipos`); `catalogo`, `acaoDoCatalogo` (`@/dominio/catalogo`); `MedidaResultado` (`@/dominio/medidas`); `chaveDe`, `listar`, `ROTULO_ZONA`, `formatarData` (`@/ui/formato`); `Link` (`react-router`).
- Produces (props fixas do contrato):
  ```tsx
  <CampoRegistro campo={Campo} valor={unknown} onChange={(v: unknown) => void} />
  <BarraZona zona={Zona} posicao={number | null} />
  <ConviteRegistro campos={Campo[]} />
  <CardAcao acao={AcaoCatalogo} meta={Meta} compacto?={boolean} />
  <CartaoMedida m={MedidaResultado} />
  ```

Regras do `CampoRegistro`, por `campo.tipo`:

| tipo | controle | valor emitido |
|---|---|---|
| `hora` | `<input type="time">` | `"HH:MM"`; vazio → `undefined` |
| `inteiro` / `decimal` | `<input type="number">` com `min`/`max`/`step` e unidade | número; vazio → `undefined` |
| `escala` | botões de `min ?? 1` a `max ?? 5` | número |
| `bool` | botões **Sim** / **Não** | `true` / `false` |
| `texto` | `<textarea>` | string; vazio → `undefined` |
| `hora-ou-nao` | botão **Não tomei** + `<input type="time">` | `null` / `"HH:MM"` / `undefined` |
| `inteiro-ou-nao` | botão **Não bebi** + `<input type="number">` | `null` / número / `undefined` |

Valores concretos passam por `validar(campo, valor)`; se voltar mensagem, ela aparece num `<p role="alert">` e `onChange` **não** é chamado. `null` e `undefined` são estados válidos por definição (spec §3) e não passam por `validar`.

- [ ] **Step 1: Testes dos cinco componentes (falham)**

`app/src/ui/componentes/CampoRegistro.test.tsx`:

```tsx
import { describe, expect, test, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CampoRegistro } from './CampoRegistro';
import type { Campo } from '@/dominio/campos';

const copos: Campo = { id: 'dia.copos', nivel: 2, tipo: 'inteiro', rotulo: 'Copos de água', unidade: 'copos', min: 0, max: 30, desbloqueia: ['beba-pela-sede'] };
const acordei: Campo = { id: 'dia.comoAcordei', nivel: 1, tipo: 'escala', rotulo: 'Como acordei', min: 1, max: 5, desbloqueia: ['durma-7'] };
const fome: Campo = { id: 'dia.fome', nivel: 1, tipo: 'escala', rotulo: 'Fome de ontem', min: 1, max: 10, desbloqueia: ['pergunte-a-fome'] };
const semFome: Campo = { id: 'dia.comiSemFome', nivel: 1, tipo: 'bool', rotulo: 'Comi sem estar com fome?', desbloqueia: ['pergunte-a-fome'] };
const deitou: Campo = { id: 'dia.deitou', nivel: 1, tipo: 'hora', rotulo: 'Deitei às', desbloqueia: ['durma-7'] };
const cafe: Campo = { id: 'dia.ultimoCafe', nivel: 1, tipo: 'hora-ou-nao', rotulo: 'Último café de ontem', desbloqueia: ['ultimo-cafe'] };
const doses: Campo = { id: 'dia.alcoolDoses', nivel: 2, tipo: 'inteiro-ou-nao', rotulo: 'Doses de álcool ontem', min: 0, max: 30, desbloqueia: ['se-beber'] };
const notas: Campo = { id: 'dia.notas', nivel: 3, tipo: 'texto', rotulo: 'Notas', desbloqueia: [] };

describe('CampoRegistro', () => {
  test('inteiro: valor fora da faixa mostra a mensagem e não chama onChange', () => {
    const onChange = vi.fn();
    render(<CampoRegistro campo={copos} valor={undefined} onChange={onChange} />);
    const input = screen.getByLabelText(/Copos de água/);
    fireEvent.change(input, { target: { value: '500' } });
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('alert').textContent).not.toBe('');

    fireEvent.change(input, { target: { value: '12' } });
    expect(onChange).toHaveBeenCalledWith(12);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  test('escala: 5 botões para max 5 e 10 para max 10', () => {
    const onChange = vi.fn();
    const { unmount } = render(<CampoRegistro campo={acordei} valor={undefined} onChange={onChange} />);
    expect(screen.getAllByRole('button')).toHaveLength(5);
    fireEvent.click(screen.getByRole('button', { name: '4' }));
    expect(onChange).toHaveBeenCalledWith(4);
    unmount();

    render(<CampoRegistro campo={fome} valor={7} onChange={onChange} />);
    expect(screen.getAllByRole('button')).toHaveLength(10);
    expect(screen.getByRole('button', { name: '7' })).toHaveAttribute('aria-pressed', 'true');
  });

  test('bool: Sim/Não', () => {
    const onChange = vi.fn();
    render(<CampoRegistro campo={semFome} valor={undefined} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Não' }));
    expect(onChange).toHaveBeenCalledWith(false);
    fireEvent.click(screen.getByRole('button', { name: 'Sim' }));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  test('hora: input time', () => {
    const onChange = vi.fn();
    render(<CampoRegistro campo={deitou} valor={undefined} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText(/Deitei às/), { target: { value: '23:15' } });
    expect(onChange).toHaveBeenCalledWith('23:15');
  });

  test('hora-ou-nao: botão "Não tomei" emite null', () => {
    const onChange = vi.fn();
    render(<CampoRegistro campo={cafe} valor={undefined} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Não tomei' }));
    expect(onChange).toHaveBeenCalledWith(null);
    fireEvent.change(screen.getByLabelText(/Último café de ontem/), { target: { value: '14:00' } });
    expect(onChange).toHaveBeenCalledWith('14:00');
  });

  test('inteiro-ou-nao: botão "Não bebi" emite null', () => {
    const onChange = vi.fn();
    render(<CampoRegistro campo={doses} valor={null} onChange={onChange} />);
    const botao = screen.getByRole('button', { name: 'Não bebi' });
    expect(botao).toHaveAttribute('aria-pressed', 'true');
    fireEvent.change(screen.getByLabelText(/Doses de álcool ontem/), { target: { value: '2' } });
    expect(onChange).toHaveBeenCalledWith(2);
  });

  test('texto: textarea', () => {
    const onChange = vi.fn();
    render(<CampoRegistro campo={notas} valor={undefined} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText(/Notas/), { target: { value: 'dia bom' } });
    expect(onChange).toHaveBeenCalledWith('dia bom');
  });

  test('marca o wrapper com data-campo e data-tipo', () => {
    const { container } = render(<CampoRegistro campo={copos} valor={3} onChange={() => {}} />);
    const el = container.querySelector('[data-campo="dia.copos"]');
    expect(el).not.toBeNull();
    expect(el).toHaveAttribute('data-tipo', 'inteiro');
  });
});
```

`app/src/ui/componentes/BarraZona.test.tsx`:

```tsx
import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BarraZona } from './BarraZona';

describe('BarraZona', () => {
  test('marcador "você" na posição', () => {
    const { container } = render(<BarraZona zona="atencao" posicao={0.4} />);
    expect(screen.getByRole('img', { name: 'Zona: perto' })).toBeInTheDocument();
    const voce = container.querySelector('.voce') as HTMLElement;
    expect(voce.style.left).toBe('40%');
  });

  test('sem-dado: sem marcador e segmentos neutros', () => {
    const { container } = render(<BarraZona zona="sem-dado" posicao={null} />);
    expect(container.querySelector('.voce')).toBeNull();
    expect(container.querySelectorAll('i.nd')).toHaveLength(3);
  });
});
```

`app/src/ui/componentes/ConviteRegistro.test.tsx`:

```tsx
import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConviteRegistro } from './ConviteRegistro';
import type { Campo } from '@/dominio/campos';
import { acaoDoCatalogo } from '@/dominio/catalogo';

const passos: Campo = { id: 'dia.passos', nivel: 1, tipo: 'inteiro', rotulo: 'Passos de ontem', desbloqueia: ['seis-mil-passos'] };
const copos: Campo = { id: 'dia.copos', nivel: 2, tipo: 'inteiro', rotulo: 'Copos de água', desbloqueia: ['beba-pela-sede', 'seis-mil-passos'] };

describe('ConviteRegistro', () => {
  test('frase com rótulos e títulos das ações (sem repetir)', () => {
    render(<ConviteRegistro campos={[passos, copos]} />);
    const t1 = acaoDoCatalogo('seis-mil-passos').titulo;
    const t2 = acaoDoCatalogo('beba-pela-sede').titulo;
    expect(screen.getByText(`Registre passos de ontem e copos de água e eu te digo onde você está em ${t1} e ${t2}.`)).toBeInTheDocument();
  });

  test('sem campos não renderiza nada', () => {
    const { container } = render(<ConviteRegistro campos={[]} />);
    expect(container.innerHTML).toBe('');
  });
});
```

`app/src/ui/componentes/CardAcao.test.tsx`:

```tsx
import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { CardAcao } from './CardAcao';
import type { ReactElement } from 'react';
import { acaoDoCatalogo } from '@/dominio/catalogo';
import type { Meta } from '@/dominio/metas/tipos';

const acao = acaoDoCatalogo('seis-mil-passos');
const meta: Meta = { zona: 'atencao', valor: 3500, faixa: { pouco: 2000, meta: 5000, demais: 10000 }, posicao: 0.4, texto: '3500 passos/dia', proximoPasso: 'meta desta semana: 4500 passos/dia (+1 mil)' };

function renderizar(ui: ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('CardAcao', () => {
  test('mostra título, gatilho, ação mínima, texto da meta e próximo passo', () => {
    renderizar(<CardAcao acao={acao} meta={meta} />);
    expect(screen.getByRole('heading', { name: acao.titulo })).toBeInTheDocument();
    expect(screen.getByText(acao.gatilho)).toBeInTheDocument();
    expect(screen.getByText(acao.acao_minima)).toBeInTheDocument();
    expect(screen.getByText('3500 passos/dia')).toBeInTheDocument();
    expect(screen.getByText(meta.proximoPasso)).toBeInTheDocument();
    expect(screen.getByText(acao.descricao)).toBeInTheDocument();
    expect(screen.getByText(acao.evidencia.fontes)).toBeInTheDocument();
  });

  test('seguranca substitui o próximo passo', () => {
    renderizar(<CardAcao acao={acao} meta={{ ...meta, seguranca: 'Você marcou pressão no perfil — converse com quem te acompanha antes de mudar isso.' }} />);
    expect(screen.getByText(/converse com quem te acompanha/)).toBeInTheDocument();
    expect(screen.queryByText(meta.proximoPasso)).toBeNull();
  });

  test('compacto esconde descrição, afeta e evidência', () => {
    renderizar(<CardAcao acao={acao} meta={meta} compacto />);
    expect(screen.queryByText(acao.descricao)).toBeNull();
    expect(screen.queryByText(acao.afeta.processo)).toBeNull();
    expect(screen.queryByText(acao.evidencia.fontes)).toBeNull();
  });

  test('sem-dado mostra o convite com os campos de precisaDe', () => {
    renderizar(<CardAcao acao={acao} meta={{ zona: 'sem-dado', valor: null, faixa: null, posicao: null, texto: '', proximoPasso: '', precisaDe: ['dia.passos'] }} />);
    expect(screen.getByText(/^Registre .* e eu te digo onde você está em/)).toBeInTheDocument();
  });

  test('deDia aparece quando o valor não é de hoje', () => {
    renderizar(<CardAcao acao={acao} meta={{ ...meta, deDia: '2026-09-12' }} />);
    expect(screen.getByText(/de 12\/09\/2026/)).toBeInTheDocument();
  });
});
```

`app/src/ui/componentes/CartaoMedida.test.tsx`:

```tsx
import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CartaoMedida } from './CartaoMedida';
import type { MedidaResultado } from '@/dominio/medidas';

const imc: MedidaResultado = {
  id: 'imc', valor: 29.4, unidade: '', zona: 'atencao', texto: 'Categoria: sobrepeso.',
  zonas: [{ tom: 'ok', rotulo: '18,5–24,9' }, { tom: 'weak', rotulo: '25–29,9 sobrepeso' }, { tom: 'bad', rotulo: '≥ 30 obesidade' }],
};

describe('CartaoMedida', () => {
  test('título do catálogo, valor, zona e faixas', () => {
    render(<CartaoMedida m={imc} />);
    expect(screen.getByText('IMC')).toBeInTheDocument();
    expect(screen.getByText('29.4')).toBeInTheDocument();
    expect(screen.getByText('perto')).toBeInTheDocument();
    expect(screen.getByText('Categoria: sobrepeso.')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  test('sem valor mostra travessão e "preencha o perfil"', () => {
    render(<CartaoMedida m={{ ...imc, valor: null, zona: 'neutra', texto: '', zonas: [] }} />);
    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.getByText('preencha o perfil')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

```bash
pnpm vitest run src/ui/componentes
```

Esperado: 5 arquivos com `Failed to resolve import`.

- [ ] **Step 3: CSS dos componentes**

`app/src/ui/componentes/componentes.css`:

```css
/* ---------- CampoRegistro ---------- */
.campo .rotulo { display: block; }
.campo .escolha .botao[aria-pressed="true"] { font-weight: 600; }

/* ---------- BarraZona ---------- */
.barra { display: grid; grid-template-columns: 1fr 1fr 1fr; height: 8px; border-radius: 4px; position: relative; margin-block: 6px 22px; }
.barra i { display: block; }
.barra i:first-child { border-radius: 4px 0 0 4px; }
.barra i:last-child { border-radius: 0 4px 4px 0; }
.barra i.p, .barra i.d { background: var(--bad-tint); }
.barra i.i { background: var(--ok); opacity: .55; }
.barra i.nd { background: var(--none-tint); }
.barra .voce { position: absolute; top: -4px; width: 2px; height: 16px; background: var(--fg); border-radius: 1px; transform: translateX(-1px); }
.barra .voce::after { content: "você"; position: absolute; top: 16px; left: 50%; transform: translateX(-50%); font: 9.5px var(--mono); color: var(--muted); white-space: nowrap; }

/* ---------- chips ---------- */
.chips { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; font-family: var(--mono); font-size: 10.5px; color: var(--muted); }
.chip { border: 1px solid currentColor; border-radius: 3px; padding: 0 6px; white-space: nowrap; }
.chip.ev { color: var(--ok); }
.chip.st.meta { color: var(--ok); background: var(--ok-tint); }
.chip.st.atencao { color: var(--weak); background: var(--weak-tint); }
.chip.st.pouco, .chip.st.demais { color: var(--bad); background: var(--bad-tint); }
.chip.st.sem-dado { color: var(--muted); border-style: dashed; }

/* ---------- CardAcao ---------- */
.card { border: 1px solid var(--line); border-radius: var(--raio); background: var(--surface); display: grid; align-content: start; }
.card.zona-sem-dado { border-style: dashed; }
.card.zona-sem-dado h3 { color: var(--muted); }
.card-top { padding: 14px 16px 8px; display: grid; gap: 6px; }
.card .faixa { padding: 8px 16px 12px; border-top: 1px solid var(--line); display: grid; gap: 8px; }
.card .voce-texto { font-size: 13.5px; }
.card .voce-texto b { font-family: var(--mono); font-size: 10.5px; letter-spacing: .05em; text-transform: uppercase; color: var(--muted); font-weight: 500; }
.card .de-dia { color: var(--muted); font-size: 12px; }
.card .prox { font-size: 13.5px; background: var(--accent-tint); border-radius: 4px; padding: 7px 10px; }
.card .prox::before { content: "próximo passo · "; font-family: var(--mono); font-size: 10px; letter-spacing: .05em; text-transform: uppercase; color: var(--accent); }
.card .seguranca { font-size: 13.5px; background: var(--bad-tint); color: var(--bad); border-radius: 4px; padding: 7px 10px; }
.card .seguranca::before { content: "segurança · "; font-family: var(--mono); font-size: 10px; letter-spacing: .05em; text-transform: uppercase; }
.card .perfil-falta { font-size: 13px; color: var(--muted); }
.card .gat { padding: 10px 16px; border-top: 1px solid var(--line); font-size: 13.5px; display: grid; gap: 4px; }
.card .gat b { font-family: var(--mono); font-size: 10.5px; letter-spacing: .05em; text-transform: uppercase; color: var(--weak); font-weight: 500; }
.card .descricao { padding: 10px 16px; border-top: 1px solid var(--line); font-size: 13.5px; }
.card .ipo { display: grid; grid-template-columns: 1fr; gap: 8px; padding: 0 16px 12px; }
@media (min-width: 560px) { .card .ipo { grid-template-columns: repeat(3, 1fr); } }
.card .ipo div { border-radius: 4px; padding: 8px 10px; font-size: 12.5px; }
.card .ipo .a { background: var(--accent-tint); }
.card .ipo .b { background: var(--weak-tint); }
.card .ipo .c { background: var(--ok-tint); }
.card .ipo div b { display: block; font-family: var(--mono); font-size: 10px; letter-spacing: .06em; text-transform: uppercase; font-weight: 500; margin-bottom: 2px; }
.card .ipo .a b { color: var(--accent); }
.card .ipo .b b { color: var(--weak); }
.card .ipo .c b { color: var(--ok); }
.card details { border-top: 1px solid var(--line); }
.card summary { cursor: pointer; padding: 10px 16px; font-family: var(--mono); font-size: 11.5px; letter-spacing: .05em; text-transform: uppercase; color: var(--muted); list-style: none; display: flex; justify-content: space-between; }
.card summary::-webkit-details-marker { display: none; }
.card summary::after { content: "+"; }
.card details[open] summary::after { content: "−"; }
.card .det { padding: 0 16px 14px; display: grid; gap: 8px; font-size: 13.5px; }
.card .det .seg { color: var(--bad); }

/* ---------- ConviteRegistro ---------- */
.convite { font-size: 13.5px; color: var(--muted); border-left: 3px solid var(--accent); padding-left: 10px; }

/* ---------- CartaoMedida ---------- */
.med { border: 1px solid var(--line); border-radius: var(--raio); background: var(--surface); padding: 14px 16px; display: grid; gap: 8px; align-content: start; }
.med .t { font-weight: 600; font-size: 16px; line-height: 1.2; display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
.med .ev { font-family: var(--mono); font-size: 10px; color: var(--muted); font-weight: 400; }
.med .big { font-family: var(--mono); font-size: 26px; font-weight: 500; line-height: 1; font-variant-numeric: tabular-nums; }
.med .big small { font-size: 12px; color: var(--muted); font-weight: 400; margin-left: 4px; }
.med .st { font-family: var(--mono); font-size: 11px; }
.med .st.meta { color: var(--ok); }
.med .st.atencao { color: var(--weak); }
.med .st.pouco, .med .st.demais { color: var(--bad); }
.med .st.neutra, .med .st.sem-dado { color: var(--muted); }
.med .meta-l { font-size: 13px; }
.med .zonas-m { list-style: none; margin: 0; padding: 0; display: grid; gap: 2px; font-size: 12.5px; }
.med .zonas-m li { display: grid; grid-template-columns: 8px 1fr; gap: 8px; align-items: baseline; }
.med .zonas-m i { width: 8px; height: 8px; border-radius: 2px; transform: translateY(1px); }
.med .zonas-m i.ok { background: var(--ok); }
.med .zonas-m i.weak { background: var(--weak); }
.med .zonas-m i.bad { background: var(--bad); }
.med details { border-top: 1px dashed var(--line); }
.med summary { cursor: pointer; font-family: var(--mono); font-size: 10.5px; letter-spacing: .05em; text-transform: uppercase; color: var(--muted); padding-top: 8px; }
.med .how { font-size: 12.5px; color: var(--muted); padding-top: 6px; }
.med .how b { font-family: var(--mono); font-size: 10px; letter-spacing: .05em; text-transform: uppercase; font-weight: 500; }
```

- [ ] **Step 4: `CampoRegistro`**

`app/src/ui/componentes/CampoRegistro.tsx`:

```tsx
import { useState, type ReactNode } from 'react';
import type { Campo } from '@/dominio/campos';
import { validar } from '@/dominio/campos';
import './componentes.css';

export interface CampoRegistroProps {
  campo: Campo;
  valor: unknown;
  onChange: (v: unknown) => void;
}

function textoDe(valor: unknown): string {
  return valor === undefined || valor === null ? '' : String(valor);
}

export function CampoRegistro({ campo, valor, onChange }: CampoRegistroProps) {
  const id = `campo-${campo.id.replace('.', '-')}`;
  const [erro, setErro] = useState<string | null>(null);

  // Texto local para inputs numéricos: um valor inválido fica visível (com a
  // mensagem) sem ser gravado; quando a prop muda de fora, o texto acompanha.
  const [texto, setTexto] = useState(textoDe(valor));
  const [valorAnterior, setValorAnterior] = useState(valor);
  if (valor !== valorAnterior) {
    setValorAnterior(valor);
    if (valor !== undefined && valor !== null) setTexto(String(valor));
  }

  /** Estados "não registrou" (undefined) e "não se aplica" (null) não passam por validar. */
  function emitir(v: unknown) {
    if (v === undefined || v === null) {
      setErro(null);
      onChange(v);
      return;
    }
    const msg = validar(campo, v);
    setErro(msg);
    if (msg === null) onChange(v);
  }

  function emitirNumero(t: string) {
    setTexto(t);
    if (t.trim() === '') {
      emitir(undefined);
      return;
    }
    const n = campo.tipo === 'inteiro' || campo.tipo === 'inteiro-ou-nao'
      ? parseInt(t, 10)
      : parseFloat(t.replace(',', '.'));
    if (Number.isNaN(n)) {
      setErro('Digite um número.');
      return;
    }
    emitir(n);
  }

  const rotulo = (
    <>
      {campo.rotulo}
      {campo.unidade && <span className="u"> {campo.unidade}</span>}
    </>
  );

  const numero = (
    <input
      id={id}
      type="number"
      inputMode="decimal"
      min={campo.min}
      max={campo.max}
      step={campo.tipo === 'decimal' ? 0.1 : 1}
      value={texto}
      onChange={(e) => emitirNumero(e.target.value)}
    />
  );

  const hora = (
    <input
      id={id}
      type="time"
      value={typeof valor === 'string' ? valor : ''}
      onChange={(e) => emitir(e.target.value === '' ? undefined : e.target.value)}
    />
  );

  let controle: ReactNode;
  let usaLabel = true;

  switch (campo.tipo) {
    case 'hora':
      controle = hora;
      break;
    case 'inteiro':
    case 'decimal':
      controle = numero;
      break;
    case 'texto':
      controle = (
        <textarea
          id={id}
          value={typeof valor === 'string' ? valor : ''}
          onChange={(e) => emitir(e.target.value === '' ? undefined : e.target.value)}
        />
      );
      break;
    case 'escala': {
      usaLabel = false;
      const de = campo.min ?? 1;
      const ate = campo.max ?? 5;
      const opcoes: number[] = [];
      for (let n = de; n <= ate; n++) opcoes.push(n);
      controle = (
        <div className="escolha" role="group" aria-labelledby={id}>
          {opcoes.map((n) => (
            <button key={n} type="button" className="botao" aria-pressed={valor === n} onClick={() => emitir(n)}>
              {n}
            </button>
          ))}
        </div>
      );
      break;
    }
    case 'bool':
      usaLabel = false;
      controle = (
        <div className="escolha" role="group" aria-labelledby={id}>
          <button type="button" className="botao" aria-pressed={valor === true} onClick={() => emitir(true)}>Sim</button>
          <button type="button" className="botao" aria-pressed={valor === false} onClick={() => emitir(false)}>Não</button>
        </div>
      );
      break;
    case 'hora-ou-nao':
      controle = (
        <div className="ou-nao">
          <button type="button" className="botao" aria-pressed={valor === null} onClick={() => emitir(null)}>Não tomei</button>
          {hora}
        </div>
      );
      break;
    case 'inteiro-ou-nao':
      controle = (
        <div className="ou-nao">
          <button type="button" className="botao" aria-pressed={valor === null} onClick={() => emitir(null)}>Não bebi</button>
          {numero}
        </div>
      );
      break;
  }

  return (
    <div className="campo" data-campo={campo.id} data-tipo={campo.tipo}>
      {usaLabel ? <label htmlFor={id}>{rotulo}</label> : <span className="rotulo" id={id}>{rotulo}</span>}
      {controle}
      {campo.ajuda && <small className="ajuda">{campo.ajuda}</small>}
      {erro && <p className="erro" role="alert">{erro}</p>}
    </div>
  );
}
```

- [ ] **Step 5: `BarraZona` e `ConviteRegistro`**

`app/src/ui/componentes/BarraZona.tsx`:

```tsx
import type { Zona } from '@/dominio/metas/tipos';
import { ROTULO_ZONA } from '@/ui/formato';
import './componentes.css';

export interface BarraZonaProps {
  zona: Zona;
  posicao: number | null;
}

export function BarraZona({ zona, posicao }: BarraZonaProps) {
  const semDado = zona === 'sem-dado';
  const mostraMarcador = posicao !== null && !semDado;
  const pct = mostraMarcador ? Math.round(Math.min(1, Math.max(0, posicao)) * 100) : 0;
  return (
    <div className={`barra zona-${zona}`} role="img" aria-label={`Zona: ${ROTULO_ZONA[zona]}`}>
      <i className={semDado ? 'nd' : 'p'} />
      <i className={semDado ? 'nd' : 'i'} />
      <i className={semDado ? 'nd' : 'd'} />
      {mostraMarcador && <span className="voce" style={{ left: `${pct}%` }} />}
    </div>
  );
}
```

`app/src/ui/componentes/ConviteRegistro.tsx`:

```tsx
import type { Campo } from '@/dominio/campos';
import type { AcaoId } from '@/dominio/catalogo/tipos';
import { acaoDoCatalogo } from '@/dominio/catalogo';
import { listar } from '@/ui/formato';
import './componentes.css';

export interface ConviteRegistroProps {
  campos: Campo[];
}

/** "Registre X e Y e eu te digo onde você está em A e B." (ADR-002) */
export function ConviteRegistro({ campos }: ConviteRegistroProps) {
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
```

- [ ] **Step 6: `CardAcao` e `CartaoMedida`**

`app/src/ui/componentes/CardAcao.tsx`:

```tsx
import { Link } from 'react-router';
import type { AcaoCatalogo } from '@/dominio/catalogo/tipos';
import type { Meta } from '@/dominio/metas/tipos';
import type { Campo } from '@/dominio/campos';
import { CAMPOS } from '@/dominio/campos';
import { BarraZona } from './BarraZona';
import { ConviteRegistro } from './ConviteRegistro';
import { ROTULO_ZONA, formatarData } from '@/ui/formato';
import './componentes.css';

export interface CardAcaoProps {
  acao: AcaoCatalogo;
  meta: Meta;
  compacto?: boolean;
}

export function CardAcao({ acao, meta, compacto = false }: CardAcaoProps) {
  const semDado = meta.zona === 'sem-dado';
  const precisaDe = meta.precisaDe ?? [];
  const camposFaltando = precisaDe
    .map((id) => CAMPOS.find((c) => c.id === id))
    .filter((c): c is Campo => c !== undefined);
  const faltaPerfil = precisaDe.some((id) => id.startsWith('perfil.'));

  return (
    <article className={`card zona-${meta.zona}${compacto ? ' compacto' : ''}`} data-acao={acao.id}>
      <header className="card-top">
        <h3>{acao.titulo}</h3>
        <div className="chips">
          <span className={`chip st ${meta.zona}`}>{ROTULO_ZONA[meta.zona]}</span>
          <span className="chip ev">{acao.evidencia.grau}</span>
        </div>
      </header>

      <div className="faixa">
        <BarraZona zona={meta.zona} posicao={meta.posicao} />
        {semDado ? (
          <>
            <ConviteRegistro campos={camposFaltando} />
            {faltaPerfil && (
              <p className="perfil-falta">
                <Link to="/perfil">Complete o perfil</Link> para esta ação ter meta.
              </p>
            )}
          </>
        ) : (
          <>
            <p className="voce-texto">
              <b>você · </b>{meta.texto}
              {meta.deDia && <span className="de-dia"> · de {formatarData(meta.deDia)}</span>}
            </p>
            {meta.seguranca ? <p className="seguranca">{meta.seguranca}</p> : <p className="prox">{meta.proximoPasso}</p>}
          </>
        )}
      </div>

      <div className="gat">
        <div><b>gatilho</b> · <span>{acao.gatilho}</span></div>
        <div><b>2 minutos</b> · <span>{acao.acao_minima}</span></div>
      </div>

      {!compacto && (
        <>
          <p className="descricao">{acao.descricao}</p>
          <div className="ipo">
            <div className="a"><b>input</b>{acao.afeta.input}</div>
            <div className="b"><b>processo</b>{acao.afeta.processo}</div>
            <div className="c"><b>output</b>{acao.afeta.output}</div>
          </div>
          <details>
            <summary>Evidência · {acao.evidencia.grau}</summary>
            <div className="det">
              <p>{acao.evidencia.fontes}</p>
              <p><b>Sinal de progresso:</b> {acao.sinal.output} — {acao.sinal.prazo}</p>
              {acao.seguranca && <p className="seg">{acao.seguranca}</p>}
            </div>
          </details>
        </>
      )}
    </article>
  );
}
```

`app/src/ui/componentes/CartaoMedida.tsx`:

```tsx
import type { MedidaResultado } from '@/dominio/medidas';
import { catalogo } from '@/dominio/catalogo';
import { ROTULO_ZONA } from '@/ui/formato';
import './componentes.css';

export interface CartaoMedidaProps {
  m: MedidaResultado;
}

export function CartaoMedida({ m }: CartaoMedidaProps) {
  const cat = catalogo.medidas.find((x) => x.id === m.id);
  const neutra = m.zona === 'neutra';
  const status = neutra ? (m.valor === null ? 'preencha o perfil' : 'referência') : ROTULO_ZONA[m.zona];
  return (
    <div className={`med zona-${m.zona}`} data-medida={m.id}>
      <div className="t">
        <span>{cat?.titulo ?? m.id}</span>
        {cat && <span className="ev">{cat.grau}</span>}
      </div>
      <div className="big">
        {m.valor === null ? '—' : m.valor}
        {m.unidade && <small>{m.unidade}</small>}
      </div>
      <div className={`st ${m.zona}`}>{status}</div>
      {m.texto && <p className="meta-l">{m.texto}</p>}
      {m.zonas.length > 0 && (
        <ul className="zonas-m">
          {m.zonas.map((z, i) => (
            <li key={i}><i className={z.tom} />{z.rotulo}</li>
          ))}
        </ul>
      )}
      {cat && (
        <details>
          <summary>como · para quê</summary>
          <div className="how">
            <b>como</b> {cat.como}<br />
            <b>para quê</b> {cat.para_que}<br />
            <b>muda em</b> {cat.muda}<br />
            <span className="ev">{cat.fontes}</span>
          </div>
        </details>
      )}
    </div>
  );
}
```

- [ ] **Step 7: Rodar e ver passar**

```bash
pnpm vitest run src/ui/componentes
```

Esperado: `Test Files 5 passed` (CampoRegistro 8, BarraZona 2, ConviteRegistro 2, CardAcao 5, CartaoMedida 2).

- [ ] **Step 8: Commit**

```bash
git -C .. add app/src/ui/componentes
git -C .. commit -m "feat: componentes CampoRegistro, BarraZona, ConviteRegistro, CardAcao e CartaoMedida"
```

---

### Task 4: Tela Perfil

**Files:**
- Create: `app/src/ui/telas/telas.css` (CSS de **todas** as telas, escrito de uma vez aqui para não editar o arquivo em cada task seguinte)
- Create: `app/src/ui/telas/Perfil.tsx`
- Test: `app/src/ui/telas/Perfil.test.tsx`

**Interfaces:**
- Consumes: `Perfil`, `Sexo`, `Hora` (`@/dominio/tipos`); `camposDe` (`@/dominio/campos`); `derivar` (`@/dominio/derivados`); `medidas` (`@/dominio/medidas`); `Contexto` (`@/dominio/metas/tipos`); `lerPerfil` via `usePerfil` (`@/ui/hooks/usePerfil`); `salvarPerfil` (`@/dados/repositorios/perfil`); `hojeISO` (`@/dados/datas`); `CartaoMedida`; `chaveDe`; `useNavigate` (`react-router`).
- Produces: `export function Perfil(): JSX.Element` (rota `/perfil`, heading "Seu perfil").

Comportamento: formulário com todos os campos de `Perfil`. Enquanto a pessoa digita, monta um `Contexto` local (perfil do form, dias/eventos/refeições vazios, `derivar(...)`) e mostra `medidas(ctx)` ao vivo. Os checkboxes de `examesQueTem` vêm de `camposDe('exame', perfil)` — a lista de exames não é digitada na tela. "Salvar perfil" chama `salvarPerfil` e navega para `/`.

- [ ] **Step 1: Teste (falha)**

`app/src/ui/telas/Perfil.test.tsx`:

```tsx
import { beforeEach, describe, expect, test } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { Perfil } from './Perfil';
import { lerPerfil } from '@/dados/repositorios/perfil';
import { apagarTudo } from '@/dados/exportImport';

beforeEach(async () => {
  await apagarTudo();
});

describe('Perfil', () => {
  test('preencher e salvar grava o perfil', async () => {
    const { container } = render(<MemoryRouter><Perfil /></MemoryRouter>);
    expect(screen.getByRole('heading', { name: 'Seu perfil' })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Peso (kg)'), { target: { value: '90' } });
    fireEvent.change(screen.getByLabelText('Altura (cm)'), { target: { value: '175' } });
    fireEvent.change(screen.getByLabelText('Idade (anos)'), { target: { value: '40' } });
    fireEvent.click(screen.getByLabelText('Homem'));
    fireEvent.change(screen.getByLabelText('Hora que levanta'), { target: { value: '06:30' } });
    fireEvent.change(screen.getByLabelText('Hora que deita'), { target: { value: '23:30' } });
    fireEvent.change(screen.getByLabelText('Café ou chá com cafeína'), { target: { value: 'diario' } });
    fireEvent.change(screen.getByLabelText('Álcool'), { target: { value: 'nao' } });
    fireEvent.click(screen.getByLabelText('Pressão'));
    fireEvent.change(screen.getByLabelText('Fuma?'), { target: { value: 'nao' } });

    // medidas ao vivo: IMC aparece com os números digitados (90 / 1,75² = 29,4)
    await waitFor(() => expect(container.querySelector('[data-medida="imc"] .big')?.textContent).toContain('29.4'));

    fireEvent.click(screen.getByRole('button', { name: 'Salvar perfil' }));

    await waitFor(async () => {
      const p = await lerPerfil();
      expect(p?.peso).toBe(90);
      expect(p?.altura).toBe(175);
      expect(p?.idade).toBe(40);
      expect(p?.cafe).toBe('diario');
      expect(p?.remedios).toEqual(['pressao']);
    });
  });

  test('não salva sem peso, altura e idade', () => {
    render(<MemoryRouter><Perfil /></MemoryRouter>);
    expect(screen.getByRole('button', { name: 'Salvar perfil' })).toBeDisabled();
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

```bash
pnpm vitest run src/ui/telas/Perfil.test.tsx
```

Esperado: `Failed to resolve import "./Perfil"`.

- [ ] **Step 3: CSS de todas as telas**

`app/src/ui/telas/telas.css`:

```css
/* ---------- comum ---------- */
.tela .medidas { display: grid; grid-template-columns: 1fr; gap: 12px; }
@media (min-width: 560px) { .tela .medidas { grid-template-columns: 1fr 1fr; } }
.tela .cards { display: grid; grid-template-columns: 1fr; gap: 12px; }
@media (min-width: 720px) { .tela .cards { grid-template-columns: 1fr 1fr; } }
.tela .grupo-h { display: flex; align-items: baseline; gap: 12px; }
.tela .grupo-h .n { font-family: var(--mono); font-size: 11px; color: var(--muted); }

/* ---------- Perfil ---------- */
.perfil form { display: grid; gap: 18px; }
.perfil fieldset { border: 1px solid var(--line); border-radius: var(--raio); padding: 12px 14px 14px; margin: 0; display: grid; gap: 12px; background: var(--surface); }
.perfil legend { font-family: var(--mono); font-size: 11px; letter-spacing: .1em; text-transform: uppercase; color: var(--accent); padding: 0 4px; }

/* ---------- Hoje ---------- */
.hoje .eventos { display: flex; flex-wrap: wrap; gap: 8px; }
.hoje .eventos .botao { flex: 1 1 100px; }
.hoje .mini-form { display: grid; gap: 12px; }
.hoje .parado { display: grid; grid-template-columns: auto 1fr; gap: 14px; align-items: center; }
.hoje .parado .n { font-family: var(--mono); font-size: 40px; font-weight: 500; line-height: 1; }
.hoje .parado .n small { display: block; font-size: 11px; color: var(--muted); letter-spacing: .05em; text-transform: uppercase; font-weight: 400; margin-top: 2px; }
.hoje .parado.zona-pouco .n { color: var(--bad); }
.hoje .parado.zona-atencao .n { color: var(--weak); }
.hoje .parado.zona-meta .n { color: var(--ok); }
.hoje .levantadas { font-family: var(--mono); font-size: 12px; color: var(--muted); }

/* ---------- Ações ---------- */
.acoes .habitos { display: grid; grid-template-columns: 1fr; gap: 12px; }
@media (min-width: 720px) { .acoes .habitos { grid-template-columns: 1fr 1fr; } }
.hab { border: 1px dashed var(--line); border-radius: var(--raio); padding: 14px 16px; display: grid; gap: 6px; font-size: 13.5px; }
.hab .t { font-weight: 600; font-size: 16px; }
.hab b { font-family: var(--mono); font-size: 10.5px; letter-spacing: .05em; text-transform: uppercase; color: var(--weak); font-weight: 500; }
.hab p { color: var(--muted); }

/* ---------- Segunda / Exames ---------- */
.segunda .leitura { font-family: var(--mono); font-size: 13px; color: var(--muted); }
.segunda .leitura b { color: var(--fg); font-weight: 500; }

/* ---------- Tendências ---------- */
.tendencias .frases { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
.tendencias .frases li { border: 1px solid var(--line); border-radius: var(--raio); background: var(--surface); padding: 12px 14px; display: grid; gap: 4px; }
.tendencias .frases .n { font-family: var(--mono); font-size: 11px; color: var(--muted); }
.tendencias .baseline { font-family: var(--mono); font-size: 12px; color: var(--muted); }

/* ---------- Ajustes ---------- */
.ajustes textarea { font-family: var(--mono); font-size: 12px; min-height: 140px; }
.ajustes .fronteira { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
.ajustes .fronteira li { border: 1px dashed var(--line); border-radius: var(--raio); padding: 12px 14px; display: grid; gap: 4px; }
.ajustes .fronteira .t { font-weight: 600; }
.ajustes .fronteira p { font-size: 13.5px; color: var(--muted); }
```

- [ ] **Step 4: Implementar `Perfil.tsx`**

`app/src/ui/telas/Perfil.tsx`:

```tsx
import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import type { Perfil as PerfilTipo, Sexo, Hora } from '@/dominio/tipos';
import type { Contexto } from '@/dominio/metas/tipos';
import { camposDe } from '@/dominio/campos';
import { derivar } from '@/dominio/derivados';
import { medidas } from '@/dominio/medidas';
import { salvarPerfil } from '@/dados/repositorios/perfil';
import { hojeISO } from '@/dados/datas';
import { usePerfil } from '@/ui/hooks/usePerfil';
import { CartaoMedida } from '@/ui/componentes/CartaoMedida';
import { chaveDe } from '@/ui/formato';
import './telas.css';

type PerfilSemData = Omit<PerfilTipo, 'atualizadoEm'>;

interface Form {
  peso: string;
  altura: string;
  idade: string;
  sexo: Sexo;
  levantar: Hora;
  deitar: Hora;
  cafe: PerfilTipo['cafe'];
  alcool: PerfilTipo['alcool'];
  remedios: PerfilTipo['remedios'];
  fuma: PerfilTipo['fuma'];
  parouEm: string;
  examesQueTem: string[];
}

const FORM_VAZIO: Form = {
  peso: '', altura: '', idade: '', sexo: 'H', levantar: '06:30', deitar: '23:00',
  cafe: 'diario', alcool: 'nao', remedios: [], fuma: 'nao', parouEm: '', examesQueTem: [],
};

const REMEDIOS: Array<{ id: PerfilTipo['remedios'][number]; rotulo: string }> = [
  { id: 'glicemia', rotulo: 'Glicemia ou diabetes' },
  { id: 'pressao', rotulo: 'Pressão' },
  { id: 'tireoide', rotulo: 'Tireoide' },
  { id: 'outro', rotulo: 'Outro de uso contínuo' },
];

function deFormato(p: PerfilTipo): Form {
  return {
    peso: String(p.peso), altura: String(p.altura), idade: String(p.idade), sexo: p.sexo,
    levantar: p.levantar, deitar: p.deitar, cafe: p.cafe, alcool: p.alcool, remedios: p.remedios,
    fuma: p.fuma, parouEm: p.parouEm ?? '', examesQueTem: p.examesQueTem,
  };
}

/** null quando peso/altura/idade ainda não são números válidos. */
function paraPerfil(f: Form): PerfilSemData | null {
  const peso = parseFloat(f.peso.replace(',', '.'));
  const altura = parseFloat(f.altura.replace(',', '.'));
  const idade = parseInt(f.idade, 10);
  if (!(peso > 0) || !(altura > 0) || !(idade > 0)) return null;
  if (f.levantar === '' || f.deitar === '') return null;
  return {
    peso, altura, idade, sexo: f.sexo, levantar: f.levantar, deitar: f.deitar,
    cafe: f.cafe, alcool: f.alcool, remedios: f.remedios, fuma: f.fuma,
    ...(f.fuma === 'parou' && f.parouEm !== '' ? { parouEm: f.parouEm } : {}),
    examesQueTem: f.examesQueTem,
  };
}

const PERFIL_BASE: PerfilTipo = {
  peso: 0, altura: 0, idade: 0, sexo: 'H', levantar: '06:30', deitar: '23:00', cafe: 'nao',
  alcool: 'nao', remedios: [], fuma: 'nao', examesQueTem: [], atualizadoEm: '',
};

function alternar<T>(lista: T[], item: T): T[] {
  return lista.includes(item) ? lista.filter((x) => x !== item) : [...lista, item];
}

export function Perfil() {
  const salvo = usePerfil();
  const navigate = useNavigate();
  const [form, setForm] = useState<Form>(FORM_VAZIO);
  const [carregado, setCarregado] = useState(false);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (salvo && !carregado) {
      setForm(deFormato(salvo));
      setCarregado(true);
    }
  }, [salvo, carregado]);

  const parcial = paraPerfil(form);
  const perfilTmp: PerfilTipo = parcial ? { ...parcial, atualizadoEm: '' } : PERFIL_BASE;
  const hoje = hojeISO();
  const ctx: Contexto | null = parcial
    ? {
        perfil: perfilTmp, hoje: undefined, dias: [], eventos: [], refeicoes: [], semana: undefined, mes: undefined,
        derivados: derivar(perfilTmp, [], [], undefined, hoje), agora: new Date(),
      }
    : null;
  const medidasAoVivo = ctx ? medidas(ctx) : [];
  const examesOpcoes = camposDe('exame', perfilTmp).map((c) => ({ id: chaveDe(c), rotulo: c.rotulo }));

  function campo<K extends keyof Form>(k: K, v: Form[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function salvar(e: FormEvent) {
    e.preventDefault();
    if (!parcial) return;
    setSalvando(true);
    await salvarPerfil(parcial);
    setSalvando(false);
    navigate('/');
  }

  return (
    <section className="tela perfil">
      <header>
        <p className="eyebrow">uma vez · editável depois</p>
        <h1>Seu perfil</h1>
        <p className="sub">Só o que as fórmulas precisam. Fica neste aparelho; nada sai daqui.</p>
      </header>

      <form onSubmit={salvar}>
        <fieldset>
          <legend>Corpo</legend>
          <div className="grid">
            <div className="field">
              <label htmlFor="p-peso">Peso (kg)</label>
              <input id="p-peso" type="number" inputMode="decimal" step="0.1" min="20" max="400" value={form.peso} onChange={(e) => campo('peso', e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="p-altura">Altura (cm)</label>
              <input id="p-altura" type="number" inputMode="numeric" min="100" max="250" value={form.altura} onChange={(e) => campo('altura', e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="p-idade">Idade (anos)</label>
              <input id="p-idade" type="number" inputMode="numeric" min="10" max="120" value={form.idade} onChange={(e) => campo('idade', e.target.value)} />
            </div>
          </div>
          <div className="opcoes" role="radiogroup" aria-label="Sexo (só para as fórmulas)">
            <label><input type="radio" name="sexo" checked={form.sexo === 'H'} onChange={() => campo('sexo', 'H')} />Homem</label>
            <label><input type="radio" name="sexo" checked={form.sexo === 'M'} onChange={() => campo('sexo', 'M')} />Mulher</label>
          </div>
        </fieldset>

        <fieldset>
          <legend>Ritmo</legend>
          <div className="grid">
            <div className="field">
              <label htmlFor="p-levantar">Hora que levanta</label>
              <input id="p-levantar" type="time" value={form.levantar} onChange={(e) => campo('levantar', e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="p-deitar">Hora que deita</label>
              <input id="p-deitar" type="time" value={form.deitar} onChange={(e) => campo('deitar', e.target.value)} />
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>Hábitos</legend>
          <div className="grid">
            <div className="field">
              <label htmlFor="p-cafe">Café ou chá com cafeína</label>
              <select id="p-cafe" value={form.cafe} onChange={(e) => campo('cafe', e.target.value as Form['cafe'])}>
                <option value="nao">Não tomo</option>
                <option value="as-vezes">Às vezes</option>
                <option value="diario">Todo dia</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="p-alcool">Álcool</label>
              <select id="p-alcool" value={form.alcool} onChange={(e) => campo('alcool', e.target.value as Form['alcool'])}>
                <option value="nao">Não bebo</option>
                <option value="as-vezes">Às vezes</option>
                <option value="regular">Regularmente</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="p-fuma">Fuma?</label>
              <select id="p-fuma" value={form.fuma} onChange={(e) => campo('fuma', e.target.value as Form['fuma'])}>
                <option value="nao">Não</option>
                <option value="sim">Sim</option>
                <option value="parou">Parei</option>
              </select>
            </div>
            {form.fuma === 'parou' && (
              <div className="field">
                <label htmlFor="p-parouEm">Parou em</label>
                <input id="p-parouEm" type="date" value={form.parouEm} onChange={(e) => campo('parouEm', e.target.value)} />
              </div>
            )}
          </div>
        </fieldset>

        <fieldset>
          <legend>Remédios de uso contínuo</legend>
          <p className="sub">Não muda nenhuma meta — só troca o próximo passo por "converse com quem te acompanha" onde faz diferença.</p>
          <div className="opcoes">
            {REMEDIOS.map((r) => (
              <label key={r.id}>
                <input type="checkbox" checked={form.remedios.includes(r.id)} onChange={() => campo('remedios', alternar(form.remedios, r.id))} />
                {r.rotulo}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>Exames que você costuma ter</legend>
          <p className="sub">Só para saber o que pedir na tela de exames.</p>
          <div className="opcoes">
            {examesOpcoes.map((ex) => (
              <label key={ex.id}>
                <input type="checkbox" checked={form.examesQueTem.includes(ex.id)} onChange={() => campo('examesQueTem', alternar(form.examesQueTem, ex.id))} />
                {ex.rotulo}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="botoes">
          <button type="submit" className="botao primario" disabled={!parcial || salvando}>Salvar perfil</button>
        </div>
      </form>

      <section className="secao">
        <h2>Medidas</h2>
        <p className="sub">Calculadas com o que você digitou acima, em tempo real.</p>
        {medidasAoVivo.length === 0
          ? <p className="sub">Preencha peso, altura e idade para ver IMC, FC máxima, gasto de repouso e meta de água.</p>
          : <div className="medidas">{medidasAoVivo.map((m) => <CartaoMedida key={m.id} m={m} />)}</div>}
      </section>
    </section>
  );
}
```

- [ ] **Step 5: Rodar e ver passar**

```bash
pnpm vitest run src/ui/telas/Perfil.test.tsx
```

Esperado: `✓ src/ui/telas/Perfil.test.tsx (2 tests)`. Se `29.4` não aparecer, confira que `medidas(ctx)` do plano 02 devolve `valor` do IMC com uma casa (contrato: `imc: number | null // 1 casa`); o teste é sobre a tela reagir, então o número vem do domínio.

- [ ] **Step 6: Commit**

```bash
git -C .. add app/src/ui/telas/telas.css app/src/ui/telas/Perfil.tsx app/src/ui/telas/Perfil.test.tsx
git -C .. commit -m "feat: tela Perfil com medidas ao vivo"
```

---

### Task 5: Tela Hoje

**Files:**
- Create: `app/src/ui/telas/Hoje.tsx`
- Test: `app/src/ui/telas/Hoje.test.tsx`

**Interfaces:**
- Consumes: `camposDe`, `Campo` (`@/dominio/campos`); `METAS`, `acoesEmFoco`, `metasAplicaveis` (`@/dominio/metas`); `Dia`, `EventoTreino`, `EventoRefeicao` (`@/dominio/tipos`); `AcaoId` (`@/dominio/catalogo/tipos`); `salvarDia` (`@/dados/repositorios/dia`); `registrarTreino`, `registrarRefeicao`, `refeicoesEntre` (`@/dados/repositorios/eventos`); `hojeISO`, `ontem` (`@/dados/datas`); `useContexto`, `useDia`; `CampoRegistro`, `ConviteRegistro`, `CardAcao`; `chaveDe`, `horaAgora`, `formatarData`; `Link` (`react-router`).
- Produces: `export function Hoje(): JSX.Element` (rota `/`, heading "Hoje").

Comportamento:
- **Check-in da manhã** = `camposDe('dia', perfil, 1)`. Os campos falam de ontem / da noite passada (`deitou`, `levantou`, `fome`, `comiSemFome`, `ultimoCafe`, `jantarFim`, `passos`) mas são gravados no `dia` de **hoje** (`hojeISO()`): o cabeçalho da seção diz isso. `dia.moveu` sai da lista se há `EventoTreino` com `data === ontem(hoje)` (única exceção por id na UI; ver Global Constraints). Cada mudança chama `salvarDia(hoje, { [chave]: valor })` na hora — sem botão salvar.
- **Quero registrar mais** expande `camposDe('dia', perfil, 2).filter(c => c.nivel === 2)` precedido por `<ConviteRegistro campos={nivel2} />`.
- **Treinei / Comi / Levantei**: mini-forms inline. Depois de `registrarRefeicao`, recalcula `dia.proteinaG`/`dia.fibraG` como soma das refeições do dia (`refeicoesEntre(hoje, hoje)`) e grava com `salvarDia`. **Levantei** grava `levantadas + 1`.
- **Dias parado**: `ctx.derivados.diasParado` com `METAS['nunca-dois-dias'].meta(ctx)` (`texto` + `proximoPasso`).
- **Em foco**: `acoesEmFoco(ctx, 3)`; se vierem menos de 3, completa com ações `sem-dado` de `metasAplicaveis(ctx)` (excluindo medidas e hábitos), para que o convite apareça (spec §5.2).

- [ ] **Step 1: Teste (falha)**

`app/src/ui/telas/Hoje.test.tsx`:

```tsx
import { beforeEach, describe, expect, test } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { Hoje } from './Hoje';
import { camposDe } from '@/dominio/campos';
import { salvarPerfil } from '@/dados/repositorios/perfil';
import { lerDia } from '@/dados/repositorios/dia';
import { registrarTreino } from '@/dados/repositorios/eventos';
import { apagarTudo } from '@/dados/exportImport';
import { hojeISO, ontem } from '@/dados/datas';
import { PERFIL, PERFIL_SEM_CAFE } from '@/test/fixtures';

beforeEach(async () => {
  await apagarTudo();
});

function renderizar() {
  return render(<MemoryRouter><Hoje /></MemoryRouter>);
}

async function esperarCheckin() {
  await screen.findByRole('heading', { name: 'Check-in da manhã' });
}

describe('Hoje — check-in', () => {
  // O número de campos vem do registro (plano 01), não de um literal: o spec §3
  // lista 9 campos de nível 1 com café (8 sem), e o enunciado deste plano fala
  // em 7/6. Comparar com camposDe() é o que garante que a tela é gerada do registro.
  test('renderiza todos os campos de nível 1 do perfil com café diário', async () => {
    const perfil = await salvarPerfil(PERFIL);
    const { container } = renderizar();
    await esperarCheckin();
    const esperado = camposDe('dia', perfil, 1).length;
    await waitFor(() => expect(container.querySelectorAll('[data-campo]')).toHaveLength(esperado));
    expect(container.querySelector('[data-campo="dia.ultimoCafe"]')).not.toBeNull();
  });

  test('perfil sem café tem um campo a menos e não pergunta o último café', async () => {
    const perfil = await salvarPerfil(PERFIL_SEM_CAFE);
    const { container } = renderizar();
    await esperarCheckin();
    const esperado = camposDe('dia', perfil, 1).length;
    await waitFor(() => expect(container.querySelectorAll('[data-campo]')).toHaveLength(esperado));
    expect(container.querySelector('[data-campo="dia.ultimoCafe"]')).toBeNull();
    expect(esperado).toBe(camposDe('dia', { ...perfil, cafe: 'diario' }, 1).length - 1);
  });

  test('moveu some quando houve treino ontem', async () => {
    await salvarPerfil(PERFIL);
    await registrarTreino({ data: ontem(hojeISO()), hora: '18:00', tipo: 'moderado', minutos: 20 });
    const { container } = renderizar();
    await esperarCheckin();
    await waitFor(() => expect(container.querySelectorAll('[data-campo]').length).toBeGreaterThan(0));
    expect(container.querySelector('[data-campo="dia.moveu"]')).toBeNull();
  });

  test('clicar Sim em comiSemFome grava no dia de hoje', async () => {
    await salvarPerfil(PERFIL);
    const { container } = renderizar();
    await esperarCheckin();
    const el = await waitFor(() => {
      const x = container.querySelector('[data-campo="dia.comiSemFome"]');
      expect(x).not.toBeNull();
      return x as HTMLElement;
    });
    fireEvent.click(within(el).getByRole('button', { name: 'Sim' }));
    await waitFor(async () => expect((await lerDia(hojeISO()))?.comiSemFome).toBe(true));
  });

  test('Quero registrar mais abre o nível 2 com o convite', async () => {
    const perfil = await salvarPerfil(PERFIL);
    const { container } = renderizar();
    await esperarCheckin();
    fireEvent.click(screen.getByRole('button', { name: 'Quero registrar mais' }));
    expect(screen.getAllByText(/^Registre .* e eu te digo onde você está em/).length).toBeGreaterThan(0);
    const total = camposDe('dia', perfil, 2).length;
    await waitFor(() => expect(container.querySelectorAll('[data-campo]')).toHaveLength(total));
  });
});

describe('Hoje — eventos', () => {
  test('Levantei incrementa levantadas', async () => {
    await salvarPerfil(PERFIL);
    renderizar();
    const botao = await screen.findByRole('button', { name: 'Levantei' });
    fireEvent.click(botao);
    await waitFor(async () => expect((await lerDia(hojeISO()))?.levantadas).toBe(1));
    fireEvent.click(botao);
    await waitFor(async () => expect((await lerDia(hojeISO()))?.levantadas).toBe(2));
  });

  test('Comi grava a refeição e soma proteína no dia', async () => {
    await salvarPerfil(PERFIL);
    renderizar();
    fireEvent.click(await screen.findByRole('button', { name: 'Comi' }));
    fireEvent.change(screen.getByLabelText('Proteína (g)'), { target: { value: '30' } });
    fireEvent.click(screen.getByRole('button', { name: 'Registrar refeição' }));
    await waitFor(async () => expect((await lerDia(hojeISO()))?.proteinaG).toBe(30));
  });

  test('mostra o contador de dias parado e três ações em foco', async () => {
    await salvarPerfil(PERFIL);
    const { container } = renderizar();
    await screen.findByRole('heading', { name: 'Dias parado' });
    await waitFor(() => expect(container.querySelectorAll('article.card')).toHaveLength(3));
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

```bash
pnpm vitest run src/ui/telas/Hoje.test.tsx
```

Esperado: `Failed to resolve import "./Hoje"`.

- [ ] **Step 3: Implementar `Hoje.tsx`**

`app/src/ui/telas/Hoje.tsx`:

```tsx
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import type { Campo } from '@/dominio/campos';
import { camposDe } from '@/dominio/campos';
import { METAS, acoesEmFoco, metasAplicaveis } from '@/dominio/metas';
import type { Dia, EventoTreino, EventoRefeicao } from '@/dominio/tipos';
import type { AcaoId } from '@/dominio/catalogo/tipos';
import { salvarDia } from '@/dados/repositorios/dia';
import { registrarTreino, registrarRefeicao, refeicoesEntre } from '@/dados/repositorios/eventos';
import { hojeISO, ontem } from '@/dados/datas';
import { useContexto } from '@/ui/hooks/useContexto';
import { useDia } from '@/ui/hooks/useDia';
import { CampoRegistro } from '@/ui/componentes/CampoRegistro';
import { ConviteRegistro } from '@/ui/componentes/ConviteRegistro';
import { CardAcao } from '@/ui/componentes/CardAcao';
import { chaveDe, horaAgora, formatarData } from '@/ui/formato';
import './telas.css';

type ParcialDia = Partial<Omit<Dia, 'data' | 'atualizadoEm'>>;

/** Ações que não viram card (são medidas ou hábitos de registro). */
const SEM_CARD: AcaoId[] = ['meca-a-cintura', 'panturrilha-preensao', 'anote-o-sono', 'pergunte-a-fome'];

function numeroOuNada(t: string): number | undefined {
  if (t.trim() === '') return undefined;
  const n = parseFloat(t.replace(',', '.'));
  return Number.isNaN(n) ? undefined : n;
}

interface FormTreinoProps { data: string; aoFechar: () => void; }

function FormTreino({ data, aoFechar }: FormTreinoProps) {
  const [tipo, setTipo] = useState<EventoTreino['tipo']>('tiros');
  const [minutos, setMinutos] = useState('');
  const [tiros, setTiros] = useState('');
  const [tiroTravou, setTiroTravou] = useState('');
  const [rpe, setRpe] = useState('');
  const [fc1min, setFc1min] = useState('');
  const [calor, setCalor] = useState(false);
  const [jejum, setJejum] = useState(false);
  const min = numeroOuNada(minutos);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (min === undefined || min <= 0) return;
    const base: Omit<EventoTreino, 'id' | 'atualizadoEm'> = { data, hora: horaAgora(), tipo, minutos: min };
    if (tipo === 'tiros') {
      const t = numeroOuNada(tiros); if (t !== undefined) base.tiros = t;
      const tt = numeroOuNada(tiroTravou); if (tt !== undefined) base.tiroTravou = tt;
      const r = numeroOuNada(rpe); if (r !== undefined) base.rpe = r;
      const fc = numeroOuNada(fc1min); if (fc !== undefined) base.fc1min = fc;
      base.calor = calor;
      base.jejum = jejum;
    }
    await registrarTreino(base);
    aoFechar();
  }

  return (
    <form className="painel mini-form" onSubmit={enviar}>
      <div className="ph"><span className="k">Treinei</span></div>
      <div className="grid">
        <div className="field">
          <label htmlFor="t-tipo">Tipo</label>
          <select id="t-tipo" value={tipo} onChange={(e) => setTipo(e.target.value as EventoTreino['tipo'])}>
            <option value="tiros">Tiros</option>
            <option value="forca">Força</option>
            <option value="moderado">Moderado (caminhada, bike leve)</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="t-min">Minutos</label>
          <input id="t-min" type="number" inputMode="numeric" min="1" max="600" value={minutos} onChange={(e) => setMinutos(e.target.value)} />
        </div>
        {tipo === 'tiros' && (
          <>
            <div className="field">
              <label htmlFor="t-tiros">Quantos tiros</label>
              <input id="t-tiros" type="number" inputMode="numeric" min="1" max="30" value={tiros} onChange={(e) => setTiros(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="t-travou">Travou em qual tiro (se travou)</label>
              <input id="t-travou" type="number" inputMode="numeric" min="1" max="30" value={tiroTravou} onChange={(e) => setTiroTravou(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="t-rpe">Esforço da sessão (RPE 0–10)</label>
              <input id="t-rpe" type="number" inputMode="numeric" min="0" max="10" value={rpe} onChange={(e) => setRpe(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="t-fc">FC 1 min depois do último tiro (bpm)</label>
              <input id="t-fc" type="number" inputMode="numeric" min="30" max="250" value={fc1min} onChange={(e) => setFc1min(e.target.value)} />
            </div>
            <div className="opcoes">
              <label><input type="checkbox" checked={calor} onChange={(e) => setCalor(e.target.checked)} />Estava calor</label>
              <label><input type="checkbox" checked={jejum} onChange={(e) => setJejum(e.target.checked)} />Em jejum</label>
            </div>
          </>
        )}
      </div>
      <div className="botoes">
        <button type="submit" className="botao primario" disabled={min === undefined || min <= 0}>Registrar treino</button>
        <button type="button" className="botao" onClick={aoFechar}>Cancelar</button>
      </div>
    </form>
  );
}

interface FormRefeicaoProps { data: string; aoFechar: () => void; }

function FormRefeicao({ data, aoFechar }: FormRefeicaoProps) {
  const [hora, setHora] = useState(horaAgora());
  const [proteinaG, setProteinaG] = useState('');
  const [fibraG, setFibraG] = useState('');
  const [cozinhada, setCozinhada] = useState(false);
  const [comecouPelaFibra, setComecouPelaFibra] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (hora === '') return;
    const r: Omit<EventoRefeicao, 'id' | 'atualizadoEm'> = { data, hora, cozinhada, comecouPelaFibra };
    const p = numeroOuNada(proteinaG); if (p !== undefined) r.proteinaG = p;
    const f = numeroOuNada(fibraG); if (f !== undefined) r.fibraG = f;
    await registrarRefeicao(r);

    // proteinaG/fibraG do dia = soma das refeições do dia (spec §3)
    const refeicoes = await refeicoesEntre(data, data);
    const parcial: ParcialDia = {};
    if (refeicoes.some((x) => x.proteinaG !== undefined)) parcial.proteinaG = refeicoes.reduce((s, x) => s + (x.proteinaG ?? 0), 0);
    if (refeicoes.some((x) => x.fibraG !== undefined)) parcial.fibraG = refeicoes.reduce((s, x) => s + (x.fibraG ?? 0), 0);
    if (Object.keys(parcial).length > 0) await salvarDia(data, parcial);
    aoFechar();
  }

  return (
    <form className="painel mini-form" onSubmit={enviar}>
      <div className="ph"><span className="k">Comi</span><span className="sub">Só o que souber. Gramas pelo rótulo ou app de dieta.</span></div>
      <div className="grid">
        <div className="field">
          <label htmlFor="r-hora">Hora</label>
          <input id="r-hora" type="time" value={hora} onChange={(e) => setHora(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="r-prot">Proteína (g)</label>
          <input id="r-prot" type="number" inputMode="decimal" min="0" max="300" value={proteinaG} onChange={(e) => setProteinaG(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="r-fibra">Fibra (g)</label>
          <input id="r-fibra" type="number" inputMode="decimal" min="0" max="100" value={fibraG} onChange={(e) => setFibraG(e.target.value)} />
        </div>
        <div className="opcoes">
          <label><input type="checkbox" checked={cozinhada} onChange={(e) => setCozinhada(e.target.checked)} />Feita de ingredientes</label>
          <label><input type="checkbox" checked={comecouPelaFibra} onChange={(e) => setComecouPelaFibra(e.target.checked)} />Comecei pela fibra</label>
        </div>
      </div>
      <div className="botoes">
        <button type="submit" className="botao primario">Registrar refeição</button>
        <button type="button" className="botao" onClick={aoFechar}>Cancelar</button>
      </div>
    </form>
  );
}

export function Hoje() {
  const { ctx, carregando } = useContexto();
  const hoje = hojeISO();
  const dia = useDia(hoje);
  const [mais, setMais] = useState(false);
  const [formAberto, setFormAberto] = useState<'treino' | 'refeicao' | null>(null);

  if (carregando || !ctx) return <p className="carregando">Carregando…</p>;

  const perfil = ctx.perfil;
  const treinouOntem = ctx.eventos.some((e) => e.data === ontem(hoje));
  // Única condição por id na UI: depende de eventos, e Campo.condicao só vê o perfil.
  const nivel1 = camposDe('dia', perfil, 1).filter((c) => !(c.id === 'dia.moveu' && treinouOntem));
  const nivel2 = camposDe('dia', perfil, 2).filter((c) => c.nivel === 2);

  const parado = METAS['nunca-dois-dias'].meta(ctx);
  const foco = acoesEmFoco(ctx, 3);
  const faltam = 3 - foco.length;
  const semDado = faltam > 0
    ? metasAplicaveis(ctx)
        .filter((x) => x.meta.zona === 'sem-dado' && !SEM_CARD.includes(x.acao.id))
        .filter((x) => !foco.some((f) => f.acao.id === x.acao.id))
        .slice(0, faltam)
    : [];
  const emFoco = [...foco, ...semDado];

  function valorDe(c: Campo): unknown {
    return dia ? (dia as unknown as Record<string, unknown>)[chaveDe(c)] : undefined;
  }

  function gravar(c: Campo, v: unknown) {
    void salvarDia(hoje, { [chaveDe(c)]: v } as ParcialDia);
  }

  async function levantei() {
    await salvarDia(hoje, { levantadas: (dia?.levantadas ?? 0) + 1 });
  }

  return (
    <section className="tela hoje">
      <header>
        <p className="eyebrow">{formatarData(hoje)}</p>
        <h1>Hoje</h1>
      </header>

      <section className="painel">
        <div className="ph">
          <h2>Check-in da manhã</h2>
          <span className="sub">Sobre a noite passada e o dia de ontem. Fica no registro de hoje.</span>
        </div>
        <div className="grid">
          {nivel1.map((c) => (
            <CampoRegistro key={c.id} campo={c} valor={valorDe(c)} onChange={(v) => gravar(c, v)} />
          ))}
        </div>
        {mais ? (
          <>
            <ConviteRegistro campos={nivel2} />
            <div className="grid">
              {nivel2.map((c) => (
                <CampoRegistro key={c.id} campo={c} valor={valorDe(c)} onChange={(v) => gravar(c, v)} />
              ))}
            </div>
          </>
        ) : (
          <div className="botoes">
            <button type="button" className="botao" onClick={() => setMais(true)}>Quero registrar mais</button>
          </div>
        )}
      </section>

      <section className="secao">
        <h2>Aconteceu agora</h2>
        <div className="eventos">
          <button type="button" className="botao" aria-pressed={formAberto === 'treino'} onClick={() => setFormAberto(formAberto === 'treino' ? null : 'treino')}>Treinei</button>
          <button type="button" className="botao" aria-pressed={formAberto === 'refeicao'} onClick={() => setFormAberto(formAberto === 'refeicao' ? null : 'refeicao')}>Comi</button>
          <button type="button" className="botao" onClick={levantei}>Levantei</button>
        </div>
        <p className="levantadas">levantei {dia?.levantadas ?? 0} vez(es) hoje</p>
        {formAberto === 'treino' && <FormTreino data={hoje} aoFechar={() => setFormAberto(null)} />}
        {formAberto === 'refeicao' && <FormRefeicao data={hoje} aoFechar={() => setFormAberto(null)} />}
      </section>

      <section className="painel">
        <h2>Dias parado</h2>
        <div className={`parado zona-${parado.zona}`}>
          <div className="n">{ctx.derivados.diasParado}<small>dia(s) seguido(s)</small></div>
          <div>
            <p>{parado.texto}</p>
            <p className="sub">{parado.proximoPasso}</p>
          </div>
        </div>
      </section>

      <section className="secao">
        <div className="grupo-h">
          <h2>Em foco</h2>
          <Link to="/acoes" className="n">ver todas</Link>
        </div>
        <div className="cards">
          {emFoco.map((x) => <CardAcao key={x.acao.id} acao={x.acao} meta={x.meta} compacto />)}
        </div>
      </section>
    </section>
  );
}
```

- [ ] **Step 4: Rodar e ver passar**

```bash
pnpm vitest run src/ui/telas/Hoje.test.tsx
```

Esperado: `✓ src/ui/telas/Hoje.test.tsx (8 tests)`.

Se o teste "três ações em foco" falhar por vir menos de 3 cards: com perfil recém-criado e nenhum dia, `acoesEmFoco` devolve 0 e o complemento `sem-dado` precisa fornecer 3 — confira se `metasAplicaveis(ctx)` do plano 02 retorna `zona: 'sem-dado'` para ações sem dado (regra do spec §6).

- [ ] **Step 5: Commit**

```bash
git -C .. add app/src/ui/telas/Hoje.tsx app/src/ui/telas/Hoje.test.tsx
git -C .. commit -m "feat: tela Hoje com check-in gerado do registro, eventos, dias parado e ações em foco"
```

---

### Task 6: Tela Ações

**Files:**
- Create: `app/src/ui/telas/Acoes.tsx`
- Test: `app/src/ui/telas/Acoes.test.tsx`

**Interfaces:**
- Consumes: `metasAplicaveis` (`@/dominio/metas`); `medidas` (`@/dominio/medidas`); `acaoDoCatalogo` (`@/dominio/catalogo`); `AcaoId`, `Grupo`, `AcaoCatalogo` (`@/dominio/catalogo/tipos`); `useContexto`; `CardAcao`, `CartaoMedida`.
- Produces: `export function Acoes(): JSX.Element` (rota `/acoes`, heading "Ações").

Comportamento: `metasAplicaveis(ctx)` (já filtra `aplica(perfil)` — `ultimo-cafe` e `se-beber` somem sozinhos com perfil `nao`), agrupado por `acao.grupo` na ordem Movimento → Sono e ritmo → Alimentação → Corpo e medida. `meca-a-cintura` e `panturrilha-preensao` não viram card (estão nas Medidas); `anote-o-sono` e `pergunte-a-fome` vão para "Hábitos de registro". Seção **Medidas** com `medidas(ctx)`.

- [ ] **Step 1: Teste (falha)**

`app/src/ui/telas/Acoes.test.tsx`:

```tsx
import { beforeEach, describe, expect, test } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { Acoes } from './Acoes';
import { salvarPerfil } from '@/dados/repositorios/perfil';
import { apagarTudo } from '@/dados/exportImport';
import { PERFIL, PERFIL_SEM_CAFE } from '@/test/fixtures';

beforeEach(async () => {
  await apagarTudo();
});

function renderizar() {
  return render(<MemoryRouter><Acoes /></MemoryRouter>);
}

describe('Ações', () => {
  test('perfil com café mostra ultimo-cafe; medidas e hábitos aparecem; cintura e panturrilha não são cards', async () => {
    await salvarPerfil(PERFIL);
    const { container } = renderizar();
    await screen.findByRole('heading', { name: 'Ações' });
    await waitFor(() => expect(container.querySelector('[data-acao="ultimo-cafe"]')).not.toBeNull());
    expect(container.querySelector('[data-acao="meca-a-cintura"]')).toBeNull();
    expect(container.querySelector('[data-acao="panturrilha-preensao"]')).toBeNull();
    expect(container.querySelector('[data-medida="imc"]')).not.toBeNull();
    expect(screen.getByRole('heading', { name: 'Hábitos de registro' })).toBeInTheDocument();
    expect(container.querySelector('[data-habito="anote-o-sono"]')).not.toBeNull();
    expect(container.querySelector('[data-habito="pergunte-a-fome"]')).not.toBeNull();
    expect(screen.getByRole('heading', { name: 'Movimento' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Corpo e medida' })).toBeInTheDocument();
  });

  test('perfil café "nao" não mostra ultimo-cafe', async () => {
    await salvarPerfil(PERFIL_SEM_CAFE);
    const { container } = renderizar();
    await screen.findByRole('heading', { name: 'Ações' });
    await waitFor(() => expect(container.querySelector('[data-acao="seis-mil-passos"]')).not.toBeNull());
    expect(container.querySelector('[data-acao="ultimo-cafe"]')).toBeNull();
    expect(container.querySelector('[data-acao="se-beber"]')).toBeNull();
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

```bash
pnpm vitest run src/ui/telas/Acoes.test.tsx
```

Esperado: `Failed to resolve import "./Acoes"`.

- [ ] **Step 3: Implementar `Acoes.tsx`**

`app/src/ui/telas/Acoes.tsx`:

```tsx
import { metasAplicaveis } from '@/dominio/metas';
import { medidas } from '@/dominio/medidas';
import { acaoDoCatalogo } from '@/dominio/catalogo';
import type { AcaoId, Grupo, AcaoCatalogo } from '@/dominio/catalogo/tipos';
import { useContexto } from '@/ui/hooks/useContexto';
import { CardAcao } from '@/ui/componentes/CardAcao';
import { CartaoMedida } from '@/ui/componentes/CartaoMedida';
import './telas.css';

const GRUPOS: Grupo[] = ['Movimento', 'Sono e ritmo', 'Alimentação', 'Corpo e medida'];
const MEDIDAS_NAO_CARD: AcaoId[] = ['meca-a-cintura', 'panturrilha-preensao'];
const HABITOS: AcaoId[] = ['anote-o-sono', 'pergunte-a-fome'];

function Habito({ acao }: { acao: AcaoCatalogo }) {
  return (
    <div className="hab" data-habito={acao.id}>
      <div className="t">{acao.titulo}</div>
      <div><b>gatilho</b> · {acao.gatilho}</div>
      <div><b>2 minutos</b> · {acao.acao_minima}</div>
      <p>{acao.descricao}</p>
      <div><b>registra</b> · {acao.registro.filter((r) => r !== '—').join(' → ')}</div>
    </div>
  );
}

export function Acoes() {
  const { ctx, carregando } = useContexto();
  if (carregando || !ctx) return <p className="carregando">Carregando…</p>;

  const todas = metasAplicaveis(ctx).filter((x) => !MEDIDAS_NAO_CARD.includes(x.acao.id) && !HABITOS.includes(x.acao.id));
  const porGrupo = GRUPOS.map((g) => ({ grupo: g, itens: todas.filter((x) => x.acao.grupo === g) })).filter((g) => g.itens.length > 0);
  const listaMedidas = medidas(ctx);

  return (
    <section className="tela acoes">
      <header>
        <p className="eyebrow">catálogo · com os seus números</p>
        <h1>Ações</h1>
        <p className="sub">Cada ação tem um gatilho, uma versão de dois minutos e uma meta pessoal — pouco, meta, demais — com o próximo passo a partir de onde você está.</p>
      </header>

      <section className="secao">
        <div className="grupo-h"><h2>Medidas</h2><span className="n">{listaMedidas.length}</span></div>
        <p className="sub">Instrumentos, não ações: o que você mede para saber se as ações estão funcionando. Sempre contra o seu próprio baseline.</p>
        <div className="medidas">
          {listaMedidas.map((m) => <CartaoMedida key={m.id} m={m} />)}
        </div>
      </section>

      {porGrupo.map((g) => (
        <section className="secao" key={g.grupo}>
          <div className="grupo-h"><h2>{g.grupo}</h2><span className="n">{g.itens.length} ações</span></div>
          <div className="cards">
            {g.itens.map((x) => <CardAcao key={x.acao.id} acao={x.acao} meta={x.meta} />)}
          </div>
        </section>
      ))}

      <section className="secao">
        <div className="grupo-h"><h2>Hábitos de registro</h2></div>
        <p className="sub">Sem número e sem meta — são o que faz os outros números existirem.</p>
        <div className="habitos">
          {HABITOS.map((id) => <Habito key={id} acao={acaoDoCatalogo(id)} />)}
        </div>
      </section>
    </section>
  );
}
```

- [ ] **Step 4: Rodar e ver passar**

```bash
pnpm vitest run src/ui/telas/Acoes.test.tsx
```

Esperado: `✓ src/ui/telas/Acoes.test.tsx (2 tests)`.

- [ ] **Step 5: Commit**

```bash
git -C .. add app/src/ui/telas/Acoes.tsx app/src/ui/telas/Acoes.test.tsx
git -C .. commit -m "feat: tela Ações agrupada por grupo, com medidas e hábitos de registro"
```

---

### Task 7: Telas Segunda e Exames

**Files:**
- Create: `app/src/ui/telas/Segunda.tsx`
- Create: `app/src/ui/telas/Exames.tsx`
- Test: `app/src/ui/telas/Segunda.test.tsx`
- Test: `app/src/ui/telas/Exames.test.tsx`

**Interfaces:**
- Consumes: `camposDe`, `Campo` (`@/dominio/campos`); `Semana`, `Mes`, `Exame`, `DataISO` (`@/dominio/tipos`); `lerSemana`, `salvarSemana`, `preencherSemana`, `lerMes`, `salvarMes`, `listarExames`, `salvarExame`, `ultimoExame` (repositórios em `@/dados/repositorios/semana`, `@/dados/repositorios/mes`, `@/dados/repositorios/exame`); `hojeISO`, `semanaISO`, `mesISO` (`@/dados/datas`); `useContexto`, `usePerfil`; `CampoRegistro`; `chaveDe`, `primeiraSegundaDoMes`, `diasEntre`, `formatarData`; `useLiveQuery` (`dexie-react-hooks`); `Link` (`react-router`).
- Produces: `export function Segunda(): JSX.Element` (rota `/segunda`, heading "Segunda") e `export function Exames(): JSX.Element` (rota `/exames`, heading "Exames").

Comportamento da Segunda: semana ISO atual. Se `lerSemana` não devolve nada, o form nasce com `preencherSemana(s)` (pré-preenchido dos eventos e dias); a pessoa confirma ou corrige e salva com `salvarSemana`. Mostra `derivados.pesoMedioSemana` (só leitura). Se hoje é a primeira segunda-feira do mês **ou** não há `mes` do mês corrente, acrescenta `camposDe('mes', perfil)` com botão próprio → `salvarMes`. Se `ultimoExame()` é undefined ou tem ≥ 84 dias, aviso com link para `/exames`.

Truque com `useLiveQuery`: `undefined` significa "carregando" — para distinguir "carregou e não existe", a consulta devolve `null` nesse caso (`.then(x => x ?? null)`). Só assim a pré-carga não atropela um registro salvo que ainda estava chegando.

- [ ] **Step 1: Testes (falham)**

`app/src/ui/telas/Segunda.test.tsx`:

```tsx
import { beforeEach, describe, expect, test } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { Segunda } from './Segunda';
import { salvarPerfil } from '@/dados/repositorios/perfil';
import { registrarTreino } from '@/dados/repositorios/eventos';
import { lerSemana } from '@/dados/repositorios/semana';
import { salvarExame } from '@/dados/repositorios/exame';
import { apagarTudo } from '@/dados/exportImport';
import { hojeISO, semanaISO, somarDias } from '@/dados/datas';
import { PERFIL } from '@/test/fixtures';

beforeEach(async () => {
  await apagarTudo();
});

function renderizar() {
  return render(<MemoryRouter><Segunda /></MemoryRouter>);
}

describe('Segunda', () => {
  test('pré-preenche sessões de tiros a partir dos eventos da semana', async () => {
    await salvarPerfil(PERFIL);
    await registrarTreino({ data: hojeISO(), hora: '07:00', tipo: 'tiros', minutos: 8, tiros: 3 });
    const { container } = renderizar();
    await screen.findByRole('heading', { name: 'Segunda' });
    await waitFor(() => {
      const input = container.querySelector('[data-campo="semana.sessoesTiros"] input') as HTMLInputElement | null;
      expect(input).not.toBeNull();
      expect(input!.value).toBe('1');
    });
  });

  test('salvar grava a semana', async () => {
    await salvarPerfil(PERFIL);
    const { container } = renderizar();
    await screen.findByRole('heading', { name: 'Segunda' });
    const input = await waitFor(() => {
      const x = container.querySelector('[data-campo="semana.cintura"] input') as HTMLInputElement | null;
      expect(x).not.toBeNull();
      return x!;
    });
    fireEvent.change(input, { target: { value: '100' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar semana' }));
    await waitFor(async () => expect((await lerSemana(semanaISO(hojeISO())))?.cintura).toBe(100));
  });

  test('sem exames, mostra o aviso com link para /exames', async () => {
    await salvarPerfil(PERFIL);
    renderizar();
    const link = await screen.findByRole('link', { name: /registrar exames/i });
    expect(link).toHaveAttribute('href', '/exames');
  });

  test('com exame recente, não mostra o aviso', async () => {
    await salvarPerfil(PERFIL);
    await salvarExame({ data: somarDias(hojeISO(), -10), glicemia: 92 });
    renderizar();
    await screen.findByRole('heading', { name: 'Segunda' });
    await waitFor(() => expect(screen.queryByRole('link', { name: /registrar exames/i })).toBeNull());
  });

  test('mostra os campos do mês quando não há mês corrente', async () => {
    await salvarPerfil(PERFIL);
    const { container } = renderizar();
    await screen.findByRole('heading', { name: 'Segunda' });
    await waitFor(() => expect(container.querySelector('[data-campo="mes.panturrilha"]')).not.toBeNull());
  });
});
```

`app/src/ui/telas/Exames.test.tsx`:

```tsx
import { beforeEach, describe, expect, test } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { Exames } from './Exames';
import { salvarPerfil } from '@/dados/repositorios/perfil';
import { listarExames } from '@/dados/repositorios/exame';
import { apagarTudo } from '@/dados/exportImport';
import { PERFIL } from '@/test/fixtures';

beforeEach(async () => {
  await apagarTudo();
});

describe('Exames', () => {
  test('salvar grava e lista', async () => {
    await salvarPerfil(PERFIL);
    const { container } = render(<MemoryRouter><Exames /></MemoryRouter>);
    await screen.findByRole('heading', { name: 'Exames' });
    const input = await waitFor(() => {
      const x = container.querySelector('[data-campo="exame.glicemia"] input') as HTMLInputElement | null;
      expect(x).not.toBeNull();
      return x!;
    });
    fireEvent.change(screen.getByLabelText('Data do exame'), { target: { value: '2026-09-01' } });
    fireEvent.change(input, { target: { value: '95' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar exame' }));
    await waitFor(async () => {
      const lista = await listarExames();
      expect(lista).toHaveLength(1);
      expect(lista[0].glicemia).toBe(95);
      expect(lista[0].data).toBe('2026-09-01');
    });
    expect(await screen.findByText('01/09/2026')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

```bash
pnpm vitest run src/ui/telas/Segunda.test.tsx src/ui/telas/Exames.test.tsx
```

Esperado: dois `Failed to resolve import`.

- [ ] **Step 3: Implementar `Segunda.tsx`**

`app/src/ui/telas/Segunda.tsx`:

```tsx
import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import type { Campo } from '@/dominio/campos';
import { camposDe } from '@/dominio/campos';
import type { Semana, Mes } from '@/dominio/tipos';
import { lerSemana, salvarSemana, preencherSemana } from '@/dados/repositorios/semana';
import { lerMes, salvarMes } from '@/dados/repositorios/mes';
import { ultimoExame } from '@/dados/repositorios/exame';
import { hojeISO, semanaISO, mesISO } from '@/dados/datas';
import { useContexto } from '@/ui/hooks/useContexto';
import { CampoRegistro } from '@/ui/componentes/CampoRegistro';
import { chaveDe, primeiraSegundaDoMes, diasEntre, formatarData } from '@/ui/formato';
import './telas.css';

type Valores = Record<string, unknown>;
type ParcialSemana = Partial<Omit<Semana, 'semana' | 'atualizadoEm'>>;
type ParcialMes = Partial<Omit<Mes, 'mes' | 'atualizadoEm'>>;

const DIAS_ENTRE_EXAMES = 84; // 12 semanas

function semIndefinidos(v: Valores): Valores {
  const out: Valores = {};
  for (const [k, x] of Object.entries(v)) if (x !== undefined) out[k] = x;
  return out;
}

function valoresDe(obj: object | null | undefined, campos: Campo[]): Valores {
  const out: Valores = {};
  if (!obj) return out;
  const r = obj as Record<string, unknown>;
  for (const c of campos) out[chaveDe(c)] = r[chaveDe(c)];
  return out;
}

export function Segunda() {
  const { ctx, carregando } = useContexto();
  const hoje = hojeISO();
  const sem = semanaISO(hoje);
  const mes = mesISO(hoje);

  // null = carregou e não existe; undefined = ainda carregando
  const semanaSalva = useLiveQuery(() => lerSemana(sem).then((s) => s ?? null), [sem]);
  const mesSalvo = useLiveQuery(() => lerMes(mes).then((m) => m ?? null), [mes]);
  const ultimo = useLiveQuery(() => ultimoExame().then((e) => e ?? null), []);

  const [form, setForm] = useState<Valores | null>(null);
  const [formMes, setFormMes] = useState<Valores | null>(null);
  const [salvo, setSalvo] = useState<string | null>(null);

  const perfil = ctx?.perfil;
  const camposSemana = perfil ? camposDe('semana', perfil) : [];
  const camposMes = perfil ? camposDe('mes', perfil) : [];

  useEffect(() => {
    if (form !== null || semanaSalva === undefined || !perfil) return;
    let ativo = true;
    (async () => {
      const base = semanaSalva ?? (await preencherSemana(sem));
      if (ativo) setForm(valoresDe(base, camposDe('semana', perfil)));
    })();
    return () => { ativo = false; };
  }, [form, semanaSalva, sem, perfil]);

  useEffect(() => {
    if (formMes !== null || mesSalvo === undefined || !perfil) return;
    setFormMes(valoresDe(mesSalvo, camposDe('mes', perfil)));
  }, [formMes, mesSalvo, perfil]);

  if (carregando || !ctx || form === null || formMes === null || ultimo === undefined) {
    return <p className="carregando">Carregando…</p>;
  }

  const mostrarMes = primeiraSegundaDoMes(hoje) || mesSalvo === null;
  const lembrarExame = ultimo === null || diasEntre(ultimo.data, hoje) >= DIAS_ENTRE_EXAMES;
  const pesoMedio = ctx.derivados.pesoMedioSemana;

  async function salvarS(e: FormEvent) {
    e.preventDefault();
    await salvarSemana(sem, semIndefinidos(form!) as ParcialSemana);
    setSalvo('Semana salva.');
  }

  async function salvarM(e: FormEvent) {
    e.preventDefault();
    await salvarMes(mes, semIndefinidos(formMes!) as ParcialMes);
    setSalvo('Mês salvo.');
  }

  return (
    <section className="tela segunda">
      <header>
        <p className="eyebrow">revisão semanal · {sem}</p>
        <h1>Segunda</h1>
        <p className="sub">Pré-preenchido com o que você registrou na semana. Confirme ou corrija.</p>
      </header>

      {lembrarExame && (
        <p className="aviso">
          {ultimo === null
            ? 'Você ainda não registrou exames. '
            : `Seu último exame foi em ${formatarData(ultimo.data)}, há ${diasEntre(ultimo.data, hoje)} dias. `}
          A cada 12 semanas vale repetir: <Link to="/exames">registrar exames</Link>.
        </p>
      )}

      <form className="painel" onSubmit={salvarS}>
        <div className="ph"><span className="k">Esta semana</span></div>
        <div className="grid">
          {camposSemana.map((c) => (
            <CampoRegistro key={c.id} campo={c} valor={form[chaveDe(c)]} onChange={(v) => setForm({ ...form, [chaveDe(c)]: v })} />
          ))}
        </div>
        <p className="leitura">
          peso médio da semana: <b>{pesoMedio === null ? '—' : `${pesoMedio} kg`}</b>
          {ctx.derivados.pesoMedioSemanaAnterior !== null && <> · semana anterior: <b>{ctx.derivados.pesoMedioSemanaAnterior} kg</b></>}
        </p>
        <div className="botoes">
          <button type="submit" className="botao primario">Salvar semana</button>
        </div>
      </form>

      {mostrarMes && (
        <form className="painel" onSubmit={salvarM}>
          <div className="ph"><span className="k">Primeira segunda do mês · {mes}</span><span className="sub">Panturrilha com a fita; preensão se tiver dinamômetro, senão repetições até falhar.</span></div>
          <div className="grid">
            {camposMes.map((c) => (
              <CampoRegistro key={c.id} campo={c} valor={formMes[chaveDe(c)]} onChange={(v) => setFormMes({ ...formMes, [chaveDe(c)]: v })} />
            ))}
          </div>
          <div className="botoes">
            <button type="submit" className="botao primario">Salvar mês</button>
          </div>
        </form>
      )}

      {salvo && <p className="sucesso" role="status">{salvo}</p>}
    </section>
  );
}
```

- [ ] **Step 4: Implementar `Exames.tsx`**

`app/src/ui/telas/Exames.tsx`:

```tsx
import { useState, type FormEvent } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { camposDe } from '@/dominio/campos';
import type { Exame } from '@/dominio/tipos';
import { listarExames, salvarExame } from '@/dados/repositorios/exame';
import { hojeISO } from '@/dados/datas';
import { usePerfil } from '@/ui/hooks/usePerfil';
import { CampoRegistro } from '@/ui/componentes/CampoRegistro';
import { chaveDe, formatarData } from '@/ui/formato';
import './telas.css';

type Valores = Record<string, unknown>;

export function Exames() {
  const perfil = usePerfil();
  const exames = useLiveQuery(() => listarExames(), []);
  const [data, setData] = useState(hojeISO());
  const [form, setForm] = useState<Valores>({});
  const [salvo, setSalvo] = useState(false);

  if (!perfil || exames === undefined) return <p className="carregando">Carregando…</p>;

  const campos = camposDe('exame', perfil);
  const temAlgo = Object.values(form).some((v) => v !== undefined);

  async function salvar(e: FormEvent) {
    e.preventDefault();
    if (data === '' || !temAlgo) return;
    const valores: Valores = {};
    for (const [k, v] of Object.entries(form)) if (v !== undefined) valores[k] = v;
    await salvarExame({ data, ...valores } as Omit<Exame, 'atualizadoEm'>);
    setForm({});
    setSalvo(true);
  }

  return (
    <section className="tela exames">
      <header>
        <p className="eyebrow">a cada 12 semanas</p>
        <h1>Exames</h1>
        <p className="sub">Só o que tiver. O app nunca compara com tabela; compara com o seu exame anterior.</p>
      </header>

      <form className="painel" onSubmit={salvar}>
        <div className="grid">
          <div className="field">
            <label htmlFor="ex-data">Data do exame</label>
            <input id="ex-data" type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </div>
          {campos.map((c) => (
            <CampoRegistro key={c.id} campo={c} valor={form[chaveDe(c)]} onChange={(v) => setForm({ ...form, [chaveDe(c)]: v })} />
          ))}
        </div>
        <div className="botoes">
          <button type="submit" className="botao primario" disabled={data === '' || !temAlgo}>Salvar exame</button>
        </div>
        {salvo && <p className="sucesso" role="status">Exame salvo.</p>}
      </form>

      <section className="secao">
        <h2>Histórico</h2>
        {exames.length === 0 ? (
          <p className="sub">Nenhum exame registrado.</p>
        ) : (
          <div className="tabela-scroll">
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  {campos.map((c) => <th key={c.id}>{c.rotulo}{c.unidade ? ` (${c.unidade})` : ''}</th>)}
                </tr>
              </thead>
              <tbody>
                {exames.map((ex) => (
                  <tr key={ex.data}>
                    <td>{formatarData(ex.data)}</td>
                    {campos.map((c) => {
                      const v = (ex as unknown as Record<string, unknown>)[chaveDe(c)];
                      return <td key={c.id}>{v === undefined || v === null ? '—' : String(v)}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}
```

- [ ] **Step 5: Rodar e ver passar**

```bash
pnpm vitest run src/ui/telas/Segunda.test.tsx src/ui/telas/Exames.test.tsx
```

Esperado: `✓ Segunda.test.tsx (5 tests)`, `✓ Exames.test.tsx (1 test)`.

Se "pré-preenche sessões de tiros" falhar com valor `''`: `preencherSemana` (plano 03) conta eventos da semana ISO — confira que a data do evento (`hojeISO()`) cai em `semanaISO(hojeISO())`; se o plano 03 devolver a chave com outro nome, o contrato é `sessoesTiros` e o erro está lá, não aqui.

- [ ] **Step 6: Commit**

```bash
git -C .. add app/src/ui/telas/Segunda.tsx app/src/ui/telas/Segunda.test.tsx app/src/ui/telas/Exames.tsx app/src/ui/telas/Exames.test.tsx
git -C .. commit -m "feat: telas Segunda (revisão semanal e mensal, lembrete de exames) e Exames"
```

---

### Task 8: Tela Tendências

**Files:**
- Create: `app/src/ui/telas/Tendencias.tsx`
- Test: `app/src/ui/telas/Tendencias.test.tsx`

**Interfaces:**
- Consumes: `sonoFomeCafe`, `Tendencia`, `Frase` (`@/dominio/tendencias/sonoFomeCafe`); `CAMPOS`, `Campo` (`@/dominio/campos`); `useContexto`; `ConviteRegistro`.
- Produces: `export function Tendencias(): JSX.Element` (rota `/tendencias`, heading "Tendências").

Comportamento: chama `sonoFomeCafe(ctx.dias, ctx.perfil)`. Não pronta → "Faltam N check-ins" + `oQueVaiDizer` + `ConviteRegistro` com os campos de `precisaDe`. Pronta → `baseline` e uma linha por frase com `n` (e `nComparacao` quando existir). Perfil café `nao` → nota "sua tendência é sono × fome" (a frase de café é omitida pelo domínio).

- [ ] **Step 1: Teste (falha)**

`app/src/ui/telas/Tendencias.test.tsx`:

```tsx
import { beforeEach, describe, expect, test } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { Tendencias } from './Tendencias';
import { salvarPerfil } from '@/dados/repositorios/perfil';
import { salvarDia } from '@/dados/repositorios/dia';
import { apagarTudo } from '@/dados/exportImport';
import { hojeISO, somarDias } from '@/dados/datas';
import { PERFIL, PERFIL_SEM_CAFE } from '@/test/fixtures';

beforeEach(async () => {
  await apagarTudo();
});

function renderizar() {
  return render(<MemoryRouter><Tendencias /></MemoryRouter>);
}

/** 12 dias com 8 h na cama (≈ 7,7 h de sono), fome 4, três noites curtas. */
async function fixtureDias() {
  const hoje = hojeISO();
  for (let i = 0; i < 12; i++) {
    const curta = i % 4 === 3;
    await salvarDia(somarDias(hoje, -i), {
      deitou: curta ? '01:30' : '23:00',
      levantou: '07:00',
      fome: curta ? 7 : 4,
      comiSemFome: curta,
      ultimoCafe: i % 2 === 0 ? '10:00' : '17:00',
    });
  }
}

describe('Tendências', () => {
  test('sem check-ins: diz quantos faltam e o que vai dizer', async () => {
    await salvarPerfil(PERFIL);
    renderizar();
    expect(await screen.findByText(/^Faltam \d+ check-ins/)).toBeInTheDocument();
  });

  test('com 12 dias: mostra frases com n', async () => {
    await salvarPerfil(PERFIL);
    await fixtureDias();
    renderizar();
    await screen.findByRole('heading', { name: 'Tendências' });
    await waitFor(() => expect(screen.queryByText(/^Faltam/)).toBeNull());
    const frases = await screen.findAllByRole('listitem');
    expect(frases.length).toBeGreaterThanOrEqual(2);
    expect(frases[0].textContent).toMatch(/n = \d+/);
  });

  test('perfil sem café explica que a tendência é sono × fome', async () => {
    await salvarPerfil(PERFIL_SEM_CAFE);
    await fixtureDias();
    renderizar();
    expect(await screen.findByText(/sua tendência é sono × fome/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

```bash
pnpm vitest run src/ui/telas/Tendencias.test.tsx
```

Esperado: `Failed to resolve import "./Tendencias"`.

- [ ] **Step 3: Implementar `Tendencias.tsx`**

`app/src/ui/telas/Tendencias.tsx`:

```tsx
import { sonoFomeCafe } from '@/dominio/tendencias/sonoFomeCafe';
import type { Frase } from '@/dominio/tendencias/sonoFomeCafe';
import type { Campo } from '@/dominio/campos';
import { CAMPOS } from '@/dominio/campos';
import { useContexto } from '@/ui/hooks/useContexto';
import { ConviteRegistro } from '@/ui/componentes/ConviteRegistro';
import './telas.css';

const TIPO_ROTULO: Record<Frase['tipo'], string> = {
  'sono-fome': 'sono → fome',
  'sono-comer-sem-fome': 'sono → comer sem fome',
  'cafe-sono': 'café → sono',
};

export function Tendencias() {
  const { ctx, carregando } = useContexto();
  if (carregando || !ctx) return <p className="carregando">Carregando…</p>;

  const t = sonoFomeCafe(ctx.dias, ctx.perfil);
  const semCafe = ctx.perfil.cafe === 'nao';

  return (
    <section className="tela tendencias">
      <header>
        <p className="eyebrow">só com os seus dias · sem teste estatístico</p>
        <h1>Tendências</h1>
        <p className="sub">
          {semCafe
            ? 'Você não toma café, então sua tendência é sono × fome: como as noites curtas mudam a fome e o comer sem fome do dia seguinte.'
            : 'Sono × fome × café: como as noites curtas mudam a fome do dia seguinte, e como o horário do café muda o sono.'}
        </p>
      </header>

      {t.pronta ? (
        <>
          <p className="baseline">baseline da fome (dias com sono ≥ 7 h): {t.baseline}</p>
          <ul className="frases">
            {t.frases.map((f) => (
              <li key={f.tipo}>
                <span className="eyebrow">{TIPO_ROTULO[f.tipo]}</span>
                <p>{f.texto}</p>
                <span className="n">
                  n = {f.n}
                  {f.nComparacao !== undefined && ` · comparação n = ${f.nComparacao}`}
                </span>
              </li>
            ))}
          </ul>
          <p className="sub">Comparação sempre com você mesmo, nunca com tabela. O n é o número de dias que entrou na conta.</p>
        </>
      ) : (
        <section className="painel">
          <p>Faltam {t.faltam} check-ins para a tendência aparecer.</p>
          <p className="sub">{t.oQueVaiDizer}</p>
          <ConviteRegistro
            campos={t.precisaDe.map((id) => CAMPOS.find((c) => c.id === id)).filter((c): c is Campo => c !== undefined)}
          />
        </section>
      )}
    </section>
  );
}
```

- [ ] **Step 4: Rodar e ver passar**

```bash
pnpm vitest run src/ui/telas/Tendencias.test.tsx
```

Esperado: `✓ src/ui/telas/Tendencias.test.tsx (3 tests)`.

Se "com 12 dias" continuar em "Faltam": a fixture dá 12 check-ins com sono e fome, 9 deles com sono ≥ 7 h — satisfaz o pré-requisito do spec §7 (≥ 7 check-ins, ≥ 5 dias de baseline). Se o domínio ainda disser que faltam, o problema é em `sonoFomeCafe` (plano 03), não na tela.

- [ ] **Step 5: Commit**

```bash
git -C .. add app/src/ui/telas/Tendencias.tsx app/src/ui/telas/Tendencias.test.tsx
git -C .. commit -m "feat: tela Tendências (sono × fome × café)"
```

---

### Task 9: Tela Ajustes — exportar, importar, apagar tudo, Fronteira

**Files:**
- Create: `app/src/ui/fronteira.json`
- Create: `app/src/ui/telas/Ajustes.tsx`
- Test: `app/src/ui/telas/Ajustes.test.tsx`

**Interfaces:**
- Consumes: `exportar`, `importar`, `apagarTudo` (`@/dados/exportImport`); `Link` (`react-router`).
- Produces: `export function Ajustes(): JSX.Element` (rota `/ajustes`, heading "Ajustes"); `fronteira.json` como `Array<{ titulo: string; resumo: string }>`.

Comportamento:
- **Exportar**: `exportar()` → `JSON.stringify(x, null, 2)` num `<textarea readonly>` selecionável, botão **Copiar** (`navigator.clipboard.writeText`, se existir) e botão **Baixar arquivo** (Blob + `<a download>`, só quando `URL.createObjectURL` existe — no jsdom não existe).
- **Importar**: `<textarea>` + botão. `JSON.parse` em `try/catch` → motivo "JSON malformado". Senão `importar(obj)`: `{ ok: false, motivo }` mostra o motivo num `role="alert"`; `{ ok: true, contagem }` mostra a contagem por tabela.
- **Apagar tudo**: checkbox "Entendi que isso apaga tudo neste aparelho" habilita o botão → `apagarTudo()`.
- **Fronteira**: lista estática de `fronteira.json` (curiosidades do brain marcadas `nivel: fronteira` — o que a app *não* afirma).
- **Sobre**: três linhas (não prescreve; baseline próprio; só o Núcleo vira afirmação) e link para o perfil.

- [ ] **Step 1: Teste (falha)**

`app/src/ui/telas/Ajustes.test.tsx`:

```tsx
import { beforeEach, describe, expect, test } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { Ajustes } from './Ajustes';
import { salvarPerfil, lerPerfil } from '@/dados/repositorios/perfil';
import { apagarTudo } from '@/dados/exportImport';
import { PERFIL } from '@/test/fixtures';
import fronteira from '@/ui/fronteira.json';

beforeEach(async () => {
  await apagarTudo();
});

function renderizar() {
  return render(<MemoryRouter><Ajustes /></MemoryRouter>);
}

describe('Ajustes', () => {
  test('import com JSON malformado mostra o motivo e não altera nada', async () => {
    await salvarPerfil(PERFIL);
    renderizar();
    fireEvent.change(screen.getByLabelText('Cole aqui o JSON exportado'), { target: { value: '{ não é json' } });
    fireEvent.click(screen.getByRole('button', { name: 'Importar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/JSON malformado/);
    expect((await lerPerfil())?.peso).toBe(90);
  });

  test('import com versão desconhecida mostra o motivo vindo do domínio', async () => {
    renderizar();
    fireEvent.change(screen.getByLabelText('Cole aqui o JSON exportado'), { target: { value: '{"versao": 99}' } });
    fireEvent.click(screen.getByRole('button', { name: 'Importar' }));
    const alerta = await screen.findByRole('alert');
    expect(alerta.textContent).not.toBe('');
  });

  test('exportar mostra o JSON com o perfil', async () => {
    await salvarPerfil(PERFIL);
    renderizar();
    fireEvent.click(screen.getByRole('button', { name: 'Gerar JSON' }));
    const area = (await screen.findByLabelText('JSON exportado')) as HTMLTextAreaElement;
    await waitFor(() => expect(area.value).toContain('"versao": 1'));
    expect(area.value).toContain('"peso": 90');
  });

  test('apagar tudo exige o "entendi"', async () => {
    await salvarPerfil(PERFIL);
    renderizar();
    const botao = screen.getByRole('button', { name: 'Apagar tudo' });
    expect(botao).toBeDisabled();
    fireEvent.click(screen.getByLabelText(/Entendi que isso apaga tudo/));
    expect(botao).toBeEnabled();
    fireEvent.click(botao);
    await waitFor(async () => expect(await lerPerfil()).toBeUndefined());
  });

  test('lista a Fronteira', () => {
    renderizar();
    expect(screen.getByRole('heading', { name: 'Fronteira' })).toBeInTheDocument();
    expect(screen.getByText(fronteira[0].titulo)).toBeInTheDocument();
    expect(fronteira.length).toBeGreaterThanOrEqual(6);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

```bash
pnpm vitest run src/ui/telas/Ajustes.test.tsx
```

Esperado: `Failed to resolve import "./Ajustes"`.

- [ ] **Step 3: `fronteira.json`**

Extraído de `docs/brain/pesquisa/2026-09-14-triagem-nucleo-fronteira.md` (linhas marcadas `Fronteira` + `curiosidade`). São afirmações que o app **não** faz — só mostra como curiosidade, com a fonte.

`app/src/ui/fronteira.json`:

```json
[
  {
    "titulo": "Zona 2 não é a zona da mitocôndria",
    "resumo": "Caminhada leve melhora a oxidação de gordura em quem é sedentário, mas a ideia de que ela 'expande' mitocôndrias foi refutada numa revisão de 2025 (Storoschuk). O volume conta; o estímulo de fabricar vem dos tiros."
  },
  {
    "titulo": "Intensidade × volume: debate em aberto",
    "resumo": "Uma corrente diz que intensidade melhora a função de cada mitocôndria e volume constrói quantidade; outra discorda. O debate está publicado (CrossTalk MacInnis × Bishop, 2019) e sem vencedor."
  },
  {
    "titulo": "Escada logo depois de comer",
    "resumo": "Subir escada por 1–3 minutos após a refeição reduziu glicose e insulina num único ensaio cruzado com 31 jovens saudáveis (Moore 2024). Promissor, não confirmado."
  },
  {
    "titulo": "Tiros demais derrubam",
    "resumo": "Quatro semanas de carga crescente de HIIT reduziram a respiração mitocondrial e a tolerância à glicose — e reverteram com descanso (Flockhart 2021). Um estudo, carga muito acima de 3 sessões por semana."
  },
  {
    "titulo": "Fim de semana não paga a dívida de sono",
    "resumo": "Dormir até tarde no sábado não restaurou a sensibilidade à insulina e ainda atrasou o relógio biológico (Depner 2019, 36 pessoas)."
  },
  {
    "titulo": "Dormir mais de 9 horas",
    "resumo": "Sono longo habitual associa-se a mais diabetes tipo 2 nas coortes, mas provavelmente é marcador de apneia ou depressão, não causa. Olhe a qualidade; não durma menos por causa disso."
  },
  {
    "titulo": "Antioxidante em dose alta apaga o ganho do treino",
    "resumo": "Vitamina C 1 g + E 400 UI anularam o ganho de sensibilidade à insulina do exercício (Ristow 2009). 500 mg de C não atrapalhou. O estresse oxidativo do treino é o sinal, não o dano."
  },
  {
    "titulo": "Jejum e 'limpeza celular': ninguém mediu em pessoas",
    "resumo": "A autofagia do jejum de 14–16 h vem de roedores; em humanos só há um marcador indireto no sangue (Jamshed 2019, 11 pessoas). Em quantas horas 'liga' é desconhecido. O que está medido é a glicose mais baixa no dia."
  },
  {
    "titulo": "Proteína distribuída ou concentrada?",
    "resumo": "Dividir em 3–4 refeições parecia render mais síntese de músculo; revisões recentes dizem que o total do dia é o que prediz (Schoenfeld 2013; Jespersen 2021). Dividir ajuda a lembrar, não a construir."
  },
  {
    "titulo": "Frio: só com tremor, e longe da força",
    "resumo": "Aclimatação ao frio com tremor (~1 h/dia, 10 dias) melhorou tolerância à glicose em dois estudos pequenos do mesmo grupo (Sellers 2024; Hanssen 2015); frio ameno sem tremor não fez nada (Remie 2021). Banho gelado logo após treino de força atenuou a hipertrofia (Piñero 2024). 30–60 s de água fria: sem estudo na dose."
  }
]
```

Se o TypeScript reclamar do import de JSON, confira `resolveJsonModule: true` no `tsconfig.json` (o plano 01 já precisa dele para `acoes.json`).

- [ ] **Step 4: Implementar `Ajustes.tsx`**

`app/src/ui/telas/Ajustes.tsx`:

```tsx
import { useState } from 'react';
import { Link } from 'react-router';
import { exportar, importar, apagarTudo } from '@/dados/exportImport';
import fronteira from '@/ui/fronteira.json';
import './telas.css';

interface ItemFronteira { titulo: string; resumo: string; }
const FRONTEIRA: ItemFronteira[] = fronteira;

export function Ajustes() {
  const [json, setJson] = useState('');
  const [copiado, setCopiado] = useState(false);
  const [entrada, setEntrada] = useState('');
  const [resultado, setResultado] = useState<{ ok: true; texto: string } | { ok: false; motivo: string } | null>(null);
  const [entendi, setEntendi] = useState(false);
  const [apagado, setApagado] = useState(false);

  async function gerar() {
    const x = await exportar();
    setJson(JSON.stringify(x, null, 2));
    setCopiado(false);
  }

  async function copiar() {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(json);
      setCopiado(true);
    }
  }

  function baixar() {
    if (typeof URL.createObjectURL !== 'function') return;
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fornalha-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function importarJson() {
    let obj: unknown;
    try {
      obj = JSON.parse(entrada);
    } catch {
      setResultado({ ok: false, motivo: 'JSON malformado: não consegui ler o texto colado.' });
      return;
    }
    const r = await importar(obj);
    if (r.ok) {
      const partes = Object.entries(r.contagem).map(([tabela, n]) => `${tabela}: ${n}`);
      setResultado({ ok: true, texto: `Importado. ${partes.join(' · ')}` });
      setEntrada('');
    } else {
      setResultado({ ok: false, motivo: r.motivo });
    }
  }

  async function apagar() {
    if (!entendi) return;
    await apagarTudo();
    setEntendi(false);
    setApagado(true);
  }

  return (
    <section className="tela ajustes">
      <header>
        <h1>Ajustes</h1>
        <p className="sub">Seus dados ficam só neste aparelho. Exportar é o único jeito de levá-los a outro lugar — ou de mostrar a quem te acompanha.</p>
      </header>

      <section className="painel">
        <div className="ph"><span className="k">Exportar</span></div>
        <div className="botoes">
          <button type="button" className="botao primario" onClick={gerar}>Gerar JSON</button>
          {json && <button type="button" className="botao" onClick={copiar}>{copiado ? 'Copiado' : 'Copiar'}</button>}
          {json && typeof URL.createObjectURL === 'function' && <button type="button" className="botao" onClick={baixar}>Baixar arquivo</button>}
        </div>
        {json && (
          <div className="field">
            <label htmlFor="aj-export">JSON exportado</label>
            <textarea id="aj-export" readOnly value={json} onFocus={(e) => e.currentTarget.select()} />
          </div>
        )}
      </section>

      <section className="painel">
        <div className="ph"><span className="k">Importar</span><span className="sub">Junta com o que já existe: o registro mais recente vence.</span></div>
        <div className="field">
          <label htmlFor="aj-import">Cole aqui o JSON exportado</label>
          <textarea id="aj-import" value={entrada} onChange={(e) => setEntrada(e.target.value)} />
        </div>
        <div className="botoes">
          <button type="button" className="botao primario" onClick={importarJson} disabled={entrada.trim() === ''}>Importar</button>
        </div>
        {resultado && (resultado.ok
          ? <p className="sucesso" role="status">{resultado.texto}</p>
          : <p className="erro" role="alert">{resultado.motivo}</p>)}
      </section>

      <section className="painel">
        <div className="ph"><span className="k">Apagar tudo</span></div>
        <label className="opcoes">
          <input type="checkbox" checked={entendi} onChange={(e) => setEntendi(e.target.checked)} />
          Entendi que isso apaga tudo neste aparelho e não tem volta.
        </label>
        <div className="botoes">
          <button type="button" className="botao perigo" disabled={!entendi} onClick={apagar}>Apagar tudo</button>
        </div>
        {apagado && <p className="sucesso" role="status">Tudo apagado. <Link to="/perfil">Começar de novo</Link>.</p>}
      </section>

      <section className="secao">
        <h2>Fronteira</h2>
        <p className="sub">O que a ciência ainda está discutindo. O app não afirma nada disto — mostra como curiosidade, com a fonte, para você saber o que ficou de fora e por quê.</p>
        <ul className="fronteira">
          {FRONTEIRA.map((f) => (
            <li key={f.titulo}>
              <span className="t">{f.titulo}</span>
              <p>{f.resumo}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="secao">
        <h2>Sobre</h2>
        <p className="sub">Este diário não prescreve: reúne evidência consolidada e mostra causa → efeito; a decisão é sua e de quem te acompanha.</p>
        <p className="sub">Compara você com você mesmo — nunca com tabela quando o dado é do seu corpo.</p>
        <p className="sub">Só vira afirmação o que passou na triagem Núcleo; o resto está na Fronteira acima. <Link to="/perfil">Editar perfil</Link>.</p>
      </section>
    </section>
  );
}
```

- [ ] **Step 5: Rodar e ver passar**

```bash
pnpm vitest run src/ui/telas/Ajustes.test.tsx
```

Esperado: `✓ src/ui/telas/Ajustes.test.tsx (5 tests)`.

- [ ] **Step 6: Commit**

```bash
git -C .. add app/src/ui/fronteira.json app/src/ui/telas/Ajustes.tsx app/src/ui/telas/Ajustes.test.tsx
git -C .. commit -m "feat: tela Ajustes com exportar, importar, apagar tudo e Fronteira"
```

---

### Task 10: Shell — `main.tsx`, `App.tsx`, rotas, nav inferior, guarda de perfil, aviso de IndexedDB

**Files:**
- Create: `app/src/app/indexedDb.ts`
- Create: `app/src/app/App.tsx`
- Modify: `app/src/app/main.tsx` (substituir o `main.tsx` do scaffold do plano 01, onde quer que esteja — se ele está em `app/src/main.tsx`, apague-o e aponte o `index.html` para `/src/app/main.tsx`)
- Modify: `app/index.html` (`<script type="module" src="/src/app/main.tsx">`)
- Test: `app/src/app/App.test.tsx`

**Interfaces:**
- Consumes: `useContexto`; as seis telas + Exames; `HashRouter`, `Routes`, `Route`, `NavLink`, `Navigate`, `useLocation` (`react-router`).
- Produces:
  ```ts
  export function indexedDbDisponivel(): boolean;   // app/src/app/indexedDb.ts
  export function App(): JSX.Element;                // app/src/app/App.tsx — HashRouter + rotas + nav
  ```
- Rotas (contratos): `/` Hoje, `/perfil`, `/acoes`, `/segunda`, `/tendencias`, `/ajustes`, `/exames`. Nav inferior com 5 itens: Hoje, Ações, Segunda, Tendências, Ajustes.

Guarda: enquanto `carregando`, "Carregando…"; se `semPerfil` e a rota não é `/perfil`, `<Navigate to="/perfil" replace />`. Aviso único no topo quando `indexedDbDisponivel()` é falso (spec §9); o app segue — a mensagem é o que o plano entrega; a persistência em memória depende do plano 03 e fica fora deste plano.

- [ ] **Step 1: Teste de fumaça (falha)**

`app/src/app/App.test.tsx`:

```tsx
import { beforeEach, describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from './App';
import { salvarPerfil } from '@/dados/repositorios/perfil';
import { apagarTudo } from '@/dados/exportImport';
import { PERFIL } from '@/test/fixtures';

beforeEach(async () => {
  await apagarTudo();
  window.location.hash = '';
});

describe('App', () => {
  test('sem perfil, abre na tela de perfil', async () => {
    render(<App />);
    expect(await screen.findByRole('heading', { name: 'Seu perfil' })).toBeInTheDocument();
    expect(window.location.hash).toBe('#/perfil');
  });

  test('com perfil, abre em Hoje e tem a nav com 5 itens', async () => {
    await salvarPerfil(PERFIL);
    render(<App />);
    expect(await screen.findByRole('heading', { name: 'Hoje' })).toBeInTheDocument();
    const nav = screen.getByRole('navigation', { name: 'Principal' });
    const links = nav.querySelectorAll('a');
    expect(links).toHaveLength(5);
    expect(Array.from(links).map((a) => a.textContent)).toEqual(['Hoje', 'Ações', 'Segunda', 'Tendências', 'Ajustes']);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

```bash
pnpm vitest run src/app/App.test.tsx
```

Esperado: `Failed to resolve import "./App"`.

- [ ] **Step 3: Implementar**

`app/src/app/indexedDb.ts`:

```ts
/** false em modo privado de alguns navegadores ou quando a API não existe. */
export function indexedDbDisponivel(): boolean {
  try {
    return typeof indexedDB !== 'undefined' && indexedDB !== null;
  } catch {
    return false;
  }
}
```

`app/src/app/App.tsx`:

```tsx
import type { ReactNode } from 'react';
import { HashRouter, Routes, Route, NavLink, Navigate, useLocation } from 'react-router';
import { useContexto } from '@/ui/hooks/useContexto';
import { Hoje } from '@/ui/telas/Hoje';
import { Perfil } from '@/ui/telas/Perfil';
import { Acoes } from '@/ui/telas/Acoes';
import { Segunda } from '@/ui/telas/Segunda';
import { Exames } from '@/ui/telas/Exames';
import { Tendencias } from '@/ui/telas/Tendencias';
import { Ajustes } from '@/ui/telas/Ajustes';
import { indexedDbDisponivel } from './indexedDb';
import './tema.css';

const NAV = [
  { para: '/', rotulo: 'Hoje' },
  { para: '/acoes', rotulo: 'Ações' },
  { para: '/segunda', rotulo: 'Segunda' },
  { para: '/tendencias', rotulo: 'Tendências' },
  { para: '/ajustes', rotulo: 'Ajustes' },
];

function Guarda({ children }: { children: ReactNode }) {
  const { carregando, semPerfil } = useContexto();
  const { pathname } = useLocation();
  if (carregando) return <p className="carregando">Carregando…</p>;
  if (semPerfil && pathname !== '/perfil') return <Navigate to="/perfil" replace />;
  return <>{children}</>;
}

export function App() {
  const semDb = !indexedDbDisponivel();
  return (
    <HashRouter>
      <div className="app">
        <main className="conteudo">
          {semDb && (
            <p className="aviso" role="alert">
              Este navegador não deixa guardar dados (modo privado?). O que você registrar some ao fechar a aba — exporte em Ajustes antes de sair.
            </p>
          )}
          <Guarda>
            <Routes>
              <Route path="/" element={<Hoje />} />
              <Route path="/perfil" element={<Perfil />} />
              <Route path="/acoes" element={<Acoes />} />
              <Route path="/segunda" element={<Segunda />} />
              <Route path="/exames" element={<Exames />} />
              <Route path="/tendencias" element={<Tendencias />} />
              <Route path="/ajustes" element={<Ajustes />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Guarda>
        </main>
        <nav className="nav" aria-label="Principal">
          {NAV.map((i) => (
            <NavLink key={i.para} to={i.para} end={i.para === '/'} className={({ isActive }) => (isActive ? 'ativo' : undefined)}>
              {i.rotulo}
            </NavLink>
          ))}
        </nav>
      </div>
    </HashRouter>
  );
}
```

`app/src/app/main.tsx`:

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

`app/index.html` (completo; a tag `<link>` das fontes tem fallback nos tokens `--sans`/`--mono`, então offline a app continua legível):

```html
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="theme-color" content="#F5F6F3" media="(prefers-color-scheme: light)" />
    <meta name="theme-color" content="#151A18" media="(prefers-color-scheme: dark)" />
    <meta name="description" content="Diário local de hábitos ligados à densidade mitocondrial. Não prescreve; mostra onde você está e o próximo passo." />
    <link rel="icon" href="/icone.svg" type="image/svg+xml" />
    <link rel="apple-touch-icon" href="/icones/icone-192.png" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" />
    <title>Fornalha Metabólica</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/app/main.tsx"></script>
  </body>
</html>
```

(`/icone.svg` e `/icones/icone-192.png` são criados na Task 11; até lá o navegador só loga 404 do ícone.)

- [ ] **Step 4: Rodar e ver passar**

```bash
pnpm vitest run src/app/App.test.tsx
```

Esperado: `✓ src/app/App.test.tsx (2 tests)`.

- [ ] **Step 5: Suíte inteira, lint e build**

```bash
pnpm vitest run
pnpm lint
pnpm build
```

Esperado: todos os arquivos `passed`; lint sem erro (em especial a regra `no-restricted-paths`: nada em `src/dominio` importa de `src/ui`); build gera `dist/`.

- [ ] **Step 6: Verificação manual**

```bash
pnpm dev
```

Abrir no navegador com largura 400 px (DevTools → modo dispositivo). Conferir: sem perfil cai em `#/perfil`; salvar leva a `#/` com o check-in; nenhuma barra de scroll horizontal; alternar o tema do sistema muda as cores.

- [ ] **Step 7: Commit**

```bash
git -C .. add app/index.html app/src/app
git -C .. commit -m "feat: shell com HashRouter, nav inferior, guarda de perfil e aviso de IndexedDB"
```

Se o `main.tsx` antigo do scaffold foi removido: `git -C .. add -A app/src` antes do commit.

---

### Task 11: PWA — manifest, service worker, ícones

**Files:**
- Create: `app/public/icone.svg`
- Create: `app/scripts/icones.mjs`
- Create: `app/public/icones/icone-192.png`, `app/public/icones/icone-512.png` (gerados pelo script)
- Modify: `app/vite.config.ts` (plugin `VitePWA`)
- Modify: `app/package.json` (script `icones`)

**Interfaces:**
- Consumes: `vite-plugin-pwa` (`VitePWA`), `sharp`.
- Produces: manifest `Fornalha Metabólica` / `Fornalha`, `display: standalone`, `theme_color`/`background_color`, ícones 192/512; SW `autoUpdate` com o shell em cache (offline completo).

- [ ] **Step 1: Ícone SVG (chama em duas cores)**

`app/public/icone.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="104" fill="#1C2421"/>
  <path fill="#E5A253" d="M256 60c14 70 92 118 92 214a92 92 0 0 1-184 0c0-42 18-70 40-98-2 40 18 62 38 62 6-56-24-104 14-178z"/>
  <path fill="#F5F6F3" d="M256 232c10 40 50 60 50 104a50 50 0 0 1-100 0c0-30 18-48 28-70 0 24 12 36 22 36 4-26-10-42 0-70z"/>
</svg>
```

- [ ] **Step 2: Script de ícones**

`app/scripts/icones.mjs`:

```js
// Gera public/icones/icone-192.png e icone-512.png a partir de public/icone.svg.
import sharp from 'sharp';
import { mkdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const svg = await readFile(path.join(raiz, 'public', 'icone.svg'));
const destino = path.join(raiz, 'public', 'icones');
await mkdir(destino, { recursive: true });

for (const tamanho of [192, 512]) {
  const arquivo = path.join(destino, `icone-${tamanho}.png`);
  await sharp(svg).resize(tamanho, tamanho).png().toFile(arquivo);
  console.log(`gerado ${path.relative(raiz, arquivo)}`);
}
```

Em `app/package.json`, em `"scripts"`, acrescente:

```json
"icones": "node scripts/icones.mjs"
```

Rodar:

```bash
pnpm icones
ls -la public/icones
```

Esperado: `gerado public/icones/icone-192.png` e `gerado public/icones/icone-512.png`; dois PNGs listados.

- [ ] **Step 3: Plugin PWA no `vite.config.ts`**

Arquivo completo (`app/vite.config.ts`). Se o plano 01 tiver outros itens em `plugins` ou em `test` (por exemplo `coverage`), mantenha-os; o que não pode mudar é o alias `@`, o `environment: 'jsdom'`, o `setupFiles` e o `VitePWA`:

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icone.svg', 'icones/icone-192.png', 'icones/icone-512.png'],
      manifest: {
        name: 'Fornalha Metabólica',
        short_name: 'Fornalha',
        description: 'Diário local de hábitos ligados à densidade mitocondrial. Não prescreve; mostra onde você está e o próximo passo.',
        lang: 'pt-BR',
        start_url: '/',
        display: 'standalone',
        background_color: '#F5F6F3',
        theme_color: '#1C2421',
        icons: [
          { src: 'icones/icone-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icones/icone-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icones/icone-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,json}'],
        navigateFallback: 'index.html',
      },
    }),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});
```

- [ ] **Step 4: Verificação — build e preview**

```bash
pnpm build && pnpm preview
```

Esperado no build: linhas `PWA v…`, `precache N entries`, `files generated: dist/sw.js, dist/workbox-*.js, dist/manifest.webmanifest`.

No navegador (URL do preview):
1. DevTools → Application → Manifest: nome "Fornalha Metabólica", short name "Fornalha", display standalone, dois ícones.
2. Application → Service Workers: `sw.js` ativado.
3. Network → marcar "Offline" → recarregar: a app abre e navega entre as telas.
4. `pnpm vitest run` continua verde (o plugin não muda os testes).

- [ ] **Step 5: Commit**

```bash
git -C .. add app/public/icone.svg app/public/icones app/scripts/icones.mjs app/vite.config.ts app/package.json app/pnpm-lock.yaml
git -C .. commit -m "feat: PWA com manifest, service worker autoUpdate e ícones gerados"
```

---

### Task 12: Sincronizar o brain — `vira-feature-em: v1` nas notas das ações

**Files:**
- Create: `app/scripts/marcar-brain.mjs`
- Modify: `docs/brain/acoes/<id>.md` (22 notas; só o frontmatter)

**Interfaces:**
- Consumes: `docs/brain/acoes/acoes.json` (`acoes[].id`), `docs/brain/acoes/<id>.md`.
- Produces: em cada nota cujo frontmatter não tem `vira-feature-em`, insere a linha `vira-feature-em: v1` antes do `---` de fechamento. Idempotente: rodar duas vezes não muda nada na segunda.

O frontmatter das notas tem esta forma (ex.: `docs/brain/acoes/tres-tiros.md`):

```yaml
---
tipo: acao
id: tres-tiros
grupo: Movimento
nivel: nucleo
evidencia: forte
setas: [1]
fonte-unica: acoes.json
---
```

- [ ] **Step 1: Script**

`app/scripts/marcar-brain.mjs`:

```js
// Marca `vira-feature-em: v1` no frontmatter de docs/brain/acoes/<id>.md
// para cada ação de acoes.json que ainda não tem a chave. Idempotente.
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const brain = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'docs', 'brain');
const catalogo = JSON.parse(await readFile(path.join(brain, 'acoes', 'acoes.json'), 'utf8'));

let marcadas = 0;
let jaTinham = 0;
for (const acao of catalogo.acoes) {
  const arquivo = path.join(brain, 'acoes', `${acao.id}.md`);
  const texto = await readFile(arquivo, 'utf8');
  const m = texto.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) {
    console.error(`sem frontmatter: ${acao.id}.md`);
    process.exitCode = 1;
    continue;
  }
  if (/^vira-feature-em:/m.test(m[1])) {
    jaTinham++;
    continue;
  }
  const novo = texto.replace(m[0], `---\n${m[1]}\nvira-feature-em: v1\n---\n`);
  await writeFile(arquivo, novo);
  marcadas++;
}
console.log(`${marcadas} nota(s) marcada(s), ${jaTinham} já tinha(m) vira-feature-em`);
```

- [ ] **Step 2: Rodar e conferir**

```bash
node scripts/marcar-brain.mjs
grep -L "vira-feature-em" ../docs/brain/acoes/*.md | grep -v 00-catalogo
node scripts/marcar-brain.mjs
head -10 ../docs/brain/acoes/tres-tiros.md
```

Esperado: primeira execução `22 nota(s) marcada(s), 0 já tinha(m)`; o `grep -L` não lista nenhuma nota de ação; segunda execução `0 nota(s) marcada(s), 22 já tinha(m)`; o `head` mostra `vira-feature-em: v1` como última linha do frontmatter.

- [ ] **Step 3: Commit**

```bash
git -C .. add app/scripts/marcar-brain.mjs docs/brain/acoes
git -C .. commit -m "chore: marca vira-feature-em v1 nas 22 notas de ação do brain"
```

---

## Checklist final do plano

- [ ] `pnpm lint && pnpm vitest run && pnpm build` verdes em `app/`.
- [ ] Todas as telas do spec §5 têm rota e teste: Perfil (T4), Hoje (T5), Ações (T6), Segunda + Exames (T7), Tendências (T8), Ajustes (T9); shell (T10).
- [ ] Nenhum `if` por id de campo na UI além de `dia.moveu` (T5), documentado.
- [ ] Nenhuma cor literal fora de `tema.css` (exceto `index.html` `theme-color`, o manifest e o SVG do ícone, que não são CSS da app).
- [ ] PWA instalável e offline verificados no preview (T11).
- [ ] Brain marcado (T12).
