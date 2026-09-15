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
pnpm preview      # serve o build de dist/ localmente (vite preview) — para conferir o PWA como em produção
pnpm icones       # gera os ícones do PWA (src/../icones/) a partir de icone.svg
node scripts/marcar-brain.mjs  # marca `vira-feature-em: v1` nas ações do brain já implementadas na UI
```

A CI (`.github/workflows/ci.yml`) roda `pnpm install --frozen-lockfile && pnpm lint && pnpm test && pnpm build`.

## Instalar como PWA

Depois de abrir a app pelo menos uma vez (o service worker faz o cache do essencial), ela funciona offline e pode ser instalada como um app:

- **Chrome/Android:** menu (⋮) → "Adicionar à tela inicial".
- **Safari/iOS:** botão Compartilhar → "Adicionar à Tela de Início".

## Deploy

Publicado em GitHub Pages: **https://jairofilho79.github.io/densidade-mitocondrial-app/** — o job `pages` de `.github/workflows/ci.yml` roda a cada push em `main`, depois do CI passar.

O caminho público vem de `VITE_BASE` (padrão `/`, raiz do domínio). O workflow define `VITE_BASE=/densidade-mitocondrial-app/`; `vite.config.ts` usa o mesmo valor em `base` e no `start_url`/`scope` do manifest. Para publicar noutra subpasta, basta mudar a variável. O HashRouter não depende do caminho.

Os dados ficam no IndexedDB do navegador em que a app foi aberta — o Pages só serve arquivos estáticos. Use **Ajustes → exportar** para levar o histórico a outro aparelho.

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
