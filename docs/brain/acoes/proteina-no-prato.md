---
tipo: acao
id: proteina-no-prato
grupo: Alimentação
nivel: nucleo
evidencia: forte
setas: ['faixa-proteina']
fonte-unica: acoes.json
vira-feature-em: v1
---
# Proteína em todo prato

**Gatilho:** Ao montar o prato, a proteína entra primeiro. Depois o resto.

**Ação mínima (2 min):** Um ovo, uma lata de atum, um copo de iogurte — o que estiver à mão. Registre.

## Por quê
Proteína é o input mais importante que faltava no protocolo. Ela constrói o músculo onde as mitocôndrias moram, e é o que impede o jejum e a dieta de comerem músculo em vez de gordura. Em dieta, proteína alta poupa cerca de 142 kcal/dia de gasto de repouso. Carne e ovos valem por isso — não por CoQ10 ou ferro.

## Faixa pessoal
Variáveis: peso, proteina_g

| Zona | |
|---|---|
| **Pouco** | menos de {prot_pouco} g/dia (0,8 g/kg) — especialmente combinado com jejum e treino |
| **Ideal** | {prot_min}–{prot_max} g/dia (1,2–1,6 g/kg para {peso} kg) ; dividir em 3 refeições ajuda a lembrar, mas o total é o que importa |
| **Demais** | acima de {prot_max2} g/dia (2,2 g/kg) não há benefício extra |

*Regra de bolso:* Em gramas, pelo rótulo ou app de dieta — suplemento (whey, etc.) entra na conta. Sem pesar: uma palma de carne, peixe ou frango ≈ 25–30 g; 1 ovo ≈ 6 g; 100 g de feijão cozido ≈ 5 g (não verificado).

## O que afeta
- **Input:** proteína
- **Processo:** mTOR → síntese proteica; saciedade
- **Output:** massa magra preservada, metabolismo basal, HbA1c (com força)

## Como o app registra (níveis)
1. Teve proteína em cada refeição? (sim/não)
2. Gramas no dia (rótulo, app, suplemento)
3. Gramas por refeição

## Sinal de progresso
**O que muda:** panturrilha e preensão não caem em dieta; saciedade  
**Quando:** 8–12 semanas

## Evidência
**forte** — Morton 2018; Wycherley (24 RCTs); Weinheimer 2010; Longland 2016

→ [[pesquisa/2026-09-14-triagem-nucleo-fronteira]] · [[decisoes/ADR-008-acoes-atomicas]]