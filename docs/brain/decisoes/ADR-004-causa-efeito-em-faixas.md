---
tipo: decisao
status: validado
data: 2026-09-14
---
# ADR-004 — O que o app mostra é causa → efeito, em faixas de dose

**Decisão:** a unidade de conscientização do app é a **seta** (causa → efeito), tanto para inputs bons quanto ruins. Como o processo tem variáveis demais para desenhar, os **outputs são agrupados em intervalos** que fazem sentido para cada input ("faces da mesma moeda": pouco / adequado / demais / por tempo demais).

**Exemplo canônico:** hidratação — pouca água; muita água em pouco tempo; pouca água por semanas — três causas, três efeitos diferentes, mesma moeda.

**Por quê:** o usuário precisa *entender* por que registra algo. Uma seta rotulada com evidência ("isto causa aquilo, com evidência moderada") ensina; um campo obrigatório não.

**Consequências:**
- Cada input/estímulo no brain ganha uma tabela de faixas (ver `pesquisa/_formato.md`).
- Nada é 2D → 3D: a complexidade do processo vai para **demonstrações criativas** por tema, não para um grafo maior.
- Toda seta carrega grau de evidência. Setas `fraca`/`contestada` aparecem tracejadas e o app não afirma — só registra.
- Pesquisa por tema em `pesquisa/` (2026-09-14): verificação de claims, hidratação, alimentação/jejum, exercício, sono/estresse/circadiano, ambiente/térmico/tóxicos, outputs/medição.
