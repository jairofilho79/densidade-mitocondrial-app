---
tipo: decisao
status: validado
data: 2026-09-11
---
# ADR-002 — Divulgação progressiva: dado vago gera resposta honesta, não obrigação

**Decisão:** a pessoa pode registrar pouco e vago. O app devolve **o máximo de informação confiável possível com aquele dado** e deixa claro o que *não* consegue dizer — de forma que a pessoa **sinta a necessidade** de registrar mais, em vez de ser obrigada.

**Por quê:** obrigar campos antes de a pessoa entender a utilidade gera abandono. A motivação para registrar mais tem que vir de ver a diferença na resposta.

**Consequências:**
- Cada domínio precisa definir **níveis de riqueza do registro** (ex.: "treinei" → "fiz spinning 6 min" → "5 tiros de 30s, esforço 8/10, pernas travaram no 4º").
- Para cada nível, o app precisa saber **o que consegue afirmar e o que não consegue**. Isso é o coração da PoC.
- A pergunta que o app faz de volta é parte do produto: ela precisa mostrar *o que a pessoa ganharia* respondendo.
