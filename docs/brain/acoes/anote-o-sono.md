---
tipo: acao
id: anote-o-sono
grupo: Sono e ritmo
nivel: nucleo
evidencia: instrumento
setas: ['instrumento']
fonte-unica: acoes.json
---
# Anote a hora que deitou e levantou

**Gatilho:** Ao pegar o celular de manhã: dois toques.

**Ação mínima (2 min):** Só a hora de levantar. O app pergunta a de deitar depois.

## Por quê
Dois campos dão três informações: quanto dormiu, se o horário é regular, e quanto varia no fim de semana. É o registro mais barato e mais informativo do app inteiro — e o que permite cruzar sono com fome, com o treino e com o café.

## Faixa pessoal
Variáveis: nenhuma

| Zona | |
|---|---|
| **Pouco** | — |
| **Ideal** | registrar todo dia; a regularidade (±30 min) o app calcula e mostra, sem afirmar efeito (fronteira) |
| **Demais** | — |

*Regra de bolso:* É um hábito de medição, não de comportamento — mas é o que faz os outros funcionarem.

## O que afeta
- **Input:** —
- **Processo:** —
- **Output:** todos os cruzamentos com sono

## Como o app registra (níveis)
1. Deitar + levantar
2. + despertares + 'como acordei'
3. + relógio

## Sinal de progresso
**O que muda:** o próprio gráfico  
**Quando:** 1 semana

## Evidência
**instrumento** — escalas SQS; Windred 2024 (regularidade, fronteira)

→ [[pesquisa/2026-09-14-triagem-nucleo-fronteira]] · [[decisoes/ADR-008-acoes-atomicas]]