---
tipo: template
---
# Formato das notas de pesquisa

Cada nota em `pesquisa/` segue esta estrutura. Objetivo: causa → efeito na densidade mitocondrial, com **faces da mesma moeda** (pouco / adequado / demais / por tempo demais).

## Graus de evidência
- **forte** — meta-análises ou múltiplos RCTs em humanos, resultado consistente
- **moderada** — alguns RCTs ou coortes consistentes em humanos
- **fraca** — estudos pequenos, animais, in vitro, só mecanismo plausível
- **contestada** — evidência conflitante em humanos
- **não-verificada** — não foi possível confirmar fonte

## Regra de citação
Só citar fonte **aberta de fato** (WebFetch) ou vista em resultado de busca. Preferir meta-análises, revisões sistemáticas, posicionamentos de sociedades (ACSM, ISSN, ADA, SBD), artigos com DOI/PMID. Sem fonte verificável → escrever `fonte não verificada`, nunca inventar.

## Estrutura
```
---
tipo: pesquisa
tema: <tema>
data: AAAA-MM-DD
agente: <nome>
---
# <Tema> — causa e efeito na densidade mitocondrial

## Resumo executivo
(≤ 12 linhas: o que importa para uma pessoa adulta, sedentária ou pouco ativa, com sobrepeso/resistência à insulina)

## Cadeia input → processo → output
(o que entra / o que o corpo faz / o que sai, neste tema)

## Faces da mesma moeda — intervalos de dose
| Faixa | Exemplo concreto | Efeito no processo | Output esperado | Evidência |

## Claims (verificados ou novos)
Para cada um:
- **Afirmação:**
- **Evidência:** forte | moderada | fraca | contestada | não-verificada
- **Mecanismo:**
- **Fontes:** (DOI/PMID/URL verificada)
- **O que o app pode dizer com isso:** (frase para o usuário, em linguagem simples, sem prescrever)

## O que ainda não sabemos

## Sugestões para o brain
(novas notas a criar, notas existentes a alterar, perguntas abertas novas)
```
