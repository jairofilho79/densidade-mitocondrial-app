---
tipo: acao
id: jante-cedo
grupo: Sono e ritmo
nivel: nucleo
evidencia: moderada
setas: [10]
fonte-unica: acoes.json
---
# Jante 3 horas antes de deitar

**Gatilho:** Defina o horário do jantar pela hora de deitar, não pela fome.

**Ação mínima (2 min):** Hoje, terminar o jantar 30 minutos mais cedo que ontem.

## Por quê
A mesma refeição uma hora antes de deitar sobe a glicose 8% a mais do que quatro horas antes — e deixa a fome maior de manhã. Seu jantar às 18h é uma vantagem, mas não por ser 18h: é por estar longe da hora de dormir. Se a hora de deitar mudar, o jantar acompanha.

## Faixa pessoal
Variáveis: deitar, jantar

| Zona | |
|---|---|
| **Pouco** | não há 'pouco' — jantar cedo demais só encurta a janela de comer |
| **Ideal** | terminar o jantar até {jantar_ideal} (3 h antes de deitar às {deitar}) |
| **Demais** | jantar a menos de 1 h de deitar |

*Regra de bolso:* Vale para a refeição principal; um lanche leve mais tarde pesa menos.

## O que afeta
- **Input:** a refeição
- **Processo:** ritmo circadiano, tolerância à glicose à noite
- **Output:** glicose ↑ à noite, fome de manhã

## Como o app registra (níveis)
1. Hora que terminou o jantar
2. + o que comeu
3. —

## Sinal de progresso
**O que muda:** fome ao acordar; 'como acordei'  
**Quando:** dia seguinte; padrão em 2 semanas

## Evidência
**moderada** — Garaulet 2022; Gu 2020

→ [[pesquisa/2026-09-14-triagem-nucleo-fronteira]] · [[decisoes/ADR-008-acoes-atomicas]]