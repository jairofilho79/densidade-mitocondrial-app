---
tipo: decisao
status: validado
data: 2026-09-14
---
# ADR-008 — A unidade do app é a ação atômica, com faixa pessoal

**Decisão:** o Núcleo (ADR-007) é entregue ao usuário como **ações atômicas** (estilo *Hábitos Atômicos*), não como conceitos. Cada ação tem, obrigatoriamente:

| Campo | O que é | Regra |
|---|---|---|
| `titulo` | imperativo, ≤ 7 palavras, diz *o que fazer* | sem jargão; um número quando houver |
| `gatilho` | quando / depois de quê | empilhamento em hábito que já existe |
| `acao_minima` | a versão de 2 minutos | vale registrar mesmo se for só isso |
| `descricao` | o que é e por quê, em linguagem de gente | máx. 4 frases |
| `meta` | variáveis pessoais → **pouco / meta / demais** + **próximo passo** | calculada; é meta mesmo (Q22 decidida) — o app ajuda a chegar, com o próximo degrau a partir do baseline (ADR-005) |
| `afeta` | input → processo → output | as setas do mapa que a ação aciona |
| `registro` | níveis 1 → 3 | nível 1 sempre cabe em um toque (ADR-002) |
| `sinal` | qual output muda, em quantas semanas | do prazo verificado; o app não promete antes |
| `evidencia` | grau + fontes | só Núcleo |

**Por quê:** "densidade mitocondrial" não é acionável; "levante a cada 30 minutos" é. A pessoa se conscientiza pela ação, entende pela descrição, e vê o efeito pelo sinal.

**Consequências:**
- A meta é uma **função de variáveis** (peso, altura, hora de deitar, baseline de passos…), não uma tabela. Isso é o coração do modelo de dados.
- "Demais" existe para quase toda ação (ADR-004) — a faixa tem três zonas, sempre.
- Onde a evidência dá só a direção e não o número, a meta diz "regra de bolso" e o app não afirma o número.
- **Q22 decidida (2026-09-14):** "não é meta" era eufemismo — é impossível não adotar como meta. O mais honesto é chamar de meta, calcular com os números da pessoa e mostrar o **próximo passo** (ex.: passos = baseline + 1 mil; café = mover para antes de X; sono = deitar 15 min antes). Sem "meta batida/falhou": mostra distância e direção.
- Variáveis têm `escopo: perfil` (uma vez) ou `dia` (registro diário). O painel de "dia típico" da PoC é o protótipo do registro.
- **Medidas** (IMC, cintura/estatura, panturrilha, preensão, FC repouso, FC máx e zonas, gasto de repouso, água, peso) vivem em seção própria: são instrumentos, não ações. IMC calibra o ponto de partida (tiros a 70% mantêm o ganho enzimático — Boyd 2013) e as referências, não é alvo.
- Catálogo em `acoes/`; fonte única em `acoes/acoes.json` (gera as notas e a página).
