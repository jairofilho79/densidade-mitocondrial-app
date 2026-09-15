---
tipo: moc
---
# Perguntas abertas

Regra: nenhuma some sem **resposta** ou **"descartada porque..."**. Quando resolvida, mover para a nota dona e deixar aqui só o link.

## Q1 — Hidratação: qual o mecanismo mitocondrial? ✅ respondida (2026-09-14)
**Não há seta própria em humanos.** Mecanismo só in vitro. É condição de contorno para treino, jejum e glicemia. → [[conceitos/hidratacao]] · [[pesquisa/2026-09-14-hidratacao]]

## Q2 — Quais indicadores objetivos, se algum? ✅ respondida na pesquisa, validar na PoC
Quatro faixas de custo (A: nada · B: fita + relógio · C: exame 12 sem · D: wearable/CGM). → [[indicadores/faixas-de-custo]] · [[pesquisa/2026-09-14-outputs-medicao]]
O que falta: quais a pessoa *já tem* (→ Q15).

## Q3 — Timing de suplementos e treino ✅ respondida (2026-09-14)
Nitrato: 515–1017 mg, 2–3 h antes (ou ≥3 dias); aipo não dosável. Chocolate na janela **quebra** o jejum. Ômega-3: com refeição (absorção), cruzar com TG não com insulina. Antioxidantes em megadose perto do treino anulam a adaptação. → [[insumos/nitrato]] · [[insumos/chocolate-80]] · [[conceitos/estresse-oxidativo]]

## Q4 — "Hábitos" genérico vs. hábitos específicos
"Zero álcool", "frio no banho" são binários diários. "Alimentação" é composto. Modelar tudo como hábito achata a informação.
Direção: descobrir na PoC quais registros são **sim/não** e quais têm **estrutura**.
Status: aberta.

## Q5 — Registrar vs. prescrever ✅ decidido
→ [[decisoes/ADR-001-diario-nao-prescritivo]]

## Q6 — O profissional como segundo usuário
Que profissional? (nutricionista, educador físico, médico). O que ele quer ver que o paciente não vê? Quem controla o que é compartilhado?
Status: aberta — **não bloqueia a PoC**; a PoC é do ponto de vista da pessoa.

## Q7 — Grau de evidência dos claims do documento original ✅ respondida (2026-09-14)
Placar completo em [[pesquisa/2026-09-14-sintese]]. Caíram: mitofagia por jejum 14–16 h, chocolate → biogênese, frio 30–60 s → BAT, CoQ10/ferro da carne, dopamina → fome emocional, "sono aborta o ganho". Sobra: "carga moderada vs all-out" no HIIT nunca foi testado.

## Q8 — Qual a unidade de tempo do registro?
Dia? Refeição? Evento? Um "dia" de jejum começa às 18h de ontem. Um treino é um evento. O sono cruza a meia-noite.
Status: aberta — a PoC vai expor isso na primeira rodada.

## Q9 — Quais cruzamentos (laços) o diário mostra primeiro?
Candidatos com evidência após a pesquisa: (a) sono da véspera × tiros até travar × FC repouso matinal; (b) **sono da véspera × fome emocional** (substitui treino × fome); (c) hora do último café × "como acordei"; (d) hora da última refeição × brain fog matinal; (e) urina escura pré-treino × travei; (f) líquido até 11h × fome forte no jejum; (g) variação de horário de deitar na semana × fome emocional; (h) ar ruim / antibiótico × tiros até travar.
Direção: testar na PoC quais cruzamentos são *sentidos* pela pessoa antes de serem medidos.
Status: aberta.

## Q10 — Jejum: o protocolo é 16 h ou 18 h? Janela cedo ou tardia?
Jantar 18h → almoço 12h = 18 h. A evidência favorece janela *cedo* (Sutton 2018); o hábito social favorece tardia. O benefício da janta cedo é relativo ao horário de dormir (≥3–4 h antes). Decisão de protocolo pessoal, não de ciência.
Status: aberta — decidir na PoC.

## Q11 — Protocolo fixo de HIIT para "tiros até travar" ser comparável
Nº de tiros, duração, descanso, carga e aparelho precisam ficar fixos. Descanso de 1min30 vs 2–4 min da referência. O que o app faz quando a pessoa muda o protocolo? (novo baseline)
Status: aberta.

## Q12 — Como mostrar sinais de excesso sem virar ansiedade
Lição do CGM (obsessão documentada). Qual sinal primeiro: rendimento caindo 2 semanas ou sono/humor? Meeusen: nenhum sozinho basta.
Status: aberta — [[indicadores/sinais-de-excesso]].

## Q13 — Álcool vira faixa em vez de "zero consolidado"?
GBD: zero é o mínimo. Wood 2018: ≤100 g/sem quase neutro. Para o usuário original é zero; para outros usuários é faixa. Decisão de produto.
Status: aberta.

## Q14 — Ultraprocessado: o app classifica (com incerteza) ou a pessoa classifica?
Especialistas discordam (κ≈0,32); leigos brasileiros acertam intuitivamente (Menegassi 2019).
Status: aberta — testar na PoC.

## Q15 — Quais exames o usuário já tem?
Ferritina, B12, 25(OH)D, HOMA-IR, TG/HDL. Sem eles, metade dos insumos "bons" é palpite. O app pergunta no perfil, uma vez.
Status: aberta.

## Q16 — Como registrar proteína sem balança?
"Palma da mão ≈ 25–30 g" é regra de bolso *não verificada*. Testar na PoC.
Status: aberta.

## Q17 — Como registrar estresse sem ser mais um estressor?
PSS-4 semanal vs 1 pergunta diária ("quanto de você foi gasto hoje?" 1–5).
Status: aberta.

## Q18 — Wearable: dado bruto ou só tendência?
Relógios acertam FC repouso (1–6%), erram HRV (10–30%). Se só tendência, calculada onde? → [[decisoes/ADR-005-baseline-proprio]]
Status: aberta.

## Q19 — Fome emocional: a pergunta sem julgamento
Candidata: "fome de estômago ou fome de cabeça?" — é design, sem fonte. Instrumentos validados: TFEQ (mensal), VAS 1–10 (diário).
Status: aberta — testar na PoC.

## Q20 — Quantos dias de urina escura antes de o app sugerir cruzamento com glicemia?
Evidência é de hábito (semanas/anos), não de dia. 14 dias/mês?
Status: aberta.

## Q21 — O efeito protetor do HIIT sobre sono curto dura mais que 5 noites?
Ensaios são de 5 noites em jovens saudáveis. Em sedentários com RI por semanas: desconhecido.
Status: aberta — limitação a declarar no app.

## Q22 — Como mostrar a semana sem virar prescrição? ✅ decidida (2026-09-14)
É meta pessoal, calculada, com próximo passo — chamar de "faixa" era eufemismo. O que evita a prescrição é a fonte visível e o baseline próprio, não o nome. → [[decisoes/ADR-008-acoes-atomicas]]

## Q23 — O app precisa de um output de força medível?
Sem 1RM ou repetições em protocolo fixo, a seta 'força' só se mede por HbA1c a cada 12 sem, e creatina nunca sobe de nível. Preensão/panturrilha (→ [[indicadores/massa-magra]]) cobrem parte.
Status: aberta.

## Q24 — Validar "tiros até travar" na PoC
É o indicador central e **não passa** na triagem (não validado). Validar contra Rockport e FC de recuperação com protocolo fixo, ou aceitar como registro sem afirmação. Depende de Q11.
Status: aberta — bloqueia o laço 1.

## Q25 — "Dias parados" como registro de primeira classe?
O dano mais bem documentado é o desuso (meia-vida ~12 dias; em RI não reverte sozinho). O app conta dias sem estímulo e mostra o custo? Como fazer isso sem culpa?
Status: aberta.

## Q26 — Ordem dos nutrientes na refeição (fibra → proteína → carboidrato) vira ação?
Pedido do usuário (2026-09-14). Há estudos de sequenciamento (vegetais e proteína antes do carboidrato) com redução do pico glicêmico, sobretudo em DM2. **Não foi verificado nesta rodada** — precisa passar pela triagem (ADR-007) antes de virar ação atômica. Se passar, é a ação mais barata da lista: mesma comida, outra ordem.
Status: aberta — verificar antes de construir.
