# Fornalha Metabólica — app

PWA local (sem conta, sem servidor) que registra hábitos ligados à densidade mitocondrial e devolve, para cada uma das 22 ações do catálogo, onde você está em relação à sua meta pessoal e qual é o próximo passo. Design em `../docs/superpowers/specs/2026-09-14-fornalha-app-design.md`.

## Rodar

Requisitos: Node ≥ 20 e pnpm 10 (`npm i -g pnpm@10`).

```bash
pnpm install
pnpm dev          # servidor de desenvolvimento
pnpm test         # Vitest (uma vez); pnpm test:watch para ficar observando
pnpm lint         # ESLint
pnpm build        # tsc --noEmit + vite build → dist/
```

A CI (`.github/workflows/ci.yml`) roda `pnpm install --frozen-lockfile && pnpm lint && pnpm test && pnpm build`.

## Dependências

- react-router 7 (não migrar para 8 sem revisar as rotas).

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
