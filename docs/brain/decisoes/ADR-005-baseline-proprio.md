---
tipo: decisao
status: validado
data: 2026-09-14
---
# ADR-005 — Dados de relógio só se comparam com o baseline da própria pessoa

**Decisão:** HRV, % de gordura por bioimpedância, VO2 estimado e sono por fases vindos de wearables **nunca** são comparados a tabelas populacionais. Só à média móvel da própria pessoa (7 dias, ≥3 medidas).

**Por quê:** relógios de consumo acertam FC de repouso (erro 1–6%) mas erram HRV em 10–30% (O'Grady 2024; Dial 2025); bioimpedância doméstica só serve para tendência. Um valor absoluto errado comparado a uma tabela gera ansiedade ou falsa segurança.

**Consequências:**
- Toda tendência de faixa D precisa de um período de baseline (≥7 dias) antes de dizer qualquer coisa.
- FC de repouso pode ter faixas de referência; HRV não.
- Deriva de [[../pesquisa/2026-09-14-outputs-medicao]].
