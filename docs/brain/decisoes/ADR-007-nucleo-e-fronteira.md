---
tipo: decisao
status: validado
data: 2026-09-14
---
# ADR-007 — Dois níveis: Núcleo (o que investir) e Fronteira (curiosidade)

**Decisão:** o fluxo principal do app (setas do mapa, cruzamentos, frases de tendência) usa **só informação consolidada**. O resto existe, mas separado, rotulado como curiosidade/fronteira, sem seta e sem cruzamento.

**Critério de Núcleo** (todos obrigatórios):
1. Evidência **forte**, ou **moderada** com ≥2 estudos independentes em humanos apontando na mesma direção;
2. Sem meta-análise ou revisão sistemática recente apontando o contrário;
3. Efeito grande o suficiente para a pessoa perceber ou medir na faixa A–C de custo;
4. População próxima do público-alvo (adulto sedentário/sobrepeso/RI), ou mecanismo tão básico que não depende de população.

**Vai para Fronteira:** RCT único; evidência só mecanística/animal/in vitro; contestada; efeito pequeno demais para perceber; estudos só em atletas/jovens saudáveis quando o efeito depende do treino prévio; qualquer coisa "que saiu estudo recente" e ainda não foi replicada.

**Por quê:** nessa área o limiar entre "faz diferença" e "não faz" é estreito e muda com um estudo novo. Um usuário que lê dez setas e descobre que três eram contestadas perde confiança em todas. Melhor sete setas em que ele pode investir e três curiosidades honestas.

**Consequências:**
- Cada claim do brain ganha `nivel: nucleo | fronteira` além de `evidencia:`.
- O mapa visual só desenha setas de Núcleo. Fronteira aparece em uma seção própria, visualmente distinta, sem conectar ao fluxo.
- Uma curiosidade pode ser **promovida** ao Núcleo quando satisfizer o critério — e um item de Núcleo pode ser **rebaixado** (ex.: creatina para massa magra após meta-análise de 2025).
- Complementa [[ADR-006-evidencia-obrigatoria-na-seta]].
