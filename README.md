# Fornalha Metabólica

Um diário local de hábitos ligados à densidade mitocondrial — movimento, sono, alimentação, hidratação e medidas — que devolve, para cada ação, onde você está em relação à sua meta pessoal e qual é o próximo passo.

**Não prescreve.** Reúne evidência científica consolidada e mostra causa → efeito; a decisão é sua e de quem te acompanha.

## Estrutura

- `docs/brain/` — base de conhecimento (estilo Obsidian): conceitos, protocolos, indicadores, pesquisa com grau de evidência, decisões (ADRs) e o catálogo de ações atômicas (`acoes/acoes.json`).
- `docs/superpowers/specs/` — design da app.
- `app/` — a PWA (React + TypeScript + Vite), em construção.

## Status

v1 implementada (planos 01–04), em revisão final.

## Rodar

```bash
cd app && pnpm install && pnpm dev
```

Veja `app/README.md` para os demais comandos (test, lint, build, preview, instalar como PWA, deploy).
