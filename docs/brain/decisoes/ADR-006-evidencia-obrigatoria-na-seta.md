---
tipo: decisao
status: validado
data: 2026-09-14
---
# ADR-006 — Toda seta carrega o grau de evidência, e o app fala de acordo

**Decisão:** cada relação causa → efeito que o app mostra tem um grau (forte / moderada / fraca / contestada / não-verificada) e uma frase calibrada:
- **forte/moderada:** "nos estudos, X anda junto com Y" — o app afirma.
- **fraca:** "há sinal, mas pequeno" — o app registra e mostra o cruzamento, não afirma.
- **contestada:** "os estudos discordam" — o app registra e diz que discordam.
- **não-verificada:** o app registra como hábito, sem seta.

**Por quê:** a pesquisa de 2026-09-14 derrubou 6 dos 12 claims do protocolo original. Um app que afirmasse "banho frio ativa gordura marrom" estaria errado. A honestidade sobre a evidência é o que diferencia de conteúdo de marketing.

**Consequências:**
- Setas fracas/contestadas aparecem tracejadas no mapa.
- Cada nota do brain tem `evidencia:` preenchido antes de virar feature (regra do índice, agora com ADR).
- As frases "o que o app pode dizer" das notas de pesquisa são o rascunho do copy.
