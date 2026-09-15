---
tipo: acao
id: ultimo-cafe
grupo: Sono e ritmo
nivel: nucleo
evidencia: forte
setas: [8, 'faixa-cafe']
fonte-unica: acoes.json
---
# Último café 9 horas antes de deitar

**Gatilho:** Quando pensar em fazer café depois do almoço, olhe o relógio contra a hora de deitar.

**Ação mínima (2 min):** Hoje, o café da tarde vira descafeinado ou chá sem cafeína.

## Por quê
Cafeína seis horas antes de deitar tira mais de uma hora de sono — e a pessoa não percebe, porque pega no sono mesmo assim. O corte para uma xícara (~100 mg) é cerca de 9 horas antes. De manhã, até ~300 mg, o café hidrata como água: o problema é *quando*, não quanto.

## Faixa pessoal
Variáveis: deitar, ultimo_cafe

| Zona | |
|---|---|
| **Pouco** | sem cafeína — já está na meta; a ação não se aplica |
| **Ideal** | último café até {corte_cafe} (9 h antes de deitar às {deitar}); até ~300 mg/dia |
| **Demais** | café depois de {corte_cafe}, ou mais de 400 mg/dia — sono pior sem você notar |

*Regra de bolso:* Um expresso ≈ 60–80 mg; coado 200 mL ≈ 90–120 mg; energético ≈ 80 mg por lata.

## O que afeta
- **Input:** cafeína
- **Processo:** latência e profundidade do sono
- **Output:** sono → insulina, fome, humor

## Como o app registra (níveis)
1. Hora do último café
2. + quantas xícaras
3. + tipo (expresso, coado, energético)

## Sinal de progresso
**O que muda:** 'como acordei' nos dias com café cedo vs tarde  
**Quando:** dia seguinte; padrão em 1–2 semanas

## Evidência
**forte** — Drake 2013; Gardiner 2023 (meta-análise); Killer 2014 (hidratação)

→ [[pesquisa/2026-09-14-triagem-nucleo-fronteira]] · [[decisoes/ADR-008-acoes-atomicas]]