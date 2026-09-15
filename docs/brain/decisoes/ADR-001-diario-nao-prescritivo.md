---
tipo: decisao
status: validado
data: 2026-09-11
---
# ADR-001 — O app é um diário, não um prescritor

**Decisão:** o app **registra** o que a pessoa fez e mostra **tendências**. Não prescreve treino, dieta ou suplemento.

**Por quê:** não somos profissionais de saúde. Reunimos informação científica e ajudamos a pessoa (ou o profissional que a acompanha) a **enxergar onde focar**.

**Consequências:**
- Nenhuma tela diz "faça X hoje". Ela diz "nos últimos 7 dias você fez X; a literatura associa X a Y".
- Existe um segundo usuário: o **profissional** que acompanha o paciente e quer visualização de aderência e foco. → [[perguntas-abertas#Q6]]
- Toda afirmação precisa de `evidencia` graduada, porque será lida como orientação mesmo sem querer.
