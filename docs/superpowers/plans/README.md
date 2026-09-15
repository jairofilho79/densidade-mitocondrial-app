# Planos de implementação — Fornalha v1

Ordem de execução (cada plano produz software testável sozinho):

| # | Plano | Entrega |
|---|---|---|
| 00 | [contratos](2026-09-14-fornalha-00-contratos.md) | Tipos e assinaturas compartilhados — leitura obrigatória antes de qualquer task |
| 01 | [base do domínio](2026-09-14-fornalha-01-base-dominio.md) | Scaffold, CI, `tipos.ts`, catálogo sincronizado, registro de campos, derivados |
| 02 | [motor de metas](2026-09-14-fornalha-02-metas.md) | 22 ações com meta pessoal e próximo passo, segurança, 9 medidas |
| 03 | [tendência e dados](2026-09-14-fornalha-03-tendencia-dados.md) | Sono × fome × café, Dexie, repositórios, contexto, export/import |
| 04 | [UI e PWA](2026-09-14-fornalha-04-ui-pwa.md) | Telas, componentes, hooks, PWA, marcação do brain |

Spec: [`../specs/2026-09-14-fornalha-app-design.md`](../specs/2026-09-14-fornalha-app-design.md).

## Estado (2026-09-15)

Os quatro planos foram executados na branch `fornalha-v1` (PR #1): 485 testes, lint/build/CI verdes. Cada plano passou por revisão por task e revisão final do branch; os achados foram corrigidos em ondas. Decisões tomadas durante a execução estão nos contratos (00) e no spec (§1, §5, §9).

### Pendências v1.1 (registradas nas revisões, não bloqueiam a v1)

- Numérico: `type="number"` não aceita vírgula por digitação em aparelhos em inglês → `type="text" inputmode="decimal"` (o parser já aceita vírgula).
- Hoje: convite do nível 2 é uma frase longa → um convite por grupo de `desbloqueia`; `aria-controls` aponta para id inexistente quando colapsado; `numeroOuNada` × `numeroDe` duplicados; extrair `FormTreino`/`FormRefeicao`.
- BarraZona: rótulos dos segmentos podem sobrepor o marcador em `posicao ≈ 0,66–0,75` — verificar no browser.
- PWA: `includeAssets` redundante com `globPatterns`; ícone maskable sem safe-zone; fontes do Google em `runtimeCaching` (StaleWhileRevalidate).
- Ajustes: importar por `<input type="file">`; "Copiar" sem feedback quando não há clipboard; `fronteira.json` gerado por script (hoje é manual, 10 de 19 notas de fronteira).
- Domínio: helpers duplicados (plural, fallback semana/dias, passo de 15 min) → `_util`; corte de café à meia-noite na tendência via `horasAntesDeDeitar`; `semanaISO` duplicado em `dados/datas.ts` (com teste de concordância); "dias parado" conta hoje de manhã (n = 2 na primeira manhã assusta); `agua` sem sinal de excesso; `durma7` sem testes nos limites exatos.
- Dados: `salvarPerfil` faz `put` completo (quem omitir campo opcional o perde); `null` sobrevivendo a merge posterior sem teste; validação do perfil no import não checa os enums de `remedios`.
- Segunda: `form` inicializado uma vez — aba aberta através da segunda-feira não muda de semana.
- Deploy: assume raiz de domínio; GitHub Pages em subpasta exige `base` no Vite e `scope`/`start_url` relativos.
- Verificação visual pendente (ninguém tem browser no pipeline): 400 px e 360 px, tema escuro do sistema, offline real após instalar.
