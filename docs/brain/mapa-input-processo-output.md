---
tipo: moc
status: validado
data: 2026-09-11
nota: lente de entendimento, NÃO estrutura do app
---
# Mapa Input → Processo → Output

Lente para enxergar o processo inteiro. Não é modelo de dados do app (ver [[decisoes/ADR-001-diario-nao-prescritivo]]).
Página visual: artifact "Fornalha Metabólica" (link na sessão de 2026-09-11).

## INPUT — o que entra
| Grupo | Item | Para quê |
|---|---|---|
| Alimentos-chave | [[insumos/carne-vermelha-ovos]] | CoQ10, ferro → cadeia respiratória |
| | [[insumos/chocolate-80]] | polifenóis ⚠ Q7 |
| Suplementos | [[insumos/omega-3]] | membrana |
| | [[insumos/nitrato]] | óxido nítrico |
| Líquidos | água, café preto | sustentam o jejum; [[conceitos/hidratacao]] sem via própria (Q1) |
| | refrigerante zero | ⚠ Q7 |
| Regra de tempo | [[protocolos/jejum-intermitente]] (quando comer) | cria o *estado* de jejum |
| Bloqueados | ultraprocessados, açúcar, trans, álcool, fumo | [[protocolos/evitar-ultraprocessados]] |

## PROCESSO — o que o corpo faz
**Estímulos (você aciona, registrável):** [[protocolos/hiit]] · [[protocolos/liss-walking-workout]] · [[protocolos/exposicao-ao-frio]] · [[protocolos/sono]] · jejum *em curso* (o estado).
**Mecanismos (a célula executa, não registrável — é explicação):** [[conceitos/ampk]] → PGC-1α · oxidação de gordura zona 2 · insulina ↓ → [[conceitos/autofagia-mitofagia]] · termogênese [[conceitos/tecido-adiposo-marrom]] · cadeia respiratória (CoQ10, Fe, NO) · proteção de membrana.
**Processo contrário:** [[conceitos/estresse-oxidativo]].

## OUTPUT — o que sai
- **Fisiológico (invisível):** ↑ [[conceitos/densidade-mitocondrial]] · ↓ [[conceitos/resistencia-a-insulina]] (único com exame) · emagrecimento (consequência).
- **Perceptível (indicadores):** [[indicadores/brain-fog]] · [[indicadores/resistencia-no-hiit]] (melhor proxy objetivo) · [[indicadores/fome-emocional]] · fôlego.
- **Malefício (filtro falhou):** mitocôndrias deformadas, inflamação, ganho abortado.
- **Comportamento (retroalimenta):** dopamina do treino → menos fome emocional; hábitos consolidados (álcool/fumo zero).

## Laços (saída vira entrada)
1. **Performance:** HIIT trava mais tarde → tiros mais intensos → mais AMPK → mais biogênese.
2. **Comportamento:** dopamina → menos fome emocional → menos ultraprocessado → menos estresse oxidativo.
3. **Recuperação:** sono → inflamação baixa → próximo HIIT rende. Sem sono, o laço 1 quebra.

## O que a lente revelou (novas perguntas)
- **Jejum é dois registros:** regra de tempo (input) e estado em curso (processo). → [[perguntas-abertas#Q8]]
- **Processo tem dois níveis:** só o de estímulos é registrável. O app nunca toca em AMPK — só explica.
- **Só um output tem exame:** resistência à insulina. → [[perguntas-abertas#Q2]]
- **Hidratação sem seta.** → [[perguntas-abertas#Q1]]
- **Laços são o que o diário deveria mostrar.** Cruzar "tiro em que travou" com sono da noite anterior é a primeira tendência candidata. → nova [[perguntas-abertas#Q9]]

## Revisão após a pesquisa (2026-09-14)
Ver [[pesquisa/2026-09-14-sintese]]. Mudanças no mapa:
- **INPUT** ganha: proteína por refeição, fibra, azeite/gorduras, cafeína com horário, álcool em faixas, adoçante (qual), bebida açucarada, ar/fumaça. "Bloqueados" vira faixas. Refrigerante zero → contestado.
- **PROCESSO** ganha estímulos: força, caminhada pós-refeição, quebrar o sentar, calor passivo. Ganha estados: ritmo circadiano, eixo do estresse, recuperação autonômica. Ganha processo contrário: carga excessiva. Estresse oxidativo ganha face hormética. **Sai:** BAT como mecanismo do banho frio; mitofagia como promessa do jejum.
- **OUTPUT** organizado por custo (A–D). Laço 2 reescrito (sono, não dopamina). Laço 3 ganha via inversa (HIIT protege durante sono ruim).
