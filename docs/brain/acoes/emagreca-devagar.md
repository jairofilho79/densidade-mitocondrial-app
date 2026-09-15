---
tipo: acao
id: emagreca-devagar
grupo: Corpo e medida
nivel: nucleo
evidencia: forte
setas: ['dano-metab']
fonte-unica: acoes.json
vira-feature-em: v1
---
# Emagreça no máximo meio quilo por semana

**Gatilho:** Ao ver a balança: olhe a média da semana, não o dia. Se caiu mais de 0,5–1% do peso, freie.

**Ação mínima (2 min):** Não cortar mais nada esta semana. Manter proteína e força.

## Por quê
Emagrecer é consequência — mas a velocidade é um input. Déficit moderado (15–25%) perde ~0,5 kg por semana com adaptação pequena (50–120 kcal/dia). Déficit severo derruba o T3 em 3–5 dias e faz o músculo cair mais rápido que a gordura: a balança desce, o metabolismo basal desce junto. O que protege: proteína, força e sono.

## Faixa pessoal
Variáveis: peso

| Zona | |
|---|---|
| **Pouco** | peso estável — não é problema; a adaptação some em 1–2 anos |
| **Ideal** | até {perda_ideal} kg/semana (0,5% de {peso} kg), com proteína e força — esta semana: {delta_peso} |
| **Demais** | mais de {perda_max} kg/semana (1%) sustentado — músculo indo junto |

*Regra de bolso:* A balança engana nas primeiras semanas (água do glicogênio). Peso = média de 7 dias; cintura e panturrilha contam a história certa.

## O que afeta
- **Input:** tamanho do déficit
- **Processo:** termogênese adaptativa; perda de massa magra
- **Output:** metabolismo basal, massa magra

## Como o app registra (níveis)
1. Peso (o app faz a média semanal)
2. + 'comi bem menos que o normal?'
3. + calorias (quem conta)

## Sinal de progresso
**O que muda:** panturrilha e preensão estáveis enquanto a cintura cai  
**Quando:** 4–12 semanas

## Evidência
**forte** — CALERIE; Nunes 2022; Weinheimer 2010; Deller 2026; Loucks 2003

→ [[pesquisa/2026-09-14-triagem-nucleo-fronteira]] · [[decisoes/ADR-008-acoes-atomicas]]