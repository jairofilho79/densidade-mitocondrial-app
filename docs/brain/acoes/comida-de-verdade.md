---
tipo: acao
id: comida-de-verdade
grupo: Alimentação
nivel: nucleo
evidencia: forte
setas: [13]
fonte-unica: acoes.json
---
# Comida de verdade em duas das três refeições

**Gatilho:** Ao decidir o que comer: 'isso foi cozinhado ou foi aberto?'

**Ação mínima (2 min):** Uma refeição do dia feita de ingredientes. Registre.

## Por quê
Ultraprocessado faz a pessoa comer ~500 kcal a mais por dia sem perceber, e a associação com diabetes é forte. Mas 'evitar' é registro negativo, que vira culpa. O app inverte: você registra o que comeu, ele classifica com incerteza (até especialistas discordam), e mostra a proporção da semana.

## Faixa pessoal
Variáveis: nenhuma

| Zona | |
|---|---|
| **Pouco** | maioria das refeições de pacote |
| **Ideal** | 2 de 3 refeições feitas de ingredientes (regra de bolso, não evidência de número) |
| **Demais** | não há |

*Regra de bolso:* Gordura trans no rótulo: zero, sem faixa. Excesso calórico piora insulina e ROS, mas *não* danifica a mitocôndria — o dano é outro.

## O que afeta
- **Input:** ultraprocessado, excesso calórico
- **Processo:** +500 kcal/dia, picos de glicose, ROS
- **Output:** resistência à insulina ↑, cintura, peso

## Como o app registra (níveis)
1. Quantas refeições 'cozinhadas' hoje (0–3)
2. O que comeu (o app classifica NOVA com incerteza)
3. —

## Sinal de progresso
**O que muda:** cintura, peso (média semanal)  
**Quando:** 4–12 semanas

## Evidência
**forte** — Hall 2019; Lane 2024

→ [[pesquisa/2026-09-14-triagem-nucleo-fronteira]] · [[decisoes/ADR-008-acoes-atomicas]]