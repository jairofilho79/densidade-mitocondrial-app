# Fornalha 01 — Base do domínio: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar a pasta `app/` (Vite 6 + React 19 + TypeScript strict + Vitest 3 + ESLint + CI) e a base do domínio puro: os tipos de dados (`tipos.ts`), o catálogo de ações sincronizado do brain com teste de hash (`catalogo/`), o registro de campos (`campos.ts`) e os derivados numéricos (`derivados.ts`) com as fórmulas da PoC, tudo testado sem browser. Ao final deste plano os planos 02 (metas), 03 (tendência + dados) e 04 (UI + PWA) têm exatamente os módulos e assinaturas de que dependem.

**Architecture:** `app/src/dominio/` é TypeScript puro — não importa React, Dexie, DOM, `src/dados`, `src/ui` nem `src/app`; a regra é imposta por ESLint (`import/no-restricted-paths` + `no-restricted-imports`). O catálogo `acoes.json` é copiado de `docs/brain/acoes/acoes.json` por `app/scripts/sync-catalogo.mjs`, que grava também `acoes.hash` (sha256); um teste falha se a cópia divergir do brain. `campos.ts` declara cada campo de `dia`, `semana`, `mes` e `exame` uma única vez (nível, tipo, rótulo, faixa, condição por perfil e quais ações desbloqueia) — as telas do plano 04 são geradas daqui. `derivados.ts` transcreve a função `D()` da PoC (`docs/brain/poc/acoes-atomicas.template.html`) e acrescenta os derivados de janela (dias parado, médias, jejum, sono, variação de deitar). Nada aqui grava nada: derivados são calculados a cada chamada.

**Tech Stack:** pnpm, Node ≥ 20, Vite 6, React 19, TypeScript 5 (strict), Vitest 3 + jsdom + @testing-library/react, ESLint 9 flat config + typescript-eslint + eslint-plugin-import, GitHub Actions.
**Spec:** docs/superpowers/specs/2026-09-14-fornalha-app-design.md
**Contratos:** docs/superpowers/plans/2026-09-14-fornalha-00-contratos.md

## Global Constraints

- Pasta `app/` na raiz do repo; gerenciador `pnpm`; Node ≥ 20 (`engines.node: ">=20"`).
- Vite 6, React 19, TypeScript 5 strict, Vitest 3 + jsdom + `@testing-library/react`, ESLint 9 flat config com `typescript-eslint` e `eslint-plugin-import`.
- Alias `@/` → `app/src/` (Vite + tsconfig `paths`). Dentro de `src/dominio/**` usar só imports relativos.
- Regra de dependência: `src/dominio/**` não importa de `src/dados`, `src/ui`, `src/app`, `react`, `react-dom`, `dexie`, `dexie-react-hooks`. Verificado por lint (Task 1, Step 8).
- Nomes e assinaturas de `2026-09-14-fornalha-00-contratos.md` são obrigatórios; este plano não renomeia nada. Única correção de tipo (não de nome): `AcaoCatalogo.evidencia.fontes` e `MedidaCatalogo.fontes` são `string` (é o que existe em `acoes.json`; os planos 02/04 já os usam como string) e `setas` é `Array<string | number>` (o JSON mistura números e strings).
- Identificadores (arquivos, funções, variáveis, chaves) em português sem acento, camelCase; textos ao usuário em português com acento.
- Testes com Vitest; `dominio/` testado sem DOM (o ambiente jsdom global não atrapalha).
- CI (GitHub Actions) roda `pnpm install --frozen-lockfile && pnpm lint && pnpm test && pnpm build` dentro de `app/`.
- Commits pequenos, só com os arquivos do task, mensagem em português com prefixo `feat:`/`test:`/`chore:`, feitos na raiz do repo (branch `main`).
- Os comandos `pnpm …`/`node …` rodam dentro de `app/`; os comandos `git …` rodam na raiz do repo (`/Volumes/SSD 2TB SD/dev/densidade-mitocondrial-app`). Como o caminho tem espaços, sempre entre aspas.
- Fórmulas de `derivados.ts` são as da PoC `D()` (IMC, fcMax = 208 − 0,7·idade, Mifflin-St Jeor, PAL, TDEE, água, cortes). A função `pos()` segue o **contrato** (`clamp((v−lo)/(hi−lo)·0.25+0.5, 0.02, 0.98)`), não a versão em três trechos da PoC — o plano 02 já assume a do contrato.
- `pnpm` não está instalado na máquina de referência: ative com `corepack enable && corepack prepare pnpm@10.12.1 --activate` (ou `npm i -g pnpm@10`).

---

## Convenções deste plano

- `HOJE` nos testes é sempre `'2026-09-14'` (segunda-feira). `ONTEM` é `'2026-09-13'`.
- Perfil de referência nos testes (`perfilBase`): 90 kg, 175 cm, 45 anos, `'H'`, levanta 06:30, deita 23:30, café `'diario'`, álcool `'nao'`. Números esperados: `imc 29.4`, `fcMax 177`, `fc60 106`, `fc70 124`, `fc85 150`, `rmr 1774`, água `2.0 L` / `8 copos`. (Conferência: 10·90 + 6,25·175 − 5·45 + 5 = 900 + 1093,75 − 225 + 5 = 1773,75 → 1774.)
- Três estados por campo (spec §3): `undefined` = não registrou; `null` = "não se aplica hoje" (só nos tipos `hora-ou-nao` e `inteiro-ou-nao`); valor = registrou.

---

### Task 1: Scaffold `app/` — Vite + React + TS strict + Vitest + ESLint + CI

**Files:**
- Create: `app/package.json`
- Create: `app/tsconfig.json`
- Create: `app/vite.config.ts`
- Create: `app/eslint.config.js`
- Create: `app/index.html`
- Create: `app/src/main.tsx`
- Create: `app/src/app/App.tsx`
- Create: `app/src/setupTests.ts`
- Create: `app/src/vite-env.d.ts`
- Create: `.github/workflows/ci.yml` (na raiz do repo)
- Test: `app/src/app/App.test.tsx`

**Interfaces:**
- Consumes: nada do projeto.
- Produces: scripts `pnpm dev`, `pnpm build`, `pnpm test`, `pnpm lint`; alias `@/`; ambiente de teste jsdom + Testing Library; regra de lint que proíbe `src/dominio/**` de importar `src/dados`, `src/ui`, `src/app`, `react`, `dexie`; workflow de CI.

- [ ] **Step 1: Ativar o pnpm e criar a pasta**

```bash
corepack enable && corepack prepare pnpm@10.12.1 --activate
pnpm -v
mkdir -p "/Volumes/SSD 2TB SD/dev/densidade-mitocondrial-app/app"
cd "/Volumes/SSD 2TB SD/dev/densidade-mitocondrial-app/app"
```

Saída esperada de `pnpm -v`: `10.12.1` (qualquer 10.x serve).

- [ ] **Step 2: Escrever `package.json`**

Arquivo `app/package.json`:

```json
{
  "name": "fornalha",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "description": "Fornalha Metabólica — diário local de hábitos ligados à densidade mitocondrial",
  "packageManager": "pnpm@10.12.1",
  "engines": {
    "node": ">=20"
  },
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit -p tsconfig.json && vite build",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint ."
  }
}
```

- [ ] **Step 3: Instalar dependências**

Dentro de `app/`:

```bash
pnpm add react@^19.1.0 react-dom@^19.1.0
pnpm add -D vite@^6.3.5 @vitejs/plugin-react@^4.5.0 typescript@~5.8.3 @types/react@^19.1.0 @types/react-dom@^19.1.0 @types/node@^22.15.0
pnpm add -D vitest@^3.2.0 jsdom@^26.1.0 @testing-library/react@^16.3.0 @testing-library/dom@^10.4.0 @testing-library/jest-dom@^6.6.0
pnpm add -D eslint@^9.28.0 @eslint/js@^9.28.0 typescript-eslint@^8.33.0 eslint-plugin-import@^2.31.0 eslint-import-resolver-typescript@^4.4.0 globals@^16.2.0
```

Saída esperada: cada comando termina com `Done in …s` e `app/pnpm-lock.yaml` existe. As versões de patch podem variar; o que importa é o major (Vite 6, React 19, Vitest 3, ESLint 9, TS 5).

- [ ] **Step 4: Escrever a configuração de TypeScript, Vite e HTML**

Arquivo `app/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "noEmit": true,
    "useDefineForClassFields": true,
    "types": ["vite/client", "node"],
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src", "vite.config.ts"]
}
```

Arquivo `app/vite.config.ts`:

```ts
/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
```

Arquivo `app/index.html`:

```html
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Fornalha Metabólica</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Arquivo `app/src/vite-env.d.ts`:

```ts
/// <reference types="vite/client" />
```

Arquivo `app/src/setupTests.ts`:

```ts
// Matchers do jest-dom (toBeInTheDocument etc.) para o Vitest.
import '@testing-library/jest-dom/vitest';
```

Arquivo `app/src/main.tsx`:

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';

const raiz = document.getElementById('root');
if (!raiz) throw new Error('Elemento #root não encontrado em index.html.');

createRoot(raiz).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 5: Escrever o teste de fumaça (falha: `App` não existe)**

Arquivo `app/src/app/App.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App', () => {
  it('renderiza o nome do app', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Fornalha Metabólica' })).toBeInTheDocument();
  });
});
```

Rodar:

```bash
pnpm test
```

Saída esperada: falha com `Error: Failed to resolve import "./App" from "src/app/App.test.tsx"` (ou `Cannot find module './App'`).

- [ ] **Step 6: Escrever `App.tsx` mínimo e ver o teste passar**

Arquivo `app/src/app/App.tsx`:

```tsx
// Shell provisório. O plano 04 substitui por rotas e telas.
export function App() {
  return (
    <main>
      <h1>Fornalha Metabólica</h1>
      <p>Em construção.</p>
    </main>
  );
}
```

Rodar:

```bash
pnpm test
```

Saída esperada:

```
 ✓ src/app/App.test.tsx (1 test)
 Test Files  1 passed (1)
      Tests  1 passed (1)
```

Depois:

```bash
pnpm build
```

Saída esperada: termina com `✓ built in …ms` e a pasta `app/dist/` existe (está no `.gitignore` da raiz).

- [ ] **Step 7: Escrever o ESLint flat config com a regra de dependência**

Arquivo `app/eslint.config.js`:

```js
// ESLint 9 (flat config). Além do recomendado de JS/TS, impõe a regra de
// dependência da spec §2: src/dominio/** não importa de src/dados, src/ui,
// src/app, react nem dexie.
import js from '@eslint/js';
import importPlugin from 'eslint-plugin-import';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const MSG_CAMADA =
  'src/dominio não pode importar de src/dados, src/ui ou src/app (regra de dependência da spec §2).';
const MSG_PACOTE =
  'src/dominio é TypeScript puro: não importa react nem dexie (regra de dependência da spec §2).';

export default tseslint.config(
  { ignores: ['dist', 'dev-dist', 'coverage', 'node_modules'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{js,mjs,ts,tsx}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { import: importPlugin },
    settings: {
      'import/resolver': {
        typescript: { project: './tsconfig.json' },
        node: true,
      },
    },
    rules: {
      'import/no-restricted-paths': [
        'error',
        {
          basePath: './src',
          zones: [
            { target: './dominio', from: './dados', message: MSG_CAMADA },
            { target: './dominio', from: './ui', message: MSG_CAMADA },
            { target: './dominio', from: './app', message: MSG_CAMADA },
          ],
        },
      ],
    },
  },
  {
    files: ['src/dominio/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'react', message: MSG_PACOTE },
            { name: 'react-dom', message: MSG_PACOTE },
            { name: 'dexie', message: MSG_PACOTE },
            { name: 'dexie-react-hooks', message: MSG_PACOTE },
          ],
          patterns: [
            {
              group: ['react/*', 'react-dom/*', 'dexie/*', '@/dados', '@/dados/*', '@/ui', '@/ui/*', '@/app', '@/app/*'],
              message: MSG_CAMADA,
            },
          ],
        },
      ],
    },
  },
);
```

Rodar:

```bash
pnpm lint
```

Saída esperada: nenhuma saída (exit 0). Se aparecer `Parsing error` em `eslint.config.js`, confirme que `package.json` tem `"type": "module"`.

- [ ] **Step 8: Provar que a regra de dependência pega (teste que falha de propósito) e limpar**

Criar dois arquivos temporários. `app/src/dados/_tmp.ts`:

```ts
export const tmp = 1;
```

`app/src/dominio/_violacao.ts`:

```ts
import { useState } from 'react';
import { tmp } from '../dados/_tmp';

export const x = [useState, tmp];
```

Rodar:

```bash
pnpm lint
```

Saída esperada: **2 erros** em `src/dominio/_violacao.ts`:

```
  1:1  error  'react' import is restricted from being used. src/dominio é TypeScript puro…  no-restricted-imports
  2:1  error  Unexpected path "../dados/_tmp" imported in restricted zone. src/dominio não pode importar…  import/no-restricted-paths
```

Apagar os dois arquivos temporários e confirmar que o lint volta a passar:

```bash
rm src/dominio/_violacao.ts src/dados/_tmp.ts
rmdir src/dominio src/dados
pnpm lint
```

Saída esperada: exit 0, sem mensagens.

- [ ] **Step 9: Escrever o workflow de CI**

Arquivo `.github/workflows/ci.yml` (na raiz do repo, não em `app/`):

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  ci:
    name: lint, test, build
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: app
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 10

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
          cache-dependency-path: app/pnpm-lock.yaml

      - name: Instalar, lint, testar e buildar
        run: pnpm install --frozen-lockfile && pnpm lint && pnpm test && pnpm build
```

Verificação local do mesmo encadeamento (dentro de `app/`):

```bash
pnpm install --frozen-lockfile && pnpm lint && pnpm test && pnpm build
```

Saída esperada: `Lockfile is up to date`, lint sem saída, `1 passed`, `✓ built`.

- [ ] **Step 10: Commit**

Na raiz do repo:

```bash
cd "/Volumes/SSD 2TB SD/dev/densidade-mitocondrial-app"
git add app/package.json app/pnpm-lock.yaml app/tsconfig.json app/vite.config.ts app/eslint.config.js app/index.html app/src/main.tsx app/src/app/App.tsx app/src/app/App.test.tsx app/src/setupTests.ts app/src/vite-env.d.ts .github/workflows/ci.yml
git status --short
git commit -m "chore: scaffold do app com Vite, React, TypeScript, Vitest, ESLint e CI"
```

`git status --short` antes do commit não deve listar `app/node_modules` nem `app/dist` (já ignorados).

---

### Task 2: `src/dominio/tipos.ts` — tipos de dados

**Files:**
- Create: `app/src/dominio/tipos.ts`
- Test: `app/src/dominio/tipos.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces (exatamente como nos contratos):
  - `export type Sexo = 'H' | 'M'`
  - `export type Hora = string`, `DataISO = string`, `SemanaISO = string`, `MesISO = string`, `Fonte = 'manual' | 'health'`
  - `export interface Perfil`, `Dia`, `EventoTreino`, `EventoRefeicao`, `Semana`, `Mes`, `Exame`

- [ ] **Step 1: Escrever o teste (falha: módulo não existe)**

O teste tem duas partes: asserções de runtime (fixtures válidas) e asserções de compilação (`@ts-expect-error` em valores inválidos). A segunda parte é verificada por `pnpm build` (tsc), a primeira por `pnpm test`.

Arquivo `app/src/dominio/tipos.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { Dia, EventoRefeicao, EventoTreino, Exame, Mes, Perfil, Semana } from './tipos';

const perfil: Perfil = {
  peso: 90,
  altura: 175,
  idade: 45,
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

const dia: Dia = {
  data: '2026-09-14',
  deitou: '23:30',
  levantou: '06:30',
  comoAcordei: 4,
  fome: 3,
  comiSemFome: false,
  ultimoCafe: null, // três estados: undefined = não registrou, null = não tomou, "HH:MM" = hora
  jantarFim: '19:00',
  passos: 6200,
  moveu: true,
  atualizadoEm: '2026-09-14T08:00:00.000Z',
};

const treino: EventoTreino = {
  id: 'ev-1',
  data: '2026-09-14',
  hora: '07:00',
  tipo: 'tiros',
  minutos: 15,
  tiros: 3,
  atualizadoEm: '2026-09-14T07:20:00.000Z',
};

const refeicao: EventoRefeicao = {
  id: 'ref-1',
  data: '2026-09-14',
  hora: '12:00',
  proteinaG: 30,
  comecouPelaFibra: true,
  atualizadoEm: '2026-09-14T12:30:00.000Z',
};

const semana: Semana = { semana: '2026-W37', cintura: 100, sessoesTiros: 3, atualizadoEm: '2026-09-14T08:00:00.000Z' };
const mes: Mes = { mes: '2026-09', panturrilha: 38, atualizadoEm: '2026-09-07T08:00:00.000Z' };
const exame: Exame = { data: '2026-09-01', glicemia: 92, hba1c: 5.4, atualizadoEm: '2026-09-01T08:00:00.000Z' };

// Asserções de compilação: o tsc (pnpm build) falha se alguma linha abaixo passar a compilar.
// @ts-expect-error comoAcordei só aceita 1–5
const diaInvalido1: Dia = { data: '2026-09-14', comoAcordei: 6, atualizadoEm: '' };
// @ts-expect-error sexo só aceita 'H' | 'M'
const perfilInvalido: Perfil = { ...perfil, sexo: 'X' };
// @ts-expect-error tipo de treino restrito
const treinoInvalido: EventoTreino = { ...treino, tipo: 'yoga' };
// @ts-expect-error jantarFim não aceita null (só ultimoCafe e alcoolDoses aceitam)
const diaInvalido2: Dia = { data: '2026-09-14', jantarFim: null, atualizadoEm: '' };
const diaValidoNulls: Dia = { data: '2026-09-14', ultimoCafe: null, alcoolDoses: null, atualizadoEm: '' };

describe('tipos do domínio', () => {
  it('as fixtures compilam e carregam as chaves naturais', () => {
    expect(dia.data).toBe('2026-09-14');
    expect(semana.semana).toBe('2026-W37');
    expect(mes.mes).toBe('2026-09');
    expect(exame.data).toBe('2026-09-01');
    expect(treino.tipo).toBe('tiros');
    expect(refeicao.comecouPelaFibra).toBe(true);
    expect(perfil.cafe).toBe('diario');
  });

  it('ultimoCafe e alcoolDoses distinguem "não registrou" de "não se aplica"', () => {
    expect(diaValidoNulls.ultimoCafe).toBeNull();
    expect(diaValidoNulls.alcoolDoses).toBeNull();
    expect(diaValidoNulls.jantarFim).toBeUndefined();
  });

  it('fonte por campo está preparado para a v2', () => {
    const comFonte: Dia = { ...dia, fonte: { passos: 'health' } };
    expect(comFonte.fonte?.passos).toBe('health');
  });

  it('as fixtures inválidas existem só para o tsc', () => {
    expect([diaInvalido1, perfilInvalido, treinoInvalido, diaInvalido2]).toHaveLength(4);
  });
});
```

Rodar:

```bash
pnpm test
```

Saída esperada: falha com `Failed to resolve import "./tipos" from "src/dominio/tipos.test.ts"`.

- [ ] **Step 2: Escrever `tipos.ts` (cópia literal dos contratos)**

Arquivo `app/src/dominio/tipos.ts`:

```ts
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
```

- [ ] **Step 3: Rodar testes, tsc e lint**

```bash
pnpm test && pnpm build && pnpm lint
```

Saída esperada: `Test Files  2 passed (2)`, `Tests  5 passed (5)`; o `tsc` do build passa (as linhas `@ts-expect-error` de fato dão erro de tipo, como devem); lint sem saída.

- [ ] **Step 4: Commit**

```bash
cd "/Volumes/SSD 2TB SD/dev/densidade-mitocondrial-app"
git add app/src/dominio/tipos.ts app/src/dominio/tipos.test.ts
git commit -m "feat: tipos de dados do domínio (Perfil, Dia, eventos, Semana, Mes, Exame)"
```

---

### Task 3: Catálogo sincronizado do brain (`catalogo/`) + script de sync + teste de hash

**Files:**
- Create: `app/scripts/sync-catalogo.mjs`
- Create: `app/src/dominio/catalogo/tipos.ts`
- Create: `app/src/dominio/catalogo/index.ts`
- Create (gerados pelo script, versionados): `app/src/dominio/catalogo/acoes.json`, `app/src/dominio/catalogo/acoes.hash`
- Test: `app/src/dominio/catalogo/catalogo.test.ts`

**Interfaces:**
- Consumes: `docs/brain/acoes/acoes.json` (fonte de verdade).
- Produces:
  - `export type AcaoId = 'tres-tiros' | … | 'panturrilha-preensao'` (22 ids)
  - `export type Grupo = 'Movimento' | 'Sono e ritmo' | 'Alimentação' | 'Corpo e medida'`
  - `export interface AcaoCatalogo`, `MedidaCatalogo`, `Catalogo`
  - `export const catalogo: Catalogo`
  - `export function acaoDoCatalogo(id: AcaoId): AcaoCatalogo` (lança `Error` se o id não existir)
  - Script: `node scripts/sync-catalogo.mjs` copia o JSON e grava `acoes.hash` (sha256 hex do conteúdo bruto).

- [ ] **Step 1: Escrever o script de sync**

Arquivo `app/scripts/sync-catalogo.mjs`:

```js
#!/usr/bin/env node
// Copia docs/brain/acoes/acoes.json (fonte de verdade) para
// app/src/dominio/catalogo/acoes.json e grava o sha256 do conteúdo em acoes.hash.
// O teste catalogo.test.ts falha se a cópia estiver dessincronizada do brain.
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url)); // app/scripts
const origem = resolve(aqui, '../../docs/brain/acoes/acoes.json');
const destinoDir = resolve(aqui, '../src/dominio/catalogo');
const destino = resolve(destinoDir, 'acoes.json');
const arquivoHash = resolve(destinoDir, 'acoes.hash');

const conteudo = readFileSync(origem);
const hash = createHash('sha256').update(conteudo).digest('hex');

mkdirSync(destinoDir, { recursive: true });
writeFileSync(destino, conteudo);
writeFileSync(arquivoHash, `${hash}\n`);

const json = JSON.parse(conteudo.toString('utf8'));
console.log(
  `Catálogo sincronizado: ${json.acoes.length} ações, ${json.medidas.length} medidas, ${Object.keys(json.variaveis).length} variáveis.`,
);
console.log(`sha256 ${hash}`);
```

Rodar (dentro de `app/`):

```bash
node scripts/sync-catalogo.mjs
cat src/dominio/catalogo/acoes.hash
```

Saída esperada:

```
Catálogo sincronizado: 22 ações, 9 medidas, 28 variáveis.
sha256 <64 caracteres hex>
```

e o `cat` mostra os mesmos 64 caracteres.

- [ ] **Step 2: Escrever o teste (falha: `./index` não existe)**

Arquivo `app/src/dominio/catalogo/catalogo.test.ts`:

```ts
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { acaoDoCatalogo, catalogo } from './index';
import type { AcaoId, Grupo } from './tipos';

// Caminhos relativos a este arquivo: app/src/dominio/catalogo/ → 4 níveis acima é a raiz do repo.
const BRAIN = new URL('../../../../docs/brain/acoes/acoes.json', import.meta.url);
const COPIA = new URL('./acoes.json', import.meta.url);
const HASH = new URL('./acoes.hash', import.meta.url);

function sha256(conteudo: Buffer): string {
  return createHash('sha256').update(conteudo).digest('hex');
}

const IDS: AcaoId[] = [
  'tres-tiros',
  'levante-peso',
  'some-150',
  'levante-a-cada-30',
  'ande-depois-do-jantar',
  'nunca-dois-dias',
  'seis-mil-passos',
  'durma-7',
  'ultimo-cafe',
  'jante-cedo',
  'anote-o-sono',
  'proteina-no-prato',
  'fibra-no-prato',
  'feche-a-cozinha',
  'troque-o-doce',
  'comida-de-verdade',
  'beba-pela-sede',
  'se-beber',
  'pergunte-a-fome',
  'emagreca-devagar',
  'meca-a-cintura',
  'panturrilha-preensao',
];

const GRUPOS: Grupo[] = ['Movimento', 'Sono e ritmo', 'Alimentação', 'Corpo e medida'];

describe('catálogo sincronizado com o brain', () => {
  it('acoes.hash bate com o sha256 de docs/brain/acoes/acoes.json', () => {
    const brain = readFileSync(fileURLToPath(BRAIN));
    const hash = readFileSync(fileURLToPath(HASH), 'utf8').trim();
    expect(hash, 'Catálogo dessincronizado: rode `pnpm sync-catalogo` dentro de app/').toBe(sha256(brain));
  });

  it('a cópia local é byte a byte igual ao brain', () => {
    const brain = readFileSync(fileURLToPath(BRAIN));
    const copia = readFileSync(fileURLToPath(COPIA));
    expect(copia.equals(brain), 'Catálogo dessincronizado: rode `pnpm sync-catalogo` dentro de app/').toBe(true);
  });
});

describe('conteúdo do catálogo', () => {
  it('tem as 22 ações do contrato, na ordem do brain', () => {
    expect(catalogo.acoes.map((a) => a.id)).toEqual(IDS);
  });

  it('tem 9 medidas e 28 variáveis', () => {
    expect(catalogo.medidas).toHaveLength(9);
    expect(catalogo.medidas.map((m) => m.id)).toEqual([
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
    expect(Object.keys(catalogo.variaveis)).toHaveLength(28);
  });

  it('toda ação pertence a um dos 4 grupos e tem os campos obrigatórios', () => {
    for (const a of catalogo.acoes) {
      expect(GRUPOS).toContain(a.grupo);
      expect(a.titulo.length).toBeGreaterThan(0);
      expect(a.gatilho.length).toBeGreaterThan(0);
      expect(a.acao_minima.length).toBeGreaterThan(0);
      expect(a.registro).toHaveLength(3);
      expect(Array.isArray(a.faixa.variaveis)).toBe(true);
      expect(typeof a.evidencia.grau).toBe('string');
      expect(typeof a.evidencia.fontes).toBe('string');
    }
  });

  it('as variáveis de faixa existem em catalogo.variaveis', () => {
    for (const a of catalogo.acoes) {
      for (const v of a.faixa.variaveis) {
        expect(catalogo.variaveis, `ação ${a.id} usa variável desconhecida "${v}"`).toHaveProperty(v);
      }
    }
  });

  it('acaoDoCatalogo devolve a ação pelo id e lança para id desconhecido', () => {
    expect(acaoDoCatalogo('durma-7').titulo).toBe('Durma 7 horas');
    expect(acaoDoCatalogo('durma-7').grupo).toBe('Sono e ritmo');
    expect(() => acaoDoCatalogo('nao-existe' as AcaoId)).toThrow("Ação 'nao-existe' não existe no catálogo.");
  });
});
```

Rodar:

```bash
pnpm test src/dominio/catalogo
```

Saída esperada: falha com `Failed to resolve import "./index" from "src/dominio/catalogo/catalogo.test.ts"`.

- [ ] **Step 3: Escrever `catalogo/tipos.ts`**

Arquivo `app/src/dominio/catalogo/tipos.ts`:

```ts
// Tipos do catálogo acoes.json (22 ações, 9 medidas, 28 variáveis).
// Fonte: contratos. Correção de tipo (não de nome): `fontes` é string no JSON
// e `setas` mistura números e strings.

export type AcaoId =
  | 'tres-tiros'
  | 'levante-peso'
  | 'some-150'
  | 'levante-a-cada-30'
  | 'ande-depois-do-jantar'
  | 'nunca-dois-dias'
  | 'seis-mil-passos'
  | 'durma-7'
  | 'ultimo-cafe'
  | 'jante-cedo'
  | 'anote-o-sono'
  | 'proteina-no-prato'
  | 'fibra-no-prato'
  | 'feche-a-cozinha'
  | 'troque-o-doce'
  | 'comida-de-verdade'
  | 'beba-pela-sede'
  | 'se-beber'
  | 'pergunte-a-fome'
  | 'emagreca-devagar'
  | 'meca-a-cintura'
  | 'panturrilha-preensao';

export type Grupo = 'Movimento' | 'Sono e ritmo' | 'Alimentação' | 'Corpo e medida';

export interface AcaoCatalogo {
  id: AcaoId;
  grupo: Grupo;
  titulo: string;
  gatilho: string;
  acao_minima: string;
  descricao: string;
  faixa: { variaveis: string[]; pouco: string; ideal: string; demais: string; regra?: string };
  afeta: { input: string; processo: string; output: string };
  registro: [string, string, string];
  sinal: { output: string; prazo: string };
  seguranca?: string;
  evidencia: { grau: string; fontes: string };
  setas: Array<string | number>;
}

export interface MedidaCatalogo {
  id: string;
  titulo: string;
  como: string;
  para_que: string;
  muda: string;
  fontes: string;
  grau: string;
}

export interface VariavelCatalogo {
  escopo: 'perfil' | 'dia';
  rotulo: string;
  unidade: string;
  padrao: number | string;
}

export interface Catalogo {
  variaveis: Record<string, VariavelCatalogo>;
  acoes: AcaoCatalogo[];
  medidas: MedidaCatalogo[];
}
```

- [ ] **Step 4: Escrever `catalogo/index.ts`**

Arquivo `app/src/dominio/catalogo/index.ts`:

```ts
// Ponto de entrada do catálogo. `acoes.json` é gerado por scripts/sync-catalogo.mjs —
// nunca edite a cópia; edite docs/brain/acoes/acoes.json e rode `pnpm sync-catalogo`.
import acoesJson from './acoes.json';
import type { AcaoCatalogo, AcaoId, Catalogo } from './tipos';

export const catalogo: Catalogo = acoesJson as Catalogo;

export function acaoDoCatalogo(id: AcaoId): AcaoCatalogo {
  const acao = catalogo.acoes.find((a) => a.id === id);
  if (!acao) throw new Error(`Ação '${id}' não existe no catálogo.`);
  return acao;
}
```

Se o `tsc` acusar `TS2352` na linha do `as Catalogo`, é porque `tipos.ts` diverge do JSON em algum campo — corrija `tipos.ts` (a divergência conhecida, `fontes`/`setas`, já está tratada acima); não use `as unknown as`.

- [ ] **Step 5: Rodar testes, tsc e lint**

```bash
pnpm test src/dominio/catalogo && pnpm build && pnpm lint
```

Saída esperada: `✓ src/dominio/catalogo/catalogo.test.ts (7 tests)`; build e lint limpos.

- [ ] **Step 6: Provar que o teste de hash pega dessincronização**

Dentro de `app/`:

```bash
printf '0000000000000000000000000000000000000000000000000000000000000000\n' > src/dominio/catalogo/acoes.hash
pnpm test src/dominio/catalogo
```

Saída esperada: **1 falha** — `acoes.hash bate com o sha256…` com a mensagem ``Catálogo dessincronizado: rode `pnpm sync-catalogo` dentro de app/``.

Restaurar:

```bash
node scripts/sync-catalogo.mjs
pnpm test src/dominio/catalogo
```

Saída esperada: `7 passed`.

- [ ] **Step 7: Commit**

```bash
cd "/Volumes/SSD 2TB SD/dev/densidade-mitocondrial-app"
git add app/scripts/sync-catalogo.mjs app/src/dominio/catalogo/tipos.ts app/src/dominio/catalogo/index.ts app/src/dominio/catalogo/acoes.json app/src/dominio/catalogo/acoes.hash app/src/dominio/catalogo/catalogo.test.ts
git commit -m "feat: catálogo de ações sincronizado do brain com script de sync e teste de hash"
```

---

### Task 4: `src/dominio/campos.ts` — registro de campos

**Files:**
- Create: `app/src/dominio/campos.ts`
- Test: `app/src/dominio/campos.test.ts`

**Interfaces:**
- Consumes: `Perfil`, `Dia`, `Semana`, `Mes`, `Exame` (`./tipos`); `AcaoId` (`./catalogo/tipos`); `catalogo` (`./catalogo`) só no teste.
- Produces (exatamente como nos contratos):
  - `export type CampoId` — união de template literals `dia.<campo>`, `semana.<campo>`, `mes.<campo>`, `exame.<campo>`, `perfil.<campo>` (cópia literal dos contratos)
  - `export type TipoCampo = 'hora' | 'inteiro' | 'decimal' | 'escala' | 'bool' | 'texto' | 'hora-ou-nao' | 'inteiro-ou-nao'`
  - `export interface Campo { id; nivel; tipo; rotulo; ajuda?; unidade?; min?; max?; condicao?; desbloqueia }`
  - `export const CAMPOS: readonly Campo[]` — todos os campos de `dia`, `semana`, `mes`, `exame` (não inclui `perfil.*`; esses ids existem no tipo só para `Meta.precisaDe`)
  - `export function campo(id: CampoId): Campo` — lança `Error` se não existir em `CAMPOS`
  - `export function camposDe(tabela, perfil, nivel = 3): Campo[]` — filtra por tabela, `nivel <= nivel` e `condicao(perfil)`
  - `export function validar(c: Campo, valor: unknown): string | null` — `null` = ok; string = mensagem ao usuário

Tabela de decisão de `desbloqueia` (deduzida de `faixa.variaveis` e do sentido de cada ação em `acoes.json`):

| Campo | desbloqueia | Motivo |
|---|---|---|
| dia.deitou, dia.levantou | durma-7, anote-o-sono | `durma-7` usa levantar/deitar; `anote-o-sono` é o registro |
| dia.comoAcordei | (nenhuma) | é sinal, não entrada de meta |
| dia.fome, dia.comiSemFome | pergunte-a-fome | registro da ação |
| dia.ultimoCafe | ultimo-cafe | variável `ultimo_cafe` |
| dia.jantarFim | jante-cedo, feche-a-cozinha | variável `jantar` nas duas |
| dia.passos | seis-mil-passos | variável `passos` |
| dia.moveu | nunca-dois-dias | alimenta `dias_parado` |
| dia.primeiraRefeicao | feche-a-cozinha | variável `primeira` |
| dia.maiorBloco, dia.levantadas | levante-a-cada-30 | variável `maior_bloco`; contagem do botão "Levantei" |
| dia.minPosJantar | ande-depois-do-jantar | variável `min_pos_jantar` |
| dia.copos | beba-pela-sede | variável `copos_agua` |
| dia.proteinaG | proteina-no-prato | variável `proteina_g` |
| dia.fibraG | fibra-no-prato | variável `fibra_g` |
| dia.refeicoesCozinhadas | comida-de-verdade | variável `refeicoes_cozinhadas` |
| dia.bebidaDoce | troque-o-doce | alimenta `doces_semana` |
| dia.alcoolDoses | se-beber | alimenta `alcool` |
| dia.peso | emagreca-devagar | variáveis `peso`/`peso_anterior` (média semanal) |
| dia.fcRepouso | (nenhuma) | é medida (`fc_repouso`), não ação |
| dia.notas | (nenhuma) | texto livre |
| semana.cintura | meca-a-cintura | variável `cintura` |
| semana.sessoesTiros | tres-tiros, some-150 | variável `hiit` nas duas |
| semana.sessoesForca | levante-peso | variável `forca` |
| semana.minAtiv | some-150 | variável `min_ativ` |
| semana.maiorBlocoTipico | levante-a-cada-30 | versão semanal de `maior_bloco` |
| semana.alcoolDoses | se-beber | variável `alcool` |
| semana.docesSemana | troque-o-doce | variável `doces_semana` |
| mes.panturrilha, mes.preensao | panturrilha-preensao | a medida mensal |
| mes.repsAteFalhar | panturrilha-preensao, levante-peso | substituto da preensão; "1RM de bolso" de `levante-peso` |
| exame.* | (nenhuma) | exames são sinal de 12 semanas, não entrada de meta |

- [ ] **Step 1: Escrever o teste (falha: módulo não existe)**

Arquivo `app/src/dominio/campos.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { CAMPOS, campo, camposDe, validar } from './campos';
import type { CampoId } from './campos';
import { catalogo } from './catalogo';
import type { Dia, Exame, Mes, Perfil, Semana } from './tipos';

const perfilBase: Perfil = {
  peso: 90,
  altura: 175,
  idade: 45,
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

// Lista do check-in da manhã (spec §5, tela Hoje, nível 1).
const CHECK_IN: CampoId[] = [
  'dia.deitou',
  'dia.levantou',
  'dia.comoAcordei',
  'dia.fome',
  'dia.comiSemFome',
  'dia.ultimoCafe',
  'dia.jantarFim',
  'dia.passos',
  'dia.moveu',
];

// Registros com todas as chaves de cada tabela: o tsc reclama se uma chave nova
// entrar em tipos.ts e não for listada aqui; o teste reclama se não estiver em CAMPOS.
const CHAVES_DIA: Record<Exclude<keyof Dia, 'data' | 'fonte' | 'atualizadoEm'>, true> = {
  deitou: true, levantou: true, comoAcordei: true, fome: true, comiSemFome: true, ultimoCafe: true,
  jantarFim: true, passos: true, moveu: true, primeiraRefeicao: true, maiorBloco: true, minPosJantar: true,
  copos: true, proteinaG: true, fibraG: true, refeicoesCozinhadas: true, bebidaDoce: true, alcoolDoses: true,
  levantadas: true, peso: true, fcRepouso: true, notas: true,
};
const CHAVES_SEMANA: Record<Exclude<keyof Semana, 'semana' | 'atualizadoEm'>, true> = {
  cintura: true, sessoesTiros: true, sessoesForca: true, minAtiv: true, maiorBlocoTipico: true, alcoolDoses: true, docesSemana: true,
};
const CHAVES_MES: Record<Exclude<keyof Mes, 'mes' | 'atualizadoEm'>, true> = {
  panturrilha: true, preensao: true, repsAteFalhar: true,
};
const CHAVES_EXAME: Record<Exclude<keyof Exame, 'data' | 'atualizadoEm'>, true> = {
  glicemia: true, hba1c: true, homaIr: true, tg: true, hdl: true, ferritina: true, b12: true, vitD: true, paSistolica: true, paDiastolica: true,
};

describe('CAMPOS', () => {
  it('declara todos os campos de dia, semana, mes e exame, cada um uma vez', () => {
    const esperados = [
      ...Object.keys(CHAVES_DIA).map((k) => `dia.${k}`),
      ...Object.keys(CHAVES_SEMANA).map((k) => `semana.${k}`),
      ...Object.keys(CHAVES_MES).map((k) => `mes.${k}`),
      ...Object.keys(CHAVES_EXAME).map((k) => `exame.${k}`),
    ].sort();
    const ids = CAMPOS.map((c) => c.id).sort();
    expect(ids).toEqual(esperados);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('todo desbloqueia aponta para um AcaoId do catálogo', () => {
    const idsValidos = new Set<string>(catalogo.acoes.map((a) => a.id));
    for (const c of CAMPOS) {
      for (const acao of c.desbloqueia) {
        expect(idsValidos.has(acao), `${c.id} desbloqueia id desconhecido "${acao}"`).toBe(true);
      }
    }
  });

  it('todo campo de nível 1 do dia está no check-in da manhã, e vice-versa', () => {
    const nivel1 = CAMPOS.filter((c) => c.id.startsWith('dia.') && c.nivel === 1).map((c) => c.id);
    expect([...nivel1].sort()).toEqual([...CHECK_IN].sort());
  });

  it('todo campo tem rótulo com texto e, se numérico, min <= max', () => {
    for (const c of CAMPOS) {
      expect(c.rotulo.length, c.id).toBeGreaterThan(0);
      if (c.min !== undefined && c.max !== undefined) expect(c.min, c.id).toBeLessThanOrEqual(c.max);
      if (c.tipo === 'escala') {
        expect(c.min, `${c.id}: escala precisa de min`).toBeDefined();
        expect(c.max, `${c.id}: escala precisa de max`).toBeDefined();
      }
    }
  });
});

describe('campo()', () => {
  it('devolve o campo pelo id', () => {
    expect(campo('dia.passos').tipo).toBe('inteiro');
    expect(campo('dia.passos').nivel).toBe(1);
    expect(campo('dia.ultimoCafe').tipo).toBe('hora-ou-nao');
    expect(campo('dia.alcoolDoses').tipo).toBe('inteiro-ou-nao');
  });

  it('lança para id fora do registro (perfil.* não está em CAMPOS)', () => {
    expect(() => campo('perfil.altura')).toThrow("Campo 'perfil.altura' não está no registro.");
  });
});

describe('camposDe()', () => {
  it('filtra por tabela e por nível acumulado (nível 2 inclui o nível 1)', () => {
    const n1 = camposDe('dia', perfilBase, 1);
    const n2 = camposDe('dia', perfilBase, 2);
    const todos = camposDe('dia', perfilBase);
    expect(n1.every((c) => c.nivel === 1 && c.id.startsWith('dia.'))).toBe(true);
    expect(n2.every((c) => c.nivel <= 2)).toBe(true);
    expect(n2.length).toBeGreaterThan(n1.length);
    expect(todos.map((c) => c.id)).toContain('dia.notas');
    expect(n2.map((c) => c.id)).not.toContain('dia.notas');
  });

  it('esconde ultimoCafe quando perfil.cafe === "nao" e mostra nos outros casos', () => {
    const ids = (p: Perfil) => camposDe('dia', p, 1).map((c) => c.id);
    expect(ids({ ...perfilBase, cafe: 'nao' })).not.toContain('dia.ultimoCafe');
    expect(ids({ ...perfilBase, cafe: 'as-vezes' })).toContain('dia.ultimoCafe');
    expect(ids({ ...perfilBase, cafe: 'diario' })).toContain('dia.ultimoCafe');
  });

  it('esconde alcoolDoses (dia e semana) quando perfil.alcool === "nao"', () => {
    expect(camposDe('dia', perfilBase).map((c) => c.id)).not.toContain('dia.alcoolDoses');
    expect(camposDe('semana', perfilBase).map((c) => c.id)).not.toContain('semana.alcoolDoses');
    const bebe = { ...perfilBase, alcool: 'as-vezes' as const };
    expect(camposDe('dia', bebe).map((c) => c.id)).toContain('dia.alcoolDoses');
    expect(camposDe('semana', bebe).map((c) => c.id)).toContain('semana.alcoolDoses');
  });

  it('preserva a ordem de declaração', () => {
    const ids = camposDe('semana', perfilBase).map((c) => c.id);
    expect(ids[0]).toBe('semana.cintura');
    expect(camposDe('mes', perfilBase).map((c) => c.id)).toEqual(['mes.panturrilha', 'mes.preensao', 'mes.repsAteFalhar']);
    expect(camposDe('exame', perfilBase)).toHaveLength(10);
  });
});

describe('validar()', () => {
  it('undefined é sempre ok (não registrou)', () => {
    for (const c of CAMPOS) expect(validar(c, undefined), c.id).toBeNull();
  });

  it('null só é ok nos tipos "-ou-nao"', () => {
    expect(validar(campo('dia.ultimoCafe'), null)).toBeNull();
    expect(validar(campo('dia.alcoolDoses'), null)).toBeNull();
    expect(validar(campo('dia.jantarFim'), null)).toBe('Informe um valor.');
    expect(validar(campo('dia.passos'), null)).toBe('Informe um valor.');
  });

  it('hora exige HH:MM 24 h', () => {
    const c = campo('dia.deitou');
    expect(validar(c, '23:30')).toBeNull();
    expect(validar(c, '00:00')).toBeNull();
    expect(validar(c, '24:00')).toBe('Use o formato HH:MM (ex.: 23:30).');
    expect(validar(c, '7:30')).toBe('Use o formato HH:MM (ex.: 23:30).');
    expect(validar(c, 1410)).toBe('Use o formato HH:MM (ex.: 23:30).');
    expect(validar(campo('dia.ultimoCafe'), '14:00')).toBeNull();
    expect(validar(campo('dia.ultimoCafe'), 'tarde')).toBe('Use o formato HH:MM (ex.: 23:30).');
  });

  it('inteiro exige número inteiro dentro de min/max', () => {
    const c = campo('dia.passos');
    expect(validar(c, 6200)).toBeNull();
    expect(validar(c, 0)).toBeNull();
    expect(validar(c, 62.5)).toBe('Use um número inteiro.');
    expect(validar(c, '6200')).toBe('Use um número inteiro.');
    expect(validar(c, -1)).toBe('O mínimo é 0 passos.');
    expect(validar(c, 100001)).toBe('O máximo é 100000 passos.');
    expect(validar(campo('dia.alcoolDoses'), 2)).toBeNull();
    expect(validar(campo('dia.alcoolDoses'), 1.5)).toBe('Use um número inteiro.');
  });

  it('escala exige inteiro entre min e max', () => {
    const c = campo('dia.comoAcordei');
    expect(validar(c, 3)).toBeNull();
    expect(validar(c, 0)).toBe('O mínimo é 1.');
    expect(validar(c, 6)).toBe('O máximo é 5.');
    expect(validar(c, 2.5)).toBe('Use um número inteiro.');
    expect(validar(campo('dia.fome'), 10)).toBeNull();
    expect(validar(campo('dia.fome'), 11)).toBe('O máximo é 10.');
  });

  it('decimal aceita fração, rejeita NaN/Infinity e respeita min/max', () => {
    const c = campo('dia.peso');
    expect(validar(c, 89.6)).toBeNull();
    expect(validar(c, Number.NaN)).toBe('Use um número.');
    expect(validar(c, Number.POSITIVE_INFINITY)).toBe('Use um número.');
    expect(validar(c, '89,6')).toBe('Use um número.');
    expect(validar(c, 10)).toBe('O mínimo é 20 kg.');
    expect(validar(c, 500)).toBe('O máximo é 400 kg.');
  });

  it('bool exige boolean', () => {
    const c = campo('dia.moveu');
    expect(validar(c, true)).toBeNull();
    expect(validar(c, false)).toBeNull();
    expect(validar(c, 'sim')).toBe('Responda sim ou não.');
    expect(validar(c, 1)).toBe('Responda sim ou não.');
  });

  it('texto exige string e respeita max (caracteres)', () => {
    const c = campo('dia.notas');
    expect(validar(c, 'dormi mal')).toBeNull();
    expect(validar(c, '')).toBeNull();
    expect(validar(c, 42)).toBe('Escreva um texto.');
    expect(validar(c, 'x'.repeat(2001))).toBe('No máximo 2000 caracteres.');
  });
});
```

Rodar:

```bash
pnpm test src/dominio/campos
```

Saída esperada: falha com `Failed to resolve import "./campos" from "src/dominio/campos.test.ts"`.

- [ ] **Step 2: Escrever `campos.ts`**

Arquivo `app/src/dominio/campos.ts`:

```ts
// Registro de campos (spec §4). Cada campo de dia, semana, mes e exame é declarado
// uma única vez: nível (em que tela aparece), tipo (como valida/renderiza), rótulo,
// unidade, faixa, condição por perfil e quais ações passam a ter meta com ele.
// As telas do plano 04 são geradas daqui; o convite "registre X e eu te digo Y"
// (ADR-002) vem de `desbloqueia`.
import type { AcaoId } from './catalogo/tipos';
import type { Dia, Exame, Mes, Perfil, Semana } from './tipos';

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

const tomaCafe = (p: Perfil): boolean => p.cafe !== 'nao';
const bebeAlcool = (p: Perfil): boolean => p.alcool !== 'nao';

export const CAMPOS: readonly Campo[] = [
  // ---------- dia · nível 1 (check-in da manhã, spec §5) ----------
  { id: 'dia.deitou', nivel: 1, tipo: 'hora', rotulo: 'Deitei às', desbloqueia: ['durma-7', 'anote-o-sono'] },
  { id: 'dia.levantou', nivel: 1, tipo: 'hora', rotulo: 'Levantei às', desbloqueia: ['durma-7', 'anote-o-sono'] },
  { id: 'dia.comoAcordei', nivel: 1, tipo: 'escala', rotulo: 'Como acordei', ajuda: '1 = péssimo, 5 = ótimo', min: 1, max: 5, desbloqueia: [] },
  { id: 'dia.fome', nivel: 1, tipo: 'escala', rotulo: 'Fome de ontem', ajuda: '1 = nenhuma, 10 = muita', min: 1, max: 10, desbloqueia: ['pergunte-a-fome'] },
  { id: 'dia.comiSemFome', nivel: 1, tipo: 'bool', rotulo: 'Comi sem estar com fome?', desbloqueia: ['pergunte-a-fome'] },
  {
    id: 'dia.ultimoCafe',
    nivel: 1,
    tipo: 'hora-ou-nao',
    rotulo: 'Último café de ontem',
    ajuda: 'Café, chá preto/verde, energético. "Não tomei" também vale.',
    condicao: tomaCafe,
    desbloqueia: ['ultimo-cafe'],
  },
  { id: 'dia.jantarFim', nivel: 1, tipo: 'hora', rotulo: 'Jantar de ontem terminou às', desbloqueia: ['jante-cedo', 'feche-a-cozinha'] },
  { id: 'dia.passos', nivel: 1, tipo: 'inteiro', rotulo: 'Passos de ontem', unidade: 'passos', min: 0, max: 100000, desbloqueia: ['seis-mil-passos'] },
  { id: 'dia.moveu', nivel: 1, tipo: 'bool', rotulo: 'Me movi de propósito por 10 minutos ou mais?', ajuda: 'Só aparece se não houve treino registrado.', desbloqueia: ['nunca-dois-dias'] },

  // ---------- dia · nível 2 ("quero registrar mais") ----------
  { id: 'dia.primeiraRefeicao', nivel: 2, tipo: 'hora', rotulo: 'Primeira refeição às', desbloqueia: ['feche-a-cozinha'] },
  { id: 'dia.maiorBloco', nivel: 2, tipo: 'inteiro', rotulo: 'Maior bloco sentado sem levantar', unidade: 'min', min: 0, max: 1440, desbloqueia: ['levante-a-cada-30'] },
  { id: 'dia.minPosJantar', nivel: 2, tipo: 'inteiro', rotulo: 'Minutos andando depois do jantar', unidade: 'min', min: 0, max: 300, desbloqueia: ['ande-depois-do-jantar'] },
  { id: 'dia.copos', nivel: 2, tipo: 'inteiro', rotulo: 'Copos de água, chá ou café', unidade: 'copos', ajuda: 'Copo de 250 mL.', min: 0, max: 40, desbloqueia: ['beba-pela-sede'] },
  { id: 'dia.proteinaG', nivel: 2, tipo: 'inteiro', rotulo: 'Proteína no dia', unidade: 'g', ajuda: 'Rótulo, app de dieta ou suplemento. Soma das refeições registradas, se houver.', min: 0, max: 500, desbloqueia: ['proteina-no-prato'] },
  { id: 'dia.fibraG', nivel: 2, tipo: 'inteiro', rotulo: 'Fibra no dia', unidade: 'g', ajuda: 'Rótulo ou app de dieta; psyllium conta.', min: 0, max: 200, desbloqueia: ['fibra-no-prato'] },
  { id: 'dia.refeicoesCozinhadas', nivel: 2, tipo: 'inteiro', rotulo: 'Refeições feitas de ingredientes', unidade: 'de 3', min: 0, max: 3, desbloqueia: ['comida-de-verdade'] },
  { id: 'dia.bebidaDoce', nivel: 2, tipo: 'inteiro', rotulo: 'Bebidas doces', unidade: 'por dia', ajuda: 'Refrigerante, suco, energético.', min: 0, max: 30, desbloqueia: ['troque-o-doce'] },
  {
    id: 'dia.alcoolDoses',
    nivel: 2,
    tipo: 'inteiro-ou-nao',
    rotulo: 'Doses de álcool',
    unidade: 'doses',
    ajuda: 'Uma dose ≈ lata de cerveja, taça de vinho ou dose de destilado. "Não bebi" também vale.',
    min: 0,
    max: 30,
    condicao: bebeAlcool,
    desbloqueia: ['se-beber'],
  },
  { id: 'dia.levantadas', nivel: 2, tipo: 'inteiro', rotulo: 'Vezes que levantei da cadeira', unidade: 'vezes', ajuda: 'Contado pelo botão "Levantei".', min: 0, max: 200, desbloqueia: ['levante-a-cada-30'] },
  { id: 'dia.peso', nivel: 2, tipo: 'decimal', rotulo: 'Peso', unidade: 'kg', ajuda: 'Só a média da semana é mostrada.', min: 20, max: 400, desbloqueia: ['emagreca-devagar'] },
  { id: 'dia.fcRepouso', nivel: 2, tipo: 'inteiro', rotulo: 'FC de repouso ao acordar', unidade: 'bpm', ajuda: 'Só a média de 7 dias é mostrada.', min: 30, max: 200, desbloqueia: [] },

  // ---------- dia · nível 3 ----------
  { id: 'dia.notas', nivel: 3, tipo: 'texto', rotulo: 'Notas', max: 2000, desbloqueia: [] },

  // ---------- semana (revisão de segunda, spec §5) ----------
  { id: 'semana.cintura', nivel: 1, tipo: 'decimal', rotulo: 'Cintura', unidade: 'cm', ajuda: 'Na altura do umbigo, sem apertar, antes do café.', min: 40, max: 250, desbloqueia: ['meca-a-cintura'] },
  { id: 'semana.sessoesTiros', nivel: 1, tipo: 'inteiro', rotulo: 'Sessões de tiros na semana', unidade: 'sessões', min: 0, max: 14, desbloqueia: ['tres-tiros', 'some-150'] },
  { id: 'semana.sessoesForca', nivel: 1, tipo: 'inteiro', rotulo: 'Sessões de força na semana', unidade: 'sessões', min: 0, max: 14, desbloqueia: ['levante-peso'] },
  { id: 'semana.minAtiv', nivel: 1, tipo: 'inteiro', rotulo: 'Minutos de atividade moderada na semana', unidade: 'min', ajuda: 'Sem contar os tiros.', min: 0, max: 3000, desbloqueia: ['some-150'] },
  { id: 'semana.maiorBlocoTipico', nivel: 2, tipo: 'inteiro', rotulo: 'Maior bloco sentado num dia típico', unidade: 'min', min: 0, max: 1440, desbloqueia: ['levante-a-cada-30'] },
  { id: 'semana.alcoolDoses', nivel: 2, tipo: 'inteiro', rotulo: 'Doses de álcool na semana', unidade: 'doses', min: 0, max: 100, condicao: bebeAlcool, desbloqueia: ['se-beber'] },
  { id: 'semana.docesSemana', nivel: 2, tipo: 'inteiro', rotulo: 'Bebidas doces na semana', unidade: 'por semana', min: 0, max: 100, desbloqueia: ['troque-o-doce'] },

  // ---------- mes (primeira segunda do mês) ----------
  { id: 'mes.panturrilha', nivel: 1, tipo: 'decimal', rotulo: 'Panturrilha', unidade: 'cm', ajuda: 'Ponto mais largo, sentado, perna a 90°.', min: 15, max: 80, desbloqueia: ['panturrilha-preensao'] },
  { id: 'mes.preensao', nivel: 2, tipo: 'decimal', rotulo: 'Força de preensão', unidade: 'kg', ajuda: 'Se tiver dinamômetro.', min: 0, max: 120, desbloqueia: ['panturrilha-preensao'] },
  { id: 'mes.repsAteFalhar', nivel: 2, tipo: 'inteiro', rotulo: 'Repetições até falhar', unidade: 'reps', ajuda: 'Num exercício fixo (flexão ou agachamento), se não tiver dinamômetro.', min: 0, max: 500, desbloqueia: ['panturrilha-preensao', 'levante-peso'] },

  // ---------- exame (todos opcionais; sinal de 12 semanas) ----------
  { id: 'exame.glicemia', nivel: 1, tipo: 'decimal', rotulo: 'Glicemia de jejum', unidade: 'mg/dL', min: 30, max: 600, desbloqueia: [] },
  { id: 'exame.hba1c', nivel: 1, tipo: 'decimal', rotulo: 'HbA1c', unidade: '%', min: 3, max: 20, desbloqueia: [] },
  { id: 'exame.homaIr', nivel: 1, tipo: 'decimal', rotulo: 'HOMA-IR', min: 0, max: 30, desbloqueia: [] },
  { id: 'exame.tg', nivel: 1, tipo: 'decimal', rotulo: 'Triglicerídeos', unidade: 'mg/dL', min: 10, max: 3000, desbloqueia: [] },
  { id: 'exame.hdl', nivel: 1, tipo: 'decimal', rotulo: 'HDL', unidade: 'mg/dL', min: 5, max: 200, desbloqueia: [] },
  { id: 'exame.ferritina', nivel: 2, tipo: 'decimal', rotulo: 'Ferritina', unidade: 'ng/mL', min: 0, max: 5000, desbloqueia: [] },
  { id: 'exame.b12', nivel: 2, tipo: 'decimal', rotulo: 'Vitamina B12', unidade: 'pg/mL', min: 0, max: 5000, desbloqueia: [] },
  { id: 'exame.vitD', nivel: 2, tipo: 'decimal', rotulo: 'Vitamina D (25-OH)', unidade: 'ng/mL', min: 0, max: 300, desbloqueia: [] },
  { id: 'exame.paSistolica', nivel: 1, tipo: 'inteiro', rotulo: 'Pressão sistólica', unidade: 'mmHg', min: 60, max: 260, desbloqueia: [] },
  { id: 'exame.paDiastolica', nivel: 1, tipo: 'inteiro', rotulo: 'Pressão diastólica', unidade: 'mmHg', min: 30, max: 160, desbloqueia: [] },
];

export function campo(id: CampoId): Campo {
  const c = CAMPOS.find((x) => x.id === id);
  if (!c) throw new Error(`Campo '${id}' não está no registro.`);
  return c;
}

export function camposDe(tabela: 'dia' | 'semana' | 'mes' | 'exame', perfil: Perfil, nivel: 1 | 2 | 3 = 3): Campo[] {
  const prefixo = `${tabela}.`;
  return CAMPOS.filter((c) => c.id.startsWith(prefixo) && c.nivel <= nivel && (c.condicao === undefined || c.condicao(perfil)));
}

const HORA_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const MSG_HORA = 'Use o formato HH:MM (ex.: 23:30).';

function foraDaFaixa(c: Campo, v: number): string | null {
  const un = c.unidade ? ` ${c.unidade}` : '';
  if (c.min !== undefined && v < c.min) return `O mínimo é ${c.min}${un}.`;
  if (c.max !== undefined && v > c.max) return `O máximo é ${c.max}${un}.`;
  return null;
}

function nuncaChega(x: never): never {
  throw new Error(`Tipo de campo desconhecido: ${String(x)}`);
}

/** null = ok; string = mensagem ao usuário. A tela avisa e não grava (spec §9). */
export function validar(c: Campo, valor: unknown): string | null {
  if (valor === undefined) return null; // não registrou: sempre ok
  if (valor === null) {
    return c.tipo === 'hora-ou-nao' || c.tipo === 'inteiro-ou-nao' ? null : 'Informe um valor.';
  }
  switch (c.tipo) {
    case 'hora':
    case 'hora-ou-nao':
      return typeof valor === 'string' && HORA_RE.test(valor) ? null : MSG_HORA;
    case 'inteiro':
    case 'inteiro-ou-nao':
    case 'escala':
      if (typeof valor !== 'number' || !Number.isInteger(valor)) return 'Use um número inteiro.';
      return foraDaFaixa(c, valor);
    case 'decimal':
      if (typeof valor !== 'number' || !Number.isFinite(valor)) return 'Use um número.';
      return foraDaFaixa(c, valor);
    case 'bool':
      return typeof valor === 'boolean' ? null : 'Responda sim ou não.';
    case 'texto':
      if (typeof valor !== 'string') return 'Escreva um texto.';
      return c.max !== undefined && valor.length > c.max ? `No máximo ${c.max} caracteres.` : null;
    default:
      return nuncaChega(c.tipo);
  }
}
```

- [ ] **Step 3: Rodar testes, tsc e lint**

```bash
pnpm test src/dominio/campos && pnpm build && pnpm lint
```

Saída esperada: `✓ src/dominio/campos.test.ts (18 tests)`; build e lint limpos. Se `CAMPOS` faltar um id, o primeiro teste mostra a diferença entre as listas ordenadas.

- [ ] **Step 4: Commit**

```bash
cd "/Volumes/SSD 2TB SD/dev/densidade-mitocondrial-app"
git add app/src/dominio/campos.ts app/src/dominio/campos.test.ts
git commit -m "feat: registro de campos com nível, tipo, condição por perfil, validação e ações desbloqueadas"
```

---

### Task 5: `src/dominio/derivados.ts` — utilitários e `derivar()`

**Files:**
- Create: `app/src/dominio/derivados.ts`
- Test: `app/src/dominio/derivados.test.ts`

**Interfaces:**
- Consumes: `Perfil`, `Dia`, `EventoTreino`, `Semana`, `Hora`, `DataISO` (`./tipos`).
- Produces (exatamente como nos contratos):
  - `export interface Derivados` com as 23 chaves: `imc, fcMax, fc60, fc70, fc85, rmr, pal, tdee, defLo, defHi, aguaMetaL, coposMeta, pantCorte, pantGrave, preensaoCorte, corteCintura, diasParado, pesoMedioSemana, pesoMedioSemanaAnterior, fcRepousoMedia7d, jejumHoras, sonoHoras, variacaoDeitarMin`
  - `export function derivar(perfil: Perfil, dias: Dia[], eventos: EventoTreino[], semana: Semana | undefined, hoje: DataISO): Derivados`
  - `export function horaParaMin(h: Hora): number` — `"23:30"` → `1410`
  - `export function minParaHora(m: number): Hora` — `1410` → `"23:30"`; normaliza módulo 1440
  - `export function horasEntre(inicio: Hora, fim: Hora): number` — `((fim − inicio + 1440) % 1440) / 60`
  - `export function r1(n: number): number` — 1 casa decimal
  - `export function mediana(xs: number[]): number | null`, `export function media(xs: number[]): number | null` — `null` para lista vazia
  - `export function pos(v: number, lo: number, hi: number): number` — `clamp((v−lo)/(hi−lo)·0.25+0.5, 0.02, 0.98)`; `hi === lo` → `0.5`

Regras (fonte: PoC `D()` + contratos):

| Derivado | Regra | Quando `null` |
|---|---|---|
| imc | `r1(peso / (altura/100)²)` | peso ou altura ≤ 0 |
| fcMax | `round(208 − 0.7·idade)` | idade ≤ 0 |
| fc60/70/85 | `round(fcMax · 0.6 / 0.7 / 0.85)` | fcMax null |
| rmr | `round(10·peso + 6.25·altura − 5·idade + (H ? 5 : −161))` | peso, altura ou idade ≤ 0 |
| pal | `ativ = (semana.minAtiv ?? 0) + (semana.sessoesTiros ?? 0)·20`; `< 150 → 1.4`, `≤ 300 → 1.5`, senão `1.6` | rmr null (sem `semana` conta como 0 → 1.4) |
| tdee / defLo / defHi | `round(rmr·pal)`, `round(tdee·0.15)`, `round(tdee·0.25)` | rmr null |
| aguaMetaL | `r1((H ? 2.0 : 1.6) + min(2, minTreinoHoje/30·0.4))`, `minTreinoHoje` = soma de `minutos` dos eventos com `data === hoje` | nunca |
| coposMeta | `round(aguaMetaL / 0.25)` | nunca |
| pantCorte / pantGrave / preensaoCorte / corteCintura | H `34 / 32 / 27 / 88`; M `33 / 31 / 16 / 84` | nunca |
| diasParado | anda de `hoje` para trás; um dia "moveu" se tem `EventoTreino` naquela data ou `dia.moveu === true`; para no primeiro dia que moveu, no dia mais antigo com qualquer registro (dia ou evento) ou em 28. Sem nenhum registro → 0 | nunca |
| pesoMedioSemana | `r1(media(dia.peso))` nos dias `[hoje−6, hoje]` | nenhum peso na janela |
| pesoMedioSemanaAnterior | `r1(media(dia.peso))` dos dias em `[hoje−13, hoje−7]` | nenhum `dia.peso` na janela |
| fcRepousoMedia7d | `r1(media(dia.fcRepouso))` em `[hoje−6, hoje]` | nenhum na janela |
| jejumHoras | `r1(horasEntre(dias[hoje−1].jantarFim, dias[hoje].primeiraRefeicao))` | falta um dos dois |
| sonoHoras | dia mais recente (≤ hoje) com `deitou` e `levantou`: `r1(horasEntre(deitou, levantou) − 0.33)` | nenhum dia com ambos |
| variacaoDeitarMin | desvio-padrão populacional (min) de `deitou` em `[hoje−6, hoje]`; horários antes de 12:00 somam 1440 (deitar 00:30 fica perto de 23:30, não de 06:00) | menos de 2 dias com `deitou` |

- [ ] **Step 1: Escrever o teste (falha: módulo não existe)**

Arquivo `app/src/dominio/derivados.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { derivar, horaParaMin, horasEntre, media, mediana, minParaHora, pos, r1 } from './derivados';
import type { Dia, EventoTreino, Perfil, Semana } from './tipos';

const HOJE = '2026-09-14';

/** HOJE menos `offset` dias, em YYYY-MM-DD. */
function d(offset: number): string {
  return new Date(Date.UTC(2026, 8, 14 - offset)).toISOString().slice(0, 10);
}

const perfilBase: Perfil = {
  peso: 90,
  altura: 175,
  idade: 45,
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
const perfilMulher: Perfil = { ...perfilBase, peso: 70, altura: 165, idade: 35, sexo: 'M' };

function dia(data: string, parcial: Partial<Dia> = {}): Dia {
  return { data, atualizadoEm: `${data}T08:00:00.000Z`, ...parcial };
}

let contador = 0;
function treino(data: string, minutos: number, tipo: EventoTreino['tipo'] = 'moderado'): EventoTreino {
  contador += 1;
  return { id: `ev-${contador}`, data, hora: '07:00', tipo, minutos, atualizadoEm: `${data}T08:00:00.000Z` };
}

function semana(parcial: Partial<Semana>): Semana {
  return { semana: '2026-W37', atualizadoEm: '2026-09-14T08:00:00.000Z', ...parcial };
}

const vazio = (perfil: Perfil = perfilBase) => derivar(perfil, [], [], undefined, HOJE);

describe('utilitários de hora', () => {
  it('horaParaMin', () => {
    expect(horaParaMin('23:30')).toBe(1410);
    expect(horaParaMin('00:00')).toBe(0);
    expect(horaParaMin('06:30')).toBe(390);
  });

  it('minParaHora normaliza módulo 1440', () => {
    expect(minParaHora(1410)).toBe('23:30');
    expect(minParaHora(0)).toBe('00:00');
    expect(minParaHora(1440)).toBe('00:00');
    expect(minParaHora(-30)).toBe('23:30');
    expect(minParaHora(1500)).toBe('01:00');
    expect(minParaHora(389.6)).toBe('06:30');
  });

  it('horasEntre atravessa a meia-noite', () => {
    expect(horasEntre('23:30', '06:30')).toBe(7);
    expect(horasEntre('06:30', '23:30')).toBe(17);
    expect(horasEntre('19:00', '09:00')).toBe(14);
    expect(horasEntre('12:00', '12:00')).toBe(0);
  });
});

describe('utilitários numéricos', () => {
  it('r1', () => {
    expect(r1(29.387)).toBe(29.4);
    expect(r1(6.67)).toBe(6.7);
    expect(r1(2)).toBe(2);
  });

  it('media', () => {
    expect(media([])).toBeNull();
    expect(media([70, 72, 74])).toBe(72);
    expect(media([1, 2])).toBe(1.5);
  });

  it('mediana', () => {
    expect(mediana([])).toBeNull();
    expect(mediana([3, 1, 2])).toBe(2);
    expect(mediana([4, 1, 3, 2])).toBe(2.5);
    expect(mediana([5])).toBe(5);
  });

  it('pos: lo → 0.5, hi → 0.75, limitado a [0.02, 0.98]', () => {
    expect(pos(5000, 5000, 7000)).toBe(0.5);
    expect(pos(7000, 5000, 7000)).toBe(0.75);
    expect(pos(6000, 5000, 7000)).toBe(0.625);
    expect(pos(0, 5000, 7000)).toBe(0.02);
    expect(pos(20000, 5000, 7000)).toBe(0.98);
    expect(pos(2, 2, 3)).toBe(0.5);
    expect(pos(5, 5, 5)).toBe(0.5);
  });
});

describe('derivar — perfil', () => {
  it('homem 90 kg, 175 cm, 45 anos', () => {
    const r = vazio();
    expect(r.imc).toBe(29.4);
    expect(r.fcMax).toBe(177);
    expect(r.fc60).toBe(106);
    expect(r.fc70).toBe(124);
    expect(r.fc85).toBe(150);
    expect(r.rmr).toBe(1774);
    expect(r.pal).toBe(1.4);
    expect(r.tdee).toBe(2484);
    expect(r.defLo).toBe(373);
    expect(r.defHi).toBe(621);
    expect(r.aguaMetaL).toBe(2);
    expect(r.coposMeta).toBe(8);
    expect(r.pantCorte).toBe(34);
    expect(r.pantGrave).toBe(32);
    expect(r.preensaoCorte).toBe(27);
    expect(r.corteCintura).toBe(88);
  });

  it('mulher 70 kg, 165 cm, 35 anos', () => {
    const r = vazio(perfilMulher);
    expect(r.imc).toBe(25.7);
    expect(r.fcMax).toBe(184);
    expect(r.rmr).toBe(1395);
    expect(r.aguaMetaL).toBe(1.6);
    expect(r.coposMeta).toBe(6);
    expect(r.pantCorte).toBe(33);
    expect(r.pantGrave).toBe(31);
    expect(r.preensaoCorte).toBe(16);
    expect(r.corteCintura).toBe(84);
  });

  it('sem altura: imc, rmr, pal, tdee e déficits são null; fcMax continua', () => {
    const r = vazio({ ...perfilBase, altura: 0 });
    expect(r.imc).toBeNull();
    expect(r.rmr).toBeNull();
    expect(r.pal).toBeNull();
    expect(r.tdee).toBeNull();
    expect(r.defLo).toBeNull();
    expect(r.defHi).toBeNull();
    expect(r.fcMax).toBe(177);
  });

  it('sem idade: fcMax e zonas são null; imc continua', () => {
    const r = vazio({ ...perfilBase, idade: 0 });
    expect(r.fcMax).toBeNull();
    expect(r.fc60).toBeNull();
    expect(r.fc70).toBeNull();
    expect(r.fc85).toBeNull();
    expect(r.rmr).toBeNull();
    expect(r.imc).toBe(29.4);
  });

  it('valores não finitos contam como faltantes', () => {
    expect(vazio({ ...perfilBase, peso: Number.NaN }).imc).toBeNull();
  });

  it('todas as chaves de Derivados existem mesmo sem dado', () => {
    expect(Object.keys(vazio()).sort()).toEqual(
      [
        'imc', 'fcMax', 'fc60', 'fc70', 'fc85', 'rmr', 'pal', 'tdee', 'defLo', 'defHi',
        'aguaMetaL', 'coposMeta', 'pantCorte', 'pantGrave', 'preensaoCorte', 'corteCintura',
        'diasParado', 'pesoMedioSemana', 'pesoMedioSemanaAnterior', 'fcRepousoMedia7d',
        'jejumHoras', 'sonoHoras', 'variacaoDeitarMin',
      ].sort(),
    );
  });
});

describe('derivar — pal e tdee pela semana', () => {
  const com = (s: Partial<Semana>) => derivar(perfilBase, [], [], semana(s), HOJE);

  it('ativ = minAtiv + sessoesTiros·20', () => {
    expect(com({ minAtiv: 60, sessoesTiros: 3 }).pal).toBe(1.4); // 120
    expect(com({ minAtiv: 200, sessoesTiros: 3 }).pal).toBe(1.5); // 260
    expect(com({ minAtiv: 300, sessoesTiros: 3 }).pal).toBe(1.6); // 360
  });

  it('limites: 150 e 300 são 1.5; 301 é 1.6', () => {
    expect(com({ minAtiv: 149 }).pal).toBe(1.4);
    expect(com({ minAtiv: 150 }).pal).toBe(1.5);
    expect(com({ minAtiv: 300 }).pal).toBe(1.5);
    expect(com({ minAtiv: 301 }).pal).toBe(1.6);
  });

  it('tdee e déficits acompanham o pal', () => {
    const r = com({ minAtiv: 200, sessoesTiros: 3 });
    expect(r.tdee).toBe(2661); // 1774 · 1.5
    expect(r.defLo).toBe(399);
    expect(r.defHi).toBe(665);
    expect(com({ minAtiv: 400 }).tdee).toBe(2838); // 1774 · 1.6 = 2838.4
  });
});

describe('derivar — água', () => {
  it('sem treino hoje: base por sexo', () => {
    expect(vazio().aguaMetaL).toBe(2);
    expect(vazio().coposMeta).toBe(8);
  });

  it('30 min de treino hoje somam 0,4 L', () => {
    const r = derivar(perfilBase, [], [treino(HOJE, 30)], undefined, HOJE);
    expect(r.aguaMetaL).toBe(2.4);
    expect(r.coposMeta).toBe(10);
  });

  it('dois eventos de hoje somam; evento de ontem não conta', () => {
    expect(derivar(perfilBase, [], [treino(HOJE, 15), treino(HOJE, 15, 'tiros')], undefined, HOJE).aguaMetaL).toBe(2.4);
    expect(derivar(perfilBase, [], [treino(d(1), 30)], undefined, HOJE).aguaMetaL).toBe(2);
  });

  it('o acréscimo tem teto de 2 L', () => {
    const r = derivar(perfilBase, [], [treino(HOJE, 200)], undefined, HOJE);
    expect(r.aguaMetaL).toBe(4);
    expect(r.coposMeta).toBe(16);
  });

  it('mulher com 30 min: 1,6 + 0,4', () => {
    const r = derivar(perfilMulher, [], [treino(HOJE, 30)], undefined, HOJE);
    expect(r.aguaMetaL).toBe(2);
    expect(r.coposMeta).toBe(8);
  });
});

describe('derivar — diasParado', () => {
  const parado = (dias: Dia[], eventos: EventoTreino[]) => derivar(perfilBase, dias, eventos, undefined, HOJE).diasParado;

  it('sem nenhum registro é 0', () => {
    expect(parado([], [])).toBe(0);
  });

  it('evento ou moveu === true hoje zera', () => {
    expect(parado([], [treino(HOJE, 10)])).toBe(0);
    expect(parado([dia(HOJE, { moveu: true })], [])).toBe(0);
  });

  it('ontem moveu, hoje ainda nada: 1', () => {
    expect(parado([], [treino(d(1), 10)])).toBe(1);
    expect(parado([dia(d(1), { moveu: true }), dia(HOJE, { passos: 100 })], [])).toBe(1);
  });

  it('último movimento há 3 dias: 3', () => {
    expect(parado([dia(HOJE), dia(d(1)), dia(d(2), { moveu: false })], [treino(d(3), 20)])).toBe(3);
  });

  it('moveu === false não conta como movimento; evento no mesmo dia vence', () => {
    expect(parado([dia(HOJE, { moveu: false })], [treino(HOJE, 10)])).toBe(0);
  });

  it('para no registro mais antigo (não inventa dias antes do primeiro registro)', () => {
    const dias = [0, 1, 2, 3, 4].map((i) => dia(d(i), { moveu: false }));
    expect(parado(dias, [])).toBe(5);
  });

  it('teto de 28 dias', () => {
    expect(parado([dia(d(40))], [])).toBe(28);
  });
});

describe('derivar — médias de janela', () => {
  it('peso: últimos 7 dias e os 7 anteriores, 1 casa', () => {
    const dias = [
      dia(HOJE, { peso: 90.2 }),
      dia(d(3), { peso: 89.8 }),
      dia(d(6), { peso: 90.0 }),
      dia(d(7), { peso: 91.0 }),
      dia(d(10), { peso: 90.6 }),
      dia(d(14), { peso: 95 }), // fora das duas janelas
    ];
    const r = derivar(perfilBase, dias, [], undefined, HOJE);
    expect(r.pesoMedioSemana).toBe(90);
    expect(r.pesoMedioSemanaAnterior).toBe(90.8);
  });

  it('sem peso: null nas duas', () => {
    const r = derivar(perfilBase, [dia(HOJE, { passos: 1 })], [], undefined, HOJE);
    expect(r.pesoMedioSemana).toBeNull();
    expect(r.pesoMedioSemanaAnterior).toBeNull();
  });

  it('fcRepouso: média dos últimos 7 dias', () => {
    const dias = [dia(HOJE, { fcRepouso: 70 }), dia(d(1), { fcRepouso: 72 }), dia(d(2), { fcRepouso: 74 }), dia(d(9), { fcRepouso: 90 })];
    expect(derivar(perfilBase, dias, [], undefined, HOJE).fcRepousoMedia7d).toBe(72);
    expect(vazio().fcRepousoMedia7d).toBeNull();
  });
});

describe('derivar — jejum, sono e variação de deitar', () => {
  it('jejumHoras: jantarFim de ontem → primeiraRefeicao de hoje', () => {
    const dias = [dia(HOJE, { primeiraRefeicao: '09:00' }), dia(d(1), { jantarFim: '19:00' })];
    expect(derivar(perfilBase, dias, [], undefined, HOJE).jejumHoras).toBe(14);
  });

  it('jejumHoras é null se falta um dos lados ou se o jantar é do dia errado', () => {
    expect(derivar(perfilBase, [dia(d(1), { jantarFim: '19:00' })], [], undefined, HOJE).jejumHoras).toBeNull();
    expect(derivar(perfilBase, [dia(HOJE, { primeiraRefeicao: '09:00' })], [], undefined, HOJE).jejumHoras).toBeNull();
    expect(derivar(perfilBase, [dia(HOJE, { primeiraRefeicao: '09:00', jantarFim: '19:00' })], [], undefined, HOJE).jejumHoras).toBeNull();
  });

  it('sonoHoras: (levantou − deitou) − 0,33 do dia mais recente com ambos', () => {
    expect(derivar(perfilBase, [dia(HOJE, { deitou: '23:30', levantou: '06:30' })], [], undefined, HOJE).sonoHoras).toBe(6.7);
    const dias = [dia(HOJE, { levantou: '06:30' }), dia(d(1), { deitou: '23:00', levantou: '07:00' })];
    expect(derivar(perfilBase, dias, [], undefined, HOJE).sonoHoras).toBe(7.7);
    const tarde = [dia(HOJE, { levantou: '06:30' }), dia(d(2), { deitou: '00:30', levantou: '07:00' })];
    expect(derivar(perfilBase, tarde, [], undefined, HOJE).sonoHoras).toBe(6.2);
    expect(vazio().sonoHoras).toBeNull();
  });

  it('variacaoDeitarMin: desvio-padrão em minutos, com meia-noite tratada como "tarde"', () => {
    const dias = [dia(HOJE, { deitou: '23:00' }), dia(d(1), { deitou: '23:30' }), dia(d(2), { deitou: '00:00' })];
    expect(derivar(perfilBase, dias, [], undefined, HOJE).variacaoDeitarMin).toBe(24.5);
    const iguais = [dia(HOJE, { deitou: '23:00' }), dia(d(1), { deitou: '23:00' }), dia(d(2), { deitou: '23:00' })];
    expect(derivar(perfilBase, iguais, [], undefined, HOJE).variacaoDeitarMin).toBe(0);
  });

  it('variacaoDeitarMin é null com menos de 2 dias na janela de 7', () => {
    expect(derivar(perfilBase, [dia(HOJE, { deitou: '23:00' })], [], undefined, HOJE).variacaoDeitarMin).toBeNull();
    const fora = [dia(HOJE, { deitou: '23:00' }), dia(d(8), { deitou: '01:00' })];
    expect(derivar(perfilBase, fora, [], undefined, HOJE).variacaoDeitarMin).toBeNull();
  });
});
```

Rodar:

```bash
pnpm test src/dominio/derivados
```

Saída esperada: falha com `Failed to resolve import "./derivados" from "src/dominio/derivados.test.ts"`.

- [ ] **Step 2: Escrever `derivados.ts`**

Arquivo `app/src/dominio/derivados.ts`:

```ts
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
```

- [ ] **Step 3: Rodar testes, tsc e lint**

```bash
pnpm test src/dominio/derivados && pnpm build && pnpm lint
```

Saída esperada: `✓ src/dominio/derivados.test.ts (36 tests)`; build e lint limpos. Se algum número de perfil falhar, confira a conta na tabela de regras acima antes de mexer no teste — os valores esperados foram calculados à mão (ex.: rmr = 900 + 1093,75 − 225 + 5 = 1773,75 → 1774).

- [ ] **Step 4: Commit**

```bash
cd "/Volumes/SSD 2TB SD/dev/densidade-mitocondrial-app"
git add app/src/dominio/derivados.ts app/src/dominio/derivados.test.ts
git commit -m "feat: derivados do domínio (imc, fc, rmr, tdee, água, dias parado, médias, jejum, sono) com fórmulas da PoC"
```

---

### Task 6: Script `pnpm sync-catalogo`, README do app e verificação final

**Files:**
- Modify: `app/package.json` (script `sync-catalogo`)
- Create: `app/README.md`
- Modify: `README.md` (raiz — uma linha de status)

**Interfaces:**
- Consumes: `app/scripts/sync-catalogo.mjs` (Task 3).
- Produces: `pnpm sync-catalogo` (atalho para `node scripts/sync-catalogo.mjs`); README com como rodar, como sincronizar o catálogo e a regra de dependência.

- [ ] **Step 1: Ver que o atalho ainda não existe**

Dentro de `app/`:

```bash
pnpm sync-catalogo
```

Saída esperada: `ERR_PNPM_NO_SCRIPT  Missing script: sync-catalogo`.

- [ ] **Step 2: Adicionar o script ao `package.json`**

Em `app/package.json`, o bloco `scripts` fica assim (só a linha `sync-catalogo` é nova; o resto não muda):

```json
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit -p tsconfig.json && vite build",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint .",
    "sync-catalogo": "node scripts/sync-catalogo.mjs"
  },
```

Rodar:

```bash
pnpm sync-catalogo
cd "/Volumes/SSD 2TB SD/dev/densidade-mitocondrial-app" && git status --short app/src/dominio/catalogo
```

Saída esperada: `Catálogo sincronizado: 22 ações, 9 medidas, 28 variáveis.` + `sha256 …`; o `git status` **não lista nada** (a cópia já estava em sync; o script é idempotente).

- [ ] **Step 3: Escrever `app/README.md`**

Arquivo `app/README.md`:

````markdown
# Fornalha Metabólica — app

PWA local (sem conta, sem servidor) que registra hábitos ligados à densidade mitocondrial e devolve, para cada uma das 22 ações do catálogo, onde você está em relação à sua meta pessoal e qual é o próximo passo. Design em `../docs/superpowers/specs/2026-09-14-fornalha-app-design.md`.

## Rodar

Requisitos: Node ≥ 20 e pnpm 10 (`corepack enable && corepack prepare pnpm@10.12.1 --activate`).

```bash
pnpm install
pnpm dev          # servidor de desenvolvimento
pnpm test         # Vitest (uma vez); pnpm test:watch para ficar observando
pnpm lint         # ESLint
pnpm build        # tsc --noEmit + vite build → dist/
```

A CI (`.github/workflows/ci.yml`) roda `pnpm install --frozen-lockfile && pnpm lint && pnpm test && pnpm build`.

## Catálogo de ações (`src/dominio/catalogo/acoes.json`)

A fonte de verdade é `docs/brain/acoes/acoes.json`, no brain. A cópia dentro do app é gerada — **não edite a cópia**. Depois de mudar o brain:

```bash
pnpm sync-catalogo
```

O script copia o JSON e grava o sha256 em `acoes.hash`. O teste `src/dominio/catalogo/catalogo.test.ts` falha (localmente e na CI) se a cópia estiver dessincronizada; a falha nunca acontece em runtime.

## Estrutura

- `src/dominio/` — TypeScript puro: tipos, catálogo, registro de campos, derivados, metas, tendências. Não importa React, Dexie, DOM, `src/dados`, `src/ui` nem `src/app` — o ESLint (`eslint.config.js`) impede.
- `src/dados/` — Dexie (IndexedDB), repositórios, export/import, montagem do `Contexto`.
- `src/ui/` — telas, componentes e hooks.
- `src/app/` — shell, rotas, service worker.
- `scripts/` — `sync-catalogo.mjs`.

Alias `@/` aponta para `src/`. Dentro de `src/dominio/` use imports relativos.

## Convenções

- Identificadores em português sem acento (`proteinaG`, `comoAcordei`); textos ao usuário em português com acento.
- Três estados por campo: `undefined` = não registrou; `null` = não se aplica hoje (ex.: não tomei café); valor = registrou.
- Derivados (`src/dominio/derivados.ts`) nunca são gravados — são calculados a cada leitura.
- Commits pequenos, em português, com prefixo `feat:`/`test:`/`chore:`/`fix:`.
````

- [ ] **Step 4: Atualizar a linha de status do README da raiz**

Em `README.md` (raiz), trocar a seção `## Status` por:

```markdown
## Status

Design da v1 aprovado em 2026-09-14. Plano 01 (scaffold + base do domínio) implementado; veja `app/README.md` para rodar.
```

- [ ] **Step 5: Verificação final — a mesma cadeia da CI**

Dentro de `app/`:

```bash
pnpm install --frozen-lockfile && pnpm lint && pnpm test && pnpm build
```

Saída esperada:

```
Lockfile is up to date, resolution step is skipped
…
 ✓ src/app/App.test.tsx (1 test)
 ✓ src/dominio/tipos.test.ts (4 tests)
 ✓ src/dominio/catalogo/catalogo.test.ts (7 tests)
 ✓ src/dominio/campos.test.ts (18 tests)
 ✓ src/dominio/derivados.test.ts (36 tests)

 Test Files  5 passed (5)
      Tests  66 passed (66)
…
✓ built in …
```

Confirmar também que a árvore final é esta:

```bash
cd "/Volumes/SSD 2TB SD/dev/densidade-mitocondrial-app" && git ls-files app .github
```

Saída esperada:

```
.github/workflows/ci.yml
app/README.md
app/eslint.config.js
app/index.html
app/package.json
app/pnpm-lock.yaml
app/scripts/sync-catalogo.mjs
app/src/app/App.test.tsx
app/src/app/App.tsx
app/src/dominio/campos.test.ts
app/src/dominio/campos.ts
app/src/dominio/catalogo/acoes.hash
app/src/dominio/catalogo/acoes.json
app/src/dominio/catalogo/catalogo.test.ts
app/src/dominio/catalogo/index.ts
app/src/dominio/catalogo/tipos.ts
app/src/dominio/derivados.test.ts
app/src/dominio/derivados.ts
app/src/dominio/tipos.test.ts
app/src/dominio/tipos.ts
app/src/main.tsx
app/src/setupTests.ts
app/src/vite-env.d.ts
app/tsconfig.json
app/vite.config.ts
```

(`app/README.md` aparece só depois do commit do Step 6.)

- [ ] **Step 6: Commit**

```bash
cd "/Volumes/SSD 2TB SD/dev/densidade-mitocondrial-app"
git add app/package.json app/README.md README.md
git commit -m "chore: script pnpm sync-catalogo e README do app"
```

---

## O que os próximos planos consomem daqui

| Módulo | Exporta | Usado por |
|---|---|---|
| `src/dominio/tipos.ts` | `Perfil, Dia, EventoTreino, EventoRefeicao, Semana, Mes, Exame, Hora, DataISO, SemanaISO, MesISO, Fonte, Sexo` | 02, 03, 04 |
| `src/dominio/catalogo/tipos.ts` | `AcaoId, Grupo, AcaoCatalogo, MedidaCatalogo, Catalogo, VariavelCatalogo` | 02, 04 |
| `src/dominio/catalogo/index.ts` | `catalogo, acaoDoCatalogo` | 02 (teste de contrato `ids(acoes.json) == ids(METAS)`), 04 (cards) |
| `src/dominio/campos.ts` | `CampoId, TipoCampo, Campo, CAMPOS, campo, camposDe, validar` | 02 (`Meta.precisaDe`), 04 (`CampoRegistro`, `ConviteRegistro`, check-in) |
| `src/dominio/derivados.ts` | `Derivados, derivar, horaParaMin, minParaHora, horasEntre, r1, mediana, media, pos` | 02 (`ctx.derivados`, `pos`), 03 (`montarContexto`, `sonoFomeCafe`) |

Decisões deste plano que os outros devem saber:

- `diasParado` conta **hoje** como parado enquanto não há evento nem `moveu === true` em hoje (contrato: "até hoje inclusive"). Por isso `1` é "zerado" na ação `nunca-dois-dias` (PoC: `n <= 1 → ideal`). A tela Hoje (plano 04) mostra o número como está.
- `jejumHoras` usa estritamente `jantarFim` de **ontem** e `primeiraRefeicao` de **hoje**; antes da primeira refeição de hoje é `null`. Se `feche-a-cozinha` (plano 02) quiser o último par disponível, calcula a partir de `ctx.dias` com `horasEntre`.
- `pal` é `1.4` quando não há `Semana` (atividade conta como 0), nunca `null` enquanto `rmr` existir — igual à PoC.
- `validar()` devolve `null` para `undefined` sempre; a obrigatoriedade de um campo (se houver) é decisão de tela, não do registro.
- `CAMPOS` não contém `perfil.*`; `campo('perfil.altura')` lança. `Meta.precisaDe: ['perfil.altura']` continua válido como tipo (`CampoId`), e a tela decide para onde levar.
- `AcaoCatalogo.evidencia.fontes` e `MedidaCatalogo.fontes` são `string`; `setas` é `Array<string | number>`. Ao atualizar `2026-09-14-fornalha-00-contratos.md`, corrigir esses dois tipos lá também.
