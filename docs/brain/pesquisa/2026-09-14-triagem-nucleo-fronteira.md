---
tipo: pesquisa
tema: triagem Núcleo / Fronteira dos claims das 7 pesquisas de 2026-09-14
data: 2026-09-14
agente: revisor-triagem (Claude Opus 5)
aplica: "[[../decisoes/ADR-007-nucleo-e-fronteira]]"
---
# Triagem Núcleo / Fronteira — um claim por linha

> Aplica **exatamente** os 4 critérios da [[../decisoes/ADR-007-nucleo-e-fronteira]] a cada claim das notas [[2026-09-14-verificacao-claims]] · [[2026-09-14-hidratacao]] · [[2026-09-14-alimentacao-jejum]] · [[2026-09-14-exercicio]] · [[2026-09-14-sono-estresse-circadiano]] · [[2026-09-14-ambiente-termico-toxicos]] · [[2026-09-14-outputs-medicao]] e à [[2026-09-14-sintese]].
> Um critério que falhe → Fronteira. Em dúvida → Fronteira.

## Como ler

**Critérios (ADR-007), todos obrigatórios para Núcleo:**
1. Evidência forte, ou moderada com ≥2 estudos independentes em humanos na mesma direção;
2. Sem meta-análise/revisão sistemática recente apontando o contrário;
3. Efeito grande o suficiente para a pessoa perceber ou medir na faixa A–C de custo;
4. População próxima do público-alvo (adulto sedentário/sobrepeso/RI) ou mecanismo básico.

**Ações:** `seta` (mapa + cruzamento) · `registro` (app registra, não afirma efeito) · `curiosidade` (seção separada, sem seta) · `nao-mostrar`.

**Convenções desta triagem:**
- Item **Núcleo + `registro`** = faixa de referência, instrumento validado ou aviso de segurança com evidência consolidada. Aparece no app como faixa/campo/aviso com fonte, **não como seta**. Não gera cruzamento.
- Item **Núcleo + `curiosidade`** = fato consolidado sem ação possível (contexto explicativo). Raro; marcado como "contexto".
- "Medir na faixa A–C" inclui glicemia capilar com glicosímetro doméstico (custo de fita, faixa B/C) e exames a cada 12 semanas (faixa C). HRV/CGM/VO2 de relógio são faixa D e **não** contam para o critério 3.
- Fontes novas desta triagem (abertas via API Europe PMC nesta sessão; a cota de WebSearch da sessão já estava esgotada) estão listadas na seção **Verificações externas** ao fim. Nada além disso foi acrescentado às fontes das notas.

---

## Tabela de triagem

| # | Tema | Claim (uma frase) | Evidência (como está na nota) | Nível | Critério que decidiu | Ação no app |
|---|---|---|---|---|---|---|
| 1 | Exercício | Tiros curtos "all-out" (3×20 s ou 4–6×30 s), 3×/sem, por 6–12 sem, aumentam citrato sintase, sensibilidade à insulina e VO2pico em sedentários e pessoas com sobrepeso. | forte (Gillen 2014/2016; Boyd 2013; Mølmen 2025 meta-regressão 343 estudos; Rosenblat 2022; Wen 2019; Jelleyman 2015) | **Núcleo** | 1–4 ✓ (população: sedentários/IMC 26–30; efeito: VO2 +12–19 %, insulina +53 %; medível por Rockport/HOMA-IR) | `seta` |
| 2 | Exercício | O formato exato do protocolo (30 s / 1 min 30, "carga moderada", 5–7 min) equivale ao SIT all-out testado. | moderada — nunca testado como tal; Boyd 2013 mostra que 70 % da intensidade mantém ganho de CS mas reduz VO2 | Fronteira | 1 (formato não testado; extrapolação de família) | `registro` — app compara sessões só com o mesmo protocolo e aparelho; texto: "os estudos usaram esforço máximo" |
| 3 | Exercício | HIIT sobe VO2max ~5,5 mL/kg/min em 8–12 sem, mais em quem começa pior. | forte (Milanović 2015, 28 ensaios) | **Núcleo** | 1–4 ✓ (mesma seta do item 1; medível por Rockport, faixa B) | `seta` (output do item 1) |
| 4 | Exercício | Caminhada leve "ritmo de conversa" expande/especializa mitocôndrias para oxidar gordura. | moderada para ↑ oxidação de gordura em sedentários; contestada/fraca para "expande mitocôndrias" (Storoschuk 2025; San-Millán é transversal) | Fronteira | 2 (revisão 2025 refuta "zona 2 ótima para mitocôndria"); 3 (oxidação de gordura não é medível em A–C) | `curiosidade` — o volume entra pela referência do item 5 |
| 5 | Exercício | 150–300 min/sem de atividade moderada é a faixa de referência; retorno quase máximo em 300–600; o LISS atual (60–120 min) fica abaixo. | forte (Bull 2020/OMS; Lee 2022, 116 mil adultos; Ekelund 2016) | **Núcleo** | 1–4 ✓ como **faixa de referência** (desfecho é mortalidade, não medível; por isso não é seta) | `registro` — soma semanal contra a faixa, com fonte; nunca "meta" |
| 6 | Exercício | Intensidade melhora função mitocondrial; volume constrói conteúdo — estímulos complementares. | moderada (Granata 2018; CrossTalk MacInnis × Bishop 2019 com posições opostas) | Fronteira | 2 (debate publicado em aberto); 3 (biópsia) | `curiosidade` |
| 7 | Exercício | Treino aeróbio regular reduz FC de repouso, mais em quem começa alta. | forte (Reimers 2018, 191 estudos) | **Núcleo** | 1–4 ✓ (medível em B; população geral; mecanismo básico) | `seta` (treino → FC repouso ↓, tendência própria) |
| 8 | Exercício | Exercício reduz gordura visceral (−6 %) mesmo sem perda de peso; cintura cai com peso igual. | forte (Verheggen 2016, 117 estudos) | **Núcleo** | 1–4 ✓ (medível em B: cintura) | `seta` (treino → cintura ↓ mesmo com peso igual) |
| 9 | Exercício | Interromper o tempo sentado com 2–5 min de caminhada leve a cada 20–30 min reduz glicose e insulina pós-refeição (SMD −0,3 a −0,55); mais em obesidade. | forte (Loh 2020; Gale 2026, 53 estudos; Chang 2025, 17 RCTs em obesidade; Buffey 2022) | **Núcleo** | 1–4 ✓ (4 meta-análises; população inclui obesidade; medível com glicosímetro; efeito crônico em mitocôndria **não** demonstrado — a seta é só para glicose pós-refeição) | `seta` |
| 10 | Exercício | >8 h/dia sentado eleva mortalidade (HR 1,59), salvo com 60–75 min/dia de atividade moderada. | forte (Ekelund 2016, >1 milhão) | **Núcleo** | 1–4 ✓ como contexto do item 9 (desfecho não medível) | `registro` — "maior bloco sentado sem pausa" |
| 11 | Exercício | 7.000 passos/dia captura a maior parte do benefício; inflexão em 5–7 mil; <60 anos ganha até 8–10 mil. | forte (Ding 2025; Paluch 2022, 15 coortes) | **Núcleo** | 1–4 ✓ como **faixa de referência** (observacional; desfecho mortalidade/DM2) | `registro` — faixas <5k / 5–7k / 7–10k, curva que achata |
| 12 | Exercício | Caminhada de 10 min logo após cada refeição principal reduz glicemia pós-prandial, com maior efeito no jantar; movimento 0–29 min após comer supera antes ou nada. | forte (Engeroff 2023, 8 RCTs; Buffey 2022) + moderada (Reynolds 2016, RCT n=41 DM2) | **Núcleo** | 1–4 ✓ (2 meta-análises + RCT em DM2; medível com glicosímetro; perceptível como sonolência pós-prandial é hipótese, não claim) | `seta` |
| 13 | Exercício | Subir escada 1–3 min após comer reduz glicose e insulina pós-refeição. | fraca-moderada (Moore 2024, RCT crossover n=31, jovens saudáveis) | Fronteira | 1 (RCT único); 4 (jovens) | `curiosidade` |
| 14 | Exercício | Treino de força 2–3×/sem (3×8–10, 12–16 sem) reduz HbA1c e glicose de jejum (SMD −0,63) e melhora sensibilidade à insulina. | forte (Su 2023, 26 RCTs em DM2; Robinson 2017) | **Núcleo** | 1–4 ✓ (população DM2/RI; medível em C; força perceptível em A) | `seta` |
| 15 | Exercício | Força + HIIT na mesma semana não interferem em hipertrofia nem força máxima. | forte (Schumann 2022, 43 estudos) | **Núcleo** | 1–4 ✓ (informa o design; sem seta própria) | `registro` — nota anexa ao item 14: "podem ficar no mesmo dia" |
| 16 | Exercício | Força "dilui" a densidade mitocondrial sem perder mitocôndrias; respiração por mitocôndria pode melhorar. | moderada/contestada (Parry 2020; Groennebaek 2017; CS conflitante) | Fronteira | 2 (medidas conflitantes); 3 (biópsia) | `curiosidade` |
| 17 | Exercício | 4 semanas de carga progressiva de HIIT reduzem respiração mitocondrial e tolerância à glicose; reverte com recuperação. | moderada (Flockhart 2021, único, n pequeno, ativos recreacionais com carga muito acima de 3×/sem) | Fronteira | 1 (estudo único); 4 (ativos, carga irreal para o público) | `curiosidade` |
| 18 | Exercício | Sinais de excesso: queda de rendimento + humor + sono por semanas; HRV de repouso é pouco sensível; nenhum marcador isolado é diagnóstico. | moderada (consenso Meeusen 2013; Bellenger 2016 em atletas) | Fronteira | 4 (consenso em atletas; extrapolação); 3 (sem limiar validado) | `registro` — o app registra os três sinais; não rotula "overtraining" |
| 19 | Exercício | 5 noites de 4 h derrubam respiração mitocondrial, tolerância à glicose e síntese proteica; 3 sessões de HIIT no período anulam a queda. | moderada (Saner 2020/2021, RCT único, n=24 homens jovens; Knowles 2024 aponta sobreposição gênica só de 18–39 %) | Fronteira | 1 (RCT único, sem replicação independente); 4 (jovens saudáveis; efeito depende de estado de treino) | `curiosidade` — **não** dizer "o HIIT segura a linha" |
| 20 | Exercício | Treinar em jejum aumenta oxidação de gordura na hora; sem vantagem de peso a longo prazo; protegeu tolerância à glicose sob dieta hipercalórica. | moderada (Vieira 2016, 27 estudos agudos; Van Proeyen 2010, RCT único em jovens); Kazeminasab 2025 e Frampton 2022: sem vantagem aguda, mais fome | Fronteira | 2 (meta-análises 2022/2025 não veem vantagem); 3 (oxidação aguda não medível) | `registro` — "em jejum ou alimentado" junto do treino |
| 21 | Exercício | Treinar a 33 °C sem aclimatação bloqueia o ganho inicial de VO2pico. | fraca-moderada (Slivka 2021, único, n=21 homens destreinados) | Fronteira | 1 (estudo único) | `registro` — temperatura/calor junto do treino |
| 22 | Exercício | "Tiro em que travou" corresponde ao decremento de sprint repetido; mais mitocôndria = trava mais tarde. | moderada para o mecanismo (Girard 2011; Kerhervé 2020, atletas); a validade da medida "tiro em que travou" nunca foi testada | Fronteira | 1 (medida não validada); 4 (RSA em atletas) | `registro` — protocolo fixo (nº, duração, descanso, aparelho); app mostra tendência sem afirmar "mais mitocôndria" |
| 23 | Exercício | Sessão-RPE (CR-10 × minutos) é válida e reprodutível para carga de treino. | forte (Haddad 2017, 36 estudos; Foster 2001; Borg 1982) | **Núcleo** | 1–4 ✓ (instrumento) | `registro` — instrumento de faixa A |
| 24 | Exercício | FC de recuperação ≤12 bpm no 1º min é anormal e prediz mortalidade; melhora com treino aeróbio. | forte para prognóstico (Cole 1999; Vivekananthan 2003, população clínica); moderada/fraca como marcador de adaptação em sedentários (Casanova-Lizón 2022: dados insuficientes) | Fronteira | 4 (população clínica); 1 (adaptação em sedentários: dados insuficientes) | `registro` — nível B; sinalizar ≤12 como "vale conversar com médico", sem seta de treino |
| 25 | Exercício | Começar HIIT sedentário tem risco baixo (1 evento grave/17 mil sessões em cardiopatas); sintomas (dor no peito, falta de ar desproporcional, tontura) exigem parar e avaliar. | moderada (Wewege 2018, 23 estudos em reabilitação; ACSM não aberto) | **Núcleo** (aviso de segurança) | 1–4 ✓ como aviso (não é seta; direção conservadora) | `registro` — aviso sempre visível no registro de HIIT |
| 26 | Exercício | HIIT curto (3×20 s) é tão tolerável quanto 10×1 min em inativos; prazer maior que contínuo em obesidade. | moderada, **fonte não verificada** para valores (revisões vistas em busca) | Fronteira | 1 (fonte não verificada) | `nao-mostrar` até verificar |
| 27 | Exercício | 2 sessões/sem já melhoram VO2; 3 um pouco mais (10,8 % vs 13,6 %). | moderada, **fonte não verificada** | Fronteira | 1 (fonte não verificada) | `nao-mostrar` |
| 28 | Sono | Uma noite de 4 h reduz sensibilidade à insulina; 1 semana de 5 h reduz 11–20 %. | forte (Donga 2010; Buxton 2010; Spiegel 1999; Broussard 2012; Sondrup 2022, 21 RCTs) | **Núcleo** | 1–4 ✓ (meta-análise de RCTs; mecanismo básico; perceptível como fome/energia no dia seguinte; medível em C ao longo de semanas) | `seta` (sono da véspera → glicose/fome/energia) |
| 29 | Sono | Sono curto eleva grelina, reduz leptina, aumenta fome ~24 % e ingestão ~385 kcal/dia; estender o sono 1,2 h reduz ingestão ~270 kcal/dia. | forte (Spiegel 2004; Al Khatib 2017, 17 estudos; Greer 2013; Tasali 2022, RCT n=80 com sobrepeso) | **Núcleo** | 1–4 ✓ (RCT em sobrepeso; perceptível: fome/"comi sem fome") | `seta` (sono da véspera → fome/comer sem fome) — cruzamento principal da fome emocional |
| 30 | Sono | Risco de DM2 é mínimo em 7–8 h; sobe 9 %/h a menos. | forte (Shan 2015, 10 coortes, 482 mil) | **Núcleo** | 1–4 ✓ como **faixa de referência** (observacional; desfecho não medível) | `registro` — faixa 7–8 h com fonte |
| 31 | Sono | Sono longo habitual (>9 h) aumenta risco de DM2 (14 %/h a mais). | forte para associação; contestada para causalidade (provável marcador de apneia/depressão) | Fronteira | 2 (causalidade contestada) | `curiosidade` — "olhe a qualidade, não durma menos" |
| 32 | Sono | Sono fragmentado ou sem sono profundo, com a mesma duração, reduz sensibilidade à insulina ~25 %. | moderada (Stamatakis 2010, n=11; Tasali 2008, n=9; jovens saudáveis) | Fronteira | 1 (dois estudos de n≈10; "em dúvida, Fronteira"); 4 (jovens) | `registro` — nº de despertares; sem seta |
| 33 | Sono | Dormir até tarde no fim de semana não restaura a sensibilidade à insulina e atrasa o relógio. | moderada (Depner 2019, RCT único, n=36) | Fronteira | 1 (RCT único) | `curiosidade` |
| 34 | Sono | Regularidade do horário de dormir/acordar prediz mortalidade cardiometabólica melhor que duração; jet lag social ↔ IMC maior. | moderada (Windred 2024, coorte n=61 mil; Roenneberg 2012) | Fronteira | 3 (desfecho mortalidade/IMC populacional; não medível no prazo do app); só observacional, 2 coortes — "em dúvida, Fronteira" | `registro` — app calcula variação semanal de horário a partir de deitar/levantar; mostra tendência sem seta |
| 35 | Sono/circadiano | Jantar 1 h antes de dormir eleva glicose pós-prandial (+8 % AUC) vs 4 h; comer tarde aumenta fome e reduz gasto; concentrar calorias de manhã reduz HOMA-IR e peso. | moderada-forte (Garaulet 2022, n=845 crossover; Vujović 2022, sobrepeso; Jakubowicz 2013, RCT síndrome metabólica; Sutton 2018) | **Núcleo** | 1–4 ✓ (≥3 grupos independentes; população sobrepeso/SM; medível: HOMA-IR/peso em 12 sem; perceptível: fome de manhã) | `seta` (hora da última refeição em relação ao deitar → fome/glicose) |
| 36 | Sono/circadiano | Tela à noite suprime melatonina ~55 % e atrasa o relógio; efeito no sono medido por PSG tem IC cruzando zero. | forte (melatonina/fase: Chang 2015; Schöllhorn 2023); contestada (sono medido: Cajochen 2022, não aberto) | Fronteira | 2 (meta-análise PSG com IC cruzando zero para o desfecho que importa) | `registro` — "tela na última hora?" sem seta |
| 37 | Sono/circadiano | Turnos rotativos aumentam risco de DM2 (OR 1,09; 1,37 em homens); "madrugadas codando" são turno auto-imposto. | moderada (Gan 2015, 12 estudos; analogia não testada) | Fronteira | 4 (população de turnos; analogia) | `curiosidade` |
| 38 | Sono | Cafeína reduz sono total (−45 min) e profundo; 1 café (107 mg) até 8,8 h antes de dormir; 400 mg 6 h antes tira >1 h sem a pessoa perceber. | forte (Gardiner 2023, 24 estudos; Drake 2013) | **Núcleo** | 1–4 ✓ (meta-análise; mecanismo básico; perceptível: "como acordei") | `seta` (hora do último café → sono/como acordei) |
| 39 | Sono | Álcool à noite encurta latência só em dose alta; já em dose baixa reduz REM, mantém FC alta e parassimpático suprimido nas primeiras 3 h; 2ª metade da noite fragmentada. | forte (Gardiner 2025, 27 estudos; Ebrahim 2013; Pietilä 2018) | **Núcleo** | 1–4 ✓ (meta-análise; perceptível: acorda pior; FC noturna se tiver relógio) | `seta` (álcool à noite → sono pior) |
| 40 | Estresse | Estresse crônico → cortisol → gordura visceral e resistência à insulina; mitocôndria como "carga alostática". | moderada observacional (Hackett & Steptoe 2017; Jackson 2017, n=2.527); fraca para mitocôndria (quase só animal) | Fronteira | 3 (associação populacional, efeito não medível em 12 sem); 1 (mitocôndria: animal) | `registro` — PSS-4 semanal ou 1 pergunta diária; tendência sem seta |
| 41 | Estresse/hormese | O ROS do treino é o sinal; vit. C 1 g + E 400 UI anulam o ganho de sensibilidade à insulina do treino; 500 mg de C não prejudica. | moderada-forte (Ristow 2009, RCT n=39; Paulsen; Yfanti) | Fronteira | 3 (a pessoa não percebe; HOMA-IR em 12 sem seria o único sinal); 4 (jovens treinados e não treinados) | `registro` — suplemento antioxidante em alta dose; texto de curiosidade "antioxidante em cápsula pode apagar o sinal do treino" |
| 42 | Recuperação | HRV (rMSSD) serve como tendência de 7 dias (mín. 3 medidas válidas); FC de repouso alta associa-se a DM2 (+19 %/10 bpm); HRV é reduzida em DM2. | moderada (Plews 2013/2014 em atletas; Aune 2015; Benichou 2018); relógio erra 10–30 % em HRV absoluta (Nunan 2010; O'Grady 2024) | Fronteira | 4 (protocolo de monitoramento vem de atletas); 3 (faixa D) | `registro` — só média móvel de 7 dias e direção, nunca número do dia; conforme [[../decisoes/ADR-005-baseline-proprio]] |
| 43 | Sono | Cochilo de 10–20 min melhora alerta sem inércia; ≥60 min/dia habitual associa-se a DM2 (OR 1,46). | moderada (Brooks & Lack 2006, n pequeno, jovens; Yamada 2016, observacional) | Fronteira | 1 (RCT pequeno em jovens); 2/3 (cochilo longo é marcador, não causa) | `curiosidade` |
| 44 | Comportamento | "Dopamina do treino" reduz fome emocional. | contestada/fraca (Beaulieu 2021: ingestão muda pouco; Siebers 2026: endocanabinoides; Smith 2023: g≈0,22) | Fronteira | 2 (revisões contrárias como mecanismo) | `nao-mostrar` (como mecanismo); o laço "treino → sono/humor → menos comer por emoção" é `curiosidade` |
| 45 | Sono | Instrumentos curtos validados: SQS (1 item, r −0,92 com PSQI), PHQ-2, VAS de fome, Hooper (4 itens), Epworth-BR. | moderada (validados em outras populações; Snyder 2018; Kroenke 2003; Flint 2000; Hooper 1995; Bertolazi 2009) | **Núcleo** (instrumentos) | 1–4 ✓ como instrumentos (não são claims de efeito) | `registro` |
| 46 | Sono | "Como acordei" 1–5, brain fog 0–10 de 1 item, PSS-4 semanal, "comi por fome ou por outra coisa?" são proxies válidos. | não-verificadas como instrumentos (PSS-4 α 0,60; brain fog 5 itens validado só pós-COVID) | Fronteira | 1 (sem validação) | `registro` — hipótese de PoC; sem cruzamento afirmado |
| 47 | Jejum | 16:8 em adultos com sobrepeso reduz peso (−1,5 kg), gordura (−1,1 kg), cintura (−1 cm) e HOMA-IR (−0,32) em 8–12 sem; insulina de jejum com alta certeza. | forte (Huang 2023, 8 RCTs; Sun 2024 umbrella; confirmado nesta triagem por Khalafi 2024/2025, He 2024, Sun 2025) | **Núcleo** | 1–4 ✓ (população sobrepeso; medível: peso semanal, cintura, HOMA-IR em 12 sem; efeito modesto mas mensurável) | `seta` (duração real do jejum → peso/cintura/HOMA-IR); texto "devagar, ~1 kg de gordura por 2–3 meses" |
| 48 | Jejum | Jejum sem orientação de proteína/treino custa massa magra desproporcionalmente. | contestada na nota (Lowe 2020 sim; Huang 2023 ns). Verificado nesta triagem: perda pequena e consistente sem treino (Khalafi 2025: −0,81 kg; Sun 2025: −0,58 kg); preservada com treino de força (Ho 2024; Hays 2025) | Fronteira | 3 (−0,6 a −0,8 kg não é medível em A–C; bioimpedância não confiável para isso) | `curiosidade` — "quem manteve proteína e força não perdeu músculo" (sem seta) |
| 49 | Jejum | Janela cedo (terminando à tarde) melhora sensibilidade à insulina, PA e estresse oxidativo mesmo sem perder peso; supera a janela tardia. | moderada (Sutton 2018, n=8; Dote-Montero 2025, n=197: peso igual entre janelas, só glicose de jejum melhor no eTRE; Huang 2023: eTRE vs tardio ns) | Fronteira | 1 (Sutton n=8; diferença eTRE vs tardio ns em peso nas meta-análises) | `curiosidade` — "a variante com melhor sinal em glicose"; registrar horário da janela |
| 50 | Jejum | Jejum de 14–16 h ativa autofagia/mitofagia de forma relevante em humanos. | fraca (Jamshed 2019: mRNA de LC3A +22 % em sangue, n=11; Dethlefsen 2018: músculo muda pouco em 36 h; Shabkhizan 2023: cinética desconhecida) | Fronteira | 1 (só marcador indireto; extrapolação de roedores) | `curiosidade` — "ninguém mediu em quantas horas 'liga' em pessoas" |
| 51 | Jejum | 18–20 h diários (jantar 18h → almoço 12h) têm evidência própria. | fraca (Sutton usou janela cedo; 18–20 h à noite sem estudo próprio) | Fronteira | 1 (sem estudo na dose/horário) | `registro` — app calcula a duração real (18 h, não 14–16) e a mostra |
| 52 | Jejum | 12:12 é neutro (não muda composição nem HOMA-IR). | moderada (Sampieri 2024, n=41) | Fronteira | 1 (RCT único) | `nao-mostrar` (piso, sem uso) |
| 53 | Jejum | Jejum prolongado (≥3 dias) muda proteoma e cortisol, sem benefício mitocondrial demonstrado; riscos. | fraca (Pietzner 2024, n=12, sem controle) | Fronteira | 1 | `registro` — evento, não meta |
| 54 | Jejum | Jejum não aumenta fome/compulsão mais que dieta contínua; eventos adversos leves iguais ao controle. | moderada (Elsworth 2023, 17 RCTs, certeza muito baixa; Zhong 2024, 15 RCTs) | Fronteira | 1 (certeza GRADE muito baixa) | `registro` — cruzamento jejum × primeira refeição, sem afirmação |
| 55 | Jejum | Em mulheres com peso normal, jejum leve não altera eixo hormonal; em SOP reduz andrógenos; nada sobre pós-menopausa. | fraca (Cienfuegos 2022) | Fronteira | 1 | `registro` — fase do ciclo como campo opcional |
| 56 | Proteína | ~1,2–1,6 g/kg/dia é o platô para massa magra com treino; abaixo de ~1,0 em déficit/jejum há perda de músculo. | forte (Morton 2018, 49 estudos; Devries 2018; ESPEN) | **Núcleo** (faixa de referência) | 1–4 ✓ como **faixa** (efeito em massa magra é pequeno: +0,3 kg em Morton — por isso não é seta) | `registro` — faixa g/dia para o peso da pessoa, com fonte; nunca meta |
| 57 | Proteína | Distribuir em 3–4 refeições (~0,4 g/kg) rende mais síntese proteica que concentrar no jantar. | forte na nota (Mamerow 2014, n=8; Schoenfeld & Aragon 2018). Verificado nesta triagem: Jespersen 2021 (revisão sistemática): evidência **insuficiente** para força/turnover; Schoenfeld 2013 (meta): timing irrelevante, total é o que prediz | Fronteira | 1 (RCT único n=8); 2 (revisão sistemática 2021 diz insuficiente) | `curiosidade` — o app pode sugerir testar janela de 8 h, sem seta |
| 58 | Proteína | Em déficit agressivo com treino intenso, 2,4 g/kg preserva/aumenta massa magra mais que 1,2. | moderada (Longland 2016, RCT único, jovens ativos) | Fronteira | 1; 4 | `curiosidade` |
| 59 | Carboidrato | Pessoa sem diabetes passa ~96 % do dia em 70–140 mg/dL; "pico" = >140, principalmente repetido. | moderada (Shah 2019, n=153, CGM) | Fronteira | 3 (faixa D); utilidade do CGM contestada (item 105) | `registro` — só se a pessoa já mede |
| 60 | Carboidrato | A flutuação da glicose (não só a média) correlaciona com estresse oxidativo (r=0,86). | moderada (Monnier 2006, caso-controle em DM2, n=21+21) | Fronteira | 1 (estudo único); 4 (DM2) | `curiosidade` |
| 61 | Carboidrato | Fibra 25–29 g/dia e carboidrato integral reduzem risco de diabetes 15–30 %; ensaios mostram queda de peso e glicemia. | forte (Reynolds 2019, 185 coortes + 58 ensaios) | **Núcleo** (faixa de referência) | 1–4 ✓ como **faixa** (efeito em 12 sem é modesto; perceptível como saciedade é plausível, não claim) | `registro` — faixa 25–29 g com exemplos; sem cruzamento |
| 62 | Carboidrato | Dieta de baixo IG reduz HOMA-IR modestamente. | moderada (Yu 2025, 6 RCTs pequenos, SMD 0,31); Reynolds 2019: IG com "reduções menores ou nulas" | Fronteira | 2 (Lancet 2019 minimiza IG); 3 (pequeno) | `curiosidade` |
| 63 | Carboidrato | Bebida açucarada aumenta DM2 +13 %/porção/dia independente do peso; suco +7 %; frutose líquida a 25 % das kcal piora sensibilidade à insulina e gordura visceral em 10 sem. | forte (Imamura 2015; Stanhope 2009) | **Núcleo** | 1–4 ✓ (meta-análise + RCT mecanístico; medível: cintura em 12 sem; população sobrepeso em Stanhope) | `seta` (bebida açucarada/suco → cintura/glicemia) — input ruim |
| 64 | Gordura | Trocar saturada por insaturada melhora sensibilidade à insulina (−10 % com saturada); excesso de saturada vai para fígado/víscera; 3 dias de dieta gordurosa reduzem PGC-1α 20 %. | moderada (KANWU n=162; LIPOGAIN; Sparks 2005; contraponto Seyssel 2014); de Souza 2015: saturada sem associação com DM2 (certeza muito baixa) | Fronteira | 2 (de Souza 2015 e Seyssel 2014 na direção contrária); 3 (biópsia/RM) | `curiosidade` — "a mesma sobra vai para lugares diferentes" |
| 65 | Gordura | Gordura trans industrial não tem dose segura (mortalidade +34 %). | forte (de Souza 2015) | **Núcleo** (registro) | 1–4 ✓ como flag (desfecho não medível; relevância no rótulo) | `registro` — flag de rótulo "gordura vegetal hidrogenada" |
| 66 | Gordura | Azeite extra-virgem em dieta mediterrânea reduz incidência de diabetes 40 % em 4 anos. | forte na nota (PREDIMED, Salas-Salvadó 2014, n=3.541, subgrupo) | Fronteira | 1 (RCT único, subgrupo, dose de azeite não verificada); 3 (desfecho a 4 anos, não medível no prazo do app) | `registro` — azeite como alimento-chave registrável; sem seta |
| 67 | Cacau | Cacau ≥70 % melhora HOMA-IR, pressão e função endotelial. | moderada (Hooper 2012, 42 RCTs: HOMA-IR −0,67, PAD −1,6). Verificado nesta triagem: Arisi 2024 (31 RCTs): glicose −4,9 mg/dL, PAS −2,5 mmHg, **HbA1c ns** | Fronteira | 3 (efeito pequeno demais para perceber ou medir com confiança em 12 sem) | `curiosidade` — "sinal real e pequeno; conta calorias" |
| 68 | Cacau | Epicatequina do chocolate 80 % estimula genes da biogênese mitocondrial. | fraca (Taub 2016, n=17; Taub 2012, n=5) e contestada (Mehdipour 2025, 5 RCTs: VO2max sem efeito) | Fronteira | 2 (meta-análise contrária); 1 (n=5/17) | `curiosidade` — "um estudo pequeno viu; somando todos, o fôlego não aparece" |
| 69 | Chá verde | Chá verde reduz glicose de jejum e HbA1c modestamente. | moderada na nota (Liu 2013, 17 RCTs). Verificado nesta triagem: Asbaghi 2021 (14 RCTs): **sem efeito** em glicose, insulina, HbA1c, HOMA-IR; Xu 2020 (27 RCTs): glicose −1,4 mg/dL, HbA1c ns; Ghoflchi 2025 (síndrome metabólica): sem efeito geral | Fronteira | 2 (≥2 meta-análises recentes sem efeito); 3 (−1,4 mg/dL) | `curiosidade` — "líquido permitido na janela; sinal metabólico incerto" |
| 70 | Resveratrol | Resveratrol ativa AMPK/PGC-1α e melhora HOMA em obesos. | contestada (Timmers 2011, n=11; Ghalichi 2026 umbrella em DM2: sem efeito) | Fronteira | 2 | `nao-mostrar` (vinho entra como álcool) |
| 71 | Nitrato | Nitrato (515–1017 mg, 2–3 h antes ou ≥3 dias) melhora endurance; efeito pequeno, maior em não atletas. | forte para performance com efeito pequeno (Tian 2025 umbrella: SMD 0,2–0,37; Qin 2026: VO2max SMD 0,24) | Fronteira | 3 (SMD 0,2–0,37 dificilmente perceptível em "tiros até travar"); a medida caseira não é validada (item 22) | `registro` — hora e dose junto do treino; sem seta |
| 72 | Nitrato | Nitrato melhora eficiência mitocondrial (P/O). | contestada (Larsen 2011 sim; Whitfield 2016 não) | Fronteira | 2 | `nao-mostrar` como mecanismo; `curiosidade` no máximo |
| 73 | Nitrato | Aipo é fonte dosável de nitrato. | fraca/não-verificada (261 mg/100 g em amostras iranianas; varia com solo/estação/cozimento) | Fronteira | 1 | `nao-mostrar` como dose; beterraba/folhas como registro |
| 74 | Creatina | Creatina 3–5 g/dia com treino de força aumenta massa magra e força em adultos; sem treino, efeito mínimo. | forte (segurança, força) / contestada (massa magra em idosos: Chilibeck 2017 +1,37 kg vs Yao 2026 ns). **Verificado nesta triagem:** Desai 2024 (12 estudos, <50 anos): massa magra +1,14 kg [0,69–1,59] com treino; Pashayee-Khamene 2024 (143 RCTs): massa livre de gordura +0,82 kg; Liu 2025 (idosos, 8 RCTs): massa magra SMD 0,27, força de membros inferiores SMD 0,29, membros superiores ns; Sharifian 2025 (20 estudos, idosos): 1RM +2,1 kg; Gu 2026 (homens 18–30): +2,7 kg só com treino de força | Fronteira | 3 (+0,8–1,1 kg de massa magra e força SMD ~0,3 não são perceptíveis nem medíveis em A–C; bioimpedância não resolve 1 kg); 2 (Yao 2026 ns em idosos, qualidade baixa); 4 (metas em jovens treinados ou idosos; poucos dados em 30–60 anos sedentários) | `registro` — binário diário com dose, só quando há treino de força; sem seta |
| 75 | Creatina | Creatina melhora memória e velocidade de processamento em adultos. | **Verificado nesta triagem:** Xu 2024 (16 RCTs, n=492): memória SMD 0,31 [0,18–0,44], certeza moderada; atenção e velocidade com IC quase tocando zero; sem efeito em cognição global/executiva; comentário crítico publicado (Citherlet 2026) | Fronteira | 1 (n total 492, comentário contestando); 3 (SMD 0,31 em teste de memória não é perceptível) | `curiosidade` |
| 76 | CoQ10 | CoQ10 suplementar 100–300 mg/dia reduz glicose de jejum (−5 mg/dL), HbA1c (−0,12–0,17 %) e HOMA-IR (−0,7). | moderada (Liang 2022, 40 RCTs; Musazadeh 2026 umbrella; Collares 2026: "certeza muito baixa") | Fronteira | 3 (efeito pequeno); 1 (certeza muito baixa na meta mais recente) | `registro` — suplemento com dose |
| 77 | CoQ10/ferro | Carne vermelha e ovos fornecem CoQ10 e ferro "para lubrificar a cadeia respiratória". | forte de que CoQ10 dietético (3–6 mg/dia) é irrelevante (Pravst 2010 vs Liang 2022); ferro heme em excesso: RR 1,33 de DM2 (Bao 2012, 11 coortes; Zhao 2012; Talaei 2017) | Fronteira (claim **refutado**) | 2 (a direção do ferro é contrária para o público-alvo) | `nao-mostrar` — reescrever como "proteína + B12; ferro só com ferritina" |
| 78 | Ferro | Deficiência de ferro sem anemia causa fadiga e prejudica desempenho; reposição em deficientes reduz fadiga. | moderada (Vaucher 2012, RCT; Raja 2026 revisão) | Fronteira | 4 (mulheres que menstruam com ferritina <50; público-alvo costuma ter ferritina alta); só com exame | `registro` — ferritina se houver exame; flag de perfil |
| 79 | Ferro | Ferro heme alto/ferritina alta aumentam risco de DM2 (RR 1,3–1,6). | moderada (Bao 2012; Zhao 2012; Talaei 2017; Fernández-Real 2002 — observacional) | Fronteira | 3 (não medível no prazo; sem RCT de dose de carne) | `registro` — ferritina no exame; texto "2–3×/sem cobre" como referência, não meta |
| 80 | L-carnitina | ~2 g/dia reduz peso (−1,2 kg) e gordura em meta-análise. | moderada (Talenezhad 2020, 37 RCTs); nada mitocondrial em humanos | Fronteira | 3 (−1,2 kg em meses) | `registro` — se já usa; não sugerir |
| 81 | NAD+ | NR/NMN sobem NAD+ mas não mudam respiração mitocondrial nem sensibilidade à insulina em obesos (NR); NMN melhorou captação muscular em pós-menopausa pré-diabéticas. | contestada (Remie 2020; Dollerup 2020; Yoshino 2021) | Fronteira | 2 | `registro` — "a aposta mais cara e menos confirmada" |
| 82 | Urolitina A | Ativa mitofagia e melhora marcadores; desfechos funcionais primários não atingidos. | fraca-moderada (Andreux 2019; Liu 2022; Singh 2022; Dao 2026: certeza baixa) | Fronteira | 1 (desfecho primário não atingido) | `registro` |
| 83 | Magnésio | Suplemento não reduz HOMA-IR significativamente em DM2/pré-DM (P=0,08). | contestada (Amiri 2026, 15 RCTs) | Fronteira | 2 | `registro` |
| 84 | Vitamina D | Suplementar reduz progressão pré-diabetes → diabetes (HR 0,85; −3,3 % absoluto em 3 anos); em deficientes graves corrige função mitocondrial muscular e fadiga. | moderada/contestada (Pittas 2019 D2d ns; Pittas 2023 IPD HR 0,85; Sinha 2013, n=12) | Fronteira | 3 (efeito modesto, desfecho a 3 anos); 1 (função mitocondrial: n=12) | `registro` — 25(OH)D no exame decide; "ajuda quem está com falta" |
| 85 | B12 | Metformina aumenta risco de deficiência de B12 (OR 1,13/ano de uso); dietas sem carne/ovo também. | forte na nota (Aroda 2016, DPPOS) — só uma fonte aberta | Fronteira | 1 (uma fonte; diretriz de sociedade não aberta nesta triagem) | `registro` — flag de perfil "usa metformina? vale B12 no exame" |
| 86 | Álcool | Zero minimiza dano; ≤100 g/semana é quase neutro em mortalidade; cada +100 g/sem custa (AVC +14 %); em dose baixa, sensibilidade à insulina não muda. | forte (Wood 2018, 599 mil; GBD 2018) / contestada (Schrieks 2015 vs GBD; curva em J frágil, Knott 2015) | **Núcleo** (faixas de registro) | 1–4 ✓ como **faixas** (desfecho mortalidade, não medível — por isso não é seta; a seta do álcool é o sono, item 39) | `registro` — doses em faixas (0 / ≤7 doses/sem / acima), não binário; decisão de produto Q12 |
| 87 | Álcool | "Uma taça faz bem" (curva em J, −18 % de DM2 no nadir). | contestada (só mulheres; some com referência "nunca bebeu"; GBD contrário) | Fronteira | 2 | `nao-mostrar` |
| 88 | Álcool | ~12 doses após treino cortam síntese proteica miofibrilar em 24–37 %. | moderada (Parr 2014, crossover n=8) | Fronteira | 1 (n=8, único) | `curiosidade` — "bebedeira na noite do treino apaga parte do que o treino construiu" |
| 89 | Álcool | Acetaldeído despolariza mitocôndrias hepáticas; crônico → esteatose. | moderada (mecanismo em animais/humanos; Hepatology Comm 2024 visto em busca) | Fronteira | 1 (mecanismo; fonte não aberta) | `curiosidade` |
| 90 | Ultraprocessados | Com macros pareados, dieta ultraprocessada faz comer +508 kcal/dia e ganhar 0,9 kg em 2 sem; coortes: DM2 e mortalidade CV (classe I). | forte (Hall 2019, RCT n=20 internados; Lane 2024 umbrella, 45 análises) | **Núcleo** | 1–4 ✓ (RCT mecanístico + umbrella de coortes; medível: peso semanal/cintura; perceptível: fome) | `seta` (nº de itens ultraprocessados na semana → peso/cintura/fome) |
| 91 | Ultraprocessados | Leigo consegue classificar NOVA com a regra "ingrediente que não existe na sua cozinha"; especialistas concordam pouco (κ≈0,32). | moderada (usabilidade: Menegassi 2019; Canella 2025) / contestada (Braesco 2022) | Fronteira | 2 (consistência entre avaliadores contestada) | `registro` — app classifica com incerteza declarada; padrão da semana, não item |
| 92 | Adoçantes | Refrigerante zero "não quebra o jejum": sem pico agudo de glicose/insulina; mas sacarina e sucralose por 2 sem pioraram a tolerância à glicose em parte das pessoas; aspartame e estévia não. | forte (agudo: Zhang 2023, 36 ensaios) / moderada-contestada (Suez 2022, RCT único n=120). **Verificado nesta triagem:** Lu 2026 (6 coortes, 721 mil): HR 1,31 de DM2 com maior consumo — confundimento provável; nenhuma meta-análise de RCT crônico apareceu | Fronteira | 1 (efeito crônico: RCT único); 2 (coortes e agudos em direções opostas) | `registro` — **qual adoçante** (rótulo); cruzamento pessoal se a pessoa mede glicose; sem seta |
| 93 | Excesso calórico | A mesma sobra calórica tem destinos diferentes: saturada → fígado/víscera; poli-insaturada → mais massa magra; 3 dias de excesso de gordura reduzem genes mitocondriais. | moderada (Sparks 2005; Rosqvist 2014; Anderson 2009; contraponto Seyssel 2014) | Fronteira | 2 (Seyssel na direção contrária); 3 (biópsia/RM) | `curiosidade` |
| 94 | Hidratação | Hidratar mais aumenta densidade mitocondrial. | fraca (só in vitro: Ikaga 2015; Sci Rep 2019; hepatócito de rato) | Fronteira | 1 (in vitro/animal) | `nao-mostrar` como seta; texto "água não fabrica mitocôndria" pode ir em `curiosidade` |
| 95 | Hidratação | Beber muito pouco por anos eleva copeptina e se associa a hiperglicemia; +1,5 L/dia por 6 sem reduziu glicose de jejum em quem bebia pouco. | contestada (D.E.S.I.R. sim; Malmö 2024 não; Enhörning 2019 n=31 sem controle paralelo) | Fronteira | 2 (coorte maior e mais recente contrária) | `registro` — ≥14 dias/mês de urina escura × glicemia do exame seguinte, apresentado como padrão a acompanhar, sem seta |
| 96 | Hidratação | Um dia de desidratação leve (~2 %) não altera glicose/insulina em pessoa saudável. | moderada (Carroll 2019, RCT crossover n=16, saudáveis) | Fronteira | 1 (RCT único); 4 (saudáveis) | `curiosidade` — "o que os estudos olham é o hábito" |
| 97 | Hidratação | Perda ≥2 % da massa corporal reduz rendimento aeróbico, sobretudo no calor; sprints e força quase não mudam até ~4 %. | forte (Sawka 2015; Deshayes 2020 meta; ACSM 2007); dado de sprints **parcialmente verificado** | Fronteira | 3 para o output do app (HIIT são sprints, pouco afetados até ~4 %; o cruzamento "urina escura × travei no tiro" não é sustentado); 4 (atletas) | `registro` — cor da urina e peso pré/pós treino; cruzamento só com LISS longo/calor, apresentado como observação |
| 98 | Hidratação | 1–2 % de desidratação piora humor, concentração e dor de cabeça; cognição "dura" muda pouco. | moderada (Armstrong 2012, n=25 mulheres jovens, não aberto; Rosinger 2024, 60+) | Fronteira | 1 (dois estudos pequenos, um não aberto); 4 (populações distantes) | `registro` — cor da urina × brain fog, sem seta |
| 99 | Hidratação | "Fome" às vezes é sede; 500 mL antes da refeição reduz ingestão ~13 % em adultos mais velhos. | fraca-moderada (Dennis 2010; Chang 2016 não aberto; mecanismo é distensão gástrica) | Fronteira | 1 (indireto; OR não verificado) | `registro` — "teste do copo d'água e 15 min", registrado como experimento pessoal |
| 100 | Hidratação | Café até ~4 mg/kg/dia (~300–400 mg) em quem já toma hidrata igual à água; diurese some com tolerância e no exercício. | forte (Killer 2014, n=50; Zhang 2015, 16 estudos) | **Núcleo** (referência) | 1–4 ✓ como informação (sem seta) | `registro` — café conta como líquido |
| 101 | Hidratação | Beber além da sede em exercício longo/lento causa hiponatremia; a regra segura é beber pela sede. | forte (consenso EAH 2015/2017; Hew-Butler 2017) | **Núcleo** (aviso de segurança) | 1–4 ✓ como aviso | `registro` — aviso ao registrar >3 L em poucas horas |
| 102 | Hidratação | Referências: EFSA 2,0/2,5 L (M/H) e IOM 2,7/3,7 L de água total; alvo funcional urina <500 mOsm/kg. | moderada (ingestões adequadas, não RCT; EFSA e Perrier não abertos) | Fronteira | 1 (AIs populacionais; fontes não abertas) | `registro` — "cerca de 2–2,5 L contando comida; sua urina diz" |
| 103 | Hidratação | Cor da urina (escala 1–8), frequência, sede e peso pré/pós treino (1 kg ≈ 1 L) são sinais válidos sem equipamento. | moderada (Armstrong 1994; ACSM 2007 — vistos em busca) | Fronteira (instrumento) | 1 (fontes não abertas) | `registro` — campos de nível 1; sem cruzamento afirmado |
| 104 | Hidratação | No jejum, água/café/chá são ferramenta de adesão; água reduz fome por 30–60 min; eletrólitos só em treino >2 h, calor ou jejum >24 h. | fraca (extrapolação; Ramadã; fontes parcialmente verificadas) / moderada (eletrólitos: Sawka & Montain 2000) | Fronteira | 1 | `registro` — líquido até 11h × fome no jejum, sem seta |
| 105 | Outputs | CGM em quem não tem diabetes: faixas normais existem; benefício não demonstrado; risco de obsessão. | moderada (faixas: Shah 2019) / contestada (utilidade: Oganesova 2024) | Fronteira | 2 (revisão 2024 contrária à utilidade) | `registro` — não recomendar; se já usa, só pico e tempo de volta por poucas semanas |
| 106 | Frio | Aclimatação ao frio **com tremor** (~1 h/dia, 10 dias) melhora tolerância à glicose (AUC −6 %), TG (−32 %) e PA em sobrepeso/obesidade; 14–15 °C por 10 dias: +43 % sensibilidade à insulina em DM2. | moderada (Sellers 2024, n=15; Hanssen 2015, n=8 — **mesmo grupo de Maastricht**) | Fronteira | 1 (dois estudos pequenos do mesmo grupo, sem replicação independente; "saiu estudo recente") | `curiosidade` — "só mexeu na glicose quando a pessoa tremeu, por bem mais que um minuto" |
| 107 | Frio | Frio ameno sem tremor (16–17 °C, até 6 h/dia) não melhora sensibilidade à insulina. | moderada (Remie 2021) | Fronteira | 1 (estudo único; complementa o 106) | `curiosidade` (junto do 106) |
| 108 | Frio | 30–60 s de água fria no banho ativam gordura marrom / têm efeito metabólico. | não-verificada (nenhum estudo <5 min; Huo 2022; Tabei 2024); Buijze 2016: faltas ao trabalho −29 %, 30/60/90 s iguais, sem desfecho metabólico | Fronteira | 1 (sem estudo na dose) | `registro` — hábito, com texto "sem promessa de efeito metabólico"; o dado de faltas é `curiosidade` |
| 109 | Frio | 4 semanas de frio diário (10 °C, 2 h/dia) aumentam BAT 45 % e capacidade oxidativa 2,2×. | moderada (Blondin 2017, n=6) | Fronteira | 1 (n=6) | `curiosidade` |
| 110 | Frio | Nadadores de inverno têm mais termogênese induzida por frio e BAT inativo em conforto. | fraca (Søberg 2021, n=8, transversal, jovens) | Fronteira | 1; 4 | `nao-mostrar` |
| 111 | Frio | Imersão fria logo após treino de força atenua hipertrofia (SMD −0,22). | moderada (Piñero 2024, 8 RCTs; IC −0,47 a 0,04 cruza zero) | Fronteira | 3 (efeito pequeno; IC cruza zero); 4 (treinados) | `curiosidade` — "se quiser frio, longe do treino de força" |
| 112 | Frio | Frio após HIIT/aeróbio não altera PGC-1α, VO2máx nem desempenho. | moderada (Malta 2026; Yu 2026 network) | Fronteira | 3 (efeito nulo; não é seta) | `curiosidade` |
| 113 | Frio | Imersão fria sobe inflamação na hora, reduz estresse ~12 h depois, melhora sono e qualidade de vida; humor e imunidade não mudam. | moderada (Cain 2025, 11 estudos, n=3.177, quase só homens) | Fronteira | 4 (quase só homens; protocolos heterogêneos); 3 (magnitude não traduzível) | `curiosidade` |
| 114 | Calor | Sauna 4–7×/sem associa-se a menos morte súbita (HR 0,37) e mortalidade em homens finlandeses. | moderada (Laukkanen 2015, coorte única) | Fronteira | 1 (coorte única); 4 (homens finlandeses) | `curiosidade` |
| 115 | Calor | Banheira 39–40 °C 1 h por 8–10 sessões reduz glicose e insulina de jejum em sedentários com sobrepeso e DM2. | moderada na nota (Hoekstra 2018, n=10; Portsmouth 2023, n=14 — não abertos). **Verificado nesta triagem:** Sebők 2021 (meta em DM2): HbA1c e glicose de jejum **ns**; Pizzey 2021 (meta): PA −4/−4 mmHg | Fronteira | 2 (meta-análise 2021 sem efeito glicêmico); 3 (PA −4 mmHg é pequeno) | `registro` — hábito com aviso de hidratação; sem seta |
| 116 | Calor | Calor local repetido aumenta PGC-1α no músculo; calor único de 4 h não muda nada — contração parece necessária. | fraca/contestada (Hafen 2018 não aberto; PMC9779680) | Fronteira | 1; 2 | `nao-mostrar` |
| 117 | Calor | Sauna causa hipotensão, síncope; metade das mortes em sauna na Finlândia envolve álcool. | moderada (Hussain 2018, revisão sistemática) | **Núcleo** (aviso de segurança) | 1–4 ✓ como aviso condicional | `registro` — aviso ao registrar sauna: "sem álcool; tontura = parar e beber água" |
| 118 | Luz | Luz forte de manhã reduz gordura corporal (−0,35 kg) e apetite; luz de 4.000 lux por 5 h **aumentou** glicose em DM2. | fraca (Danilenko 2013, n=34) / fraca-contestada (Versteeg 2017) | Fronteira | 1; 2 (sinal contrário em DM2) | `registro` — minutos ao ar livre pela manhã como âncora do horário de acordar; sem seta metabólica |
| 119 | Ar | Cada +10 µg/m³ de PM2.5 associa-se a ~10 % mais DM2; exposição curta eleva HOMA-IR. | moderada (revisão 2025 citando Brook 2013, Peng 2022, coortes) | Fronteira | 3 (não medível no prazo; magnitude individual pequena) | `registro` — "dia de ar ruim/fumaça" como input negativo |
| 120 | Ar | Fumaça de lenha em casa associa-se a HbA1c e síndrome metabólica. | fraca (transversais) | Fronteira | 1 | `registro` |
| 121 | Tabaco | Fumo passivo +22 % de DM2; fumante +37 %; quem parou há <5 anos +54 % (ganho de peso), zera em ~10 anos. | forte (Pan 2015, 88 coortes; Hu 2018) | **Núcleo** (flag de perfil) | 1–4 ✓ como flag (desfecho não medível no prazo; direção inequívoca) | `registro` — perfil: fuma / parou há quanto tempo / convive com fumante; texto sobre linha do tempo |
| 122 | Tabaco | Vape causa disfunção mitocondrial em células e animais. | fraca (mecanística) | Fronteira | 1 | `registro` — como tóxico, sem número |
| 123 | Medicamentos | Metformina atenua ganho de VO2máx, sensibilidade à insulina e respiração mitocondrial após 12 sem de treino em idosos. | moderada (Konopka 2019, RCT n=53 idosos; Bruss 2025 animal) | Fronteira | 1 (RCT único em humanos); 4 (idosos) | `registro` — "usa metformina?" para cruzar com resistência no HIIT; "assunto do médico" |
| 124 | Medicamentos | Sinvastatina 40 mg blunta VO2pico (+1,5 vs +10 %) e citrato sintase em síndrome metabólica. | moderada (Mikus 2013, RCT n=37) | Fronteira | 1 (RCT único) | `registro` |
| 125 | Medicamentos | Ibuprofeno 1200 mg/dia corta hipertrofia em jovens e **aumenta** em idosos. | contestada (Lilja 2018; Trappe 2011 — vistos em busca) | Fronteira | 2 (direção depende de idade); fontes não abertas | `registro` — AINE diário em dose máxima |
| 126 | Medicamentos | Fluoroquinolonas e doxiciclina têm toxicidade mitocondrial direta. | fraca (in vitro/animal; clínico = tendinopatia) | Fronteira | 1 | `registro` — curso de antibiótico para explicar semana ruim |
| 127 | Ambiente | Mesa em pé/lembretes reduzem tempo sentado, sem desfecho metabólico. | fraca | Fronteira | 1 | `nao-mostrar` como claim; "pausas" já cobertas pelo item 9 |
| 128 | Ambiente | Hipóxia intermitente como estímulo para obesidade. | fraca (revisões narrativas) | Fronteira | 1 | `nao-mostrar`; a face ruim (apneia) vira pergunta de rastreio no sono (`registro`) |
| 129 | Outputs | Rockport (1,6 km) estima VO2max com r 0,82–0,93. | forte (Kline 1987; Weiglein 2011) | **Núcleo** (instrumento) | 1–4 ✓ | `registro` — a cada 4–6 sem, faixa B |
| 130 | Outputs | Relógio de consumo mede bem FC de repouso (erro ~1–6 %) e mal HRV absoluta (10–30 %). | moderada (O'Grady 2024; Dial 2025, 536 noites) | **Núcleo** (regra de instrumento) | 1–4 ✓ (dois estudos independentes de validação, mesma direção; é o que fundamenta a ADR-005) | `registro` — FC repouso do relógio vale; HRV só tendência própria |
| 131 | Outputs | HRV (rMSSD) sobe com treino em sedentários (SMD 0,57); FC de recuperação: dados insuficientes. | moderada (Casanova-Lizón 2022) / fraca (HRR) / contestada (normas absolutas: Nunan 2010) | Fronteira | 3 (faixa D); 2 (normas contestadas) | `registro` — tendência de 7 dias apenas |
| 132 | Outputs | VO2max do relógio erra ~16 % e comprime extremos. | moderada (Caserman 2024, um aparelho) | Fronteira | 1 (estudo único, um aparelho) | `registro` — só tendência; nunca comparar com tabela |
| 133 | Outputs | Mitocôndria muda em semanas: citrato sintase em 2 sem (6 sessões), volume +55 % em 6 sem; volume de treino → conteúdo, intensidade → função. | forte (MacInnis 2017; Meinild Lundby 2018; Granata 2018) | **Núcleo** (contexto) | 1–4 ✓ como fato (biópsia; não medível pelo app — por isso não é seta) | `curiosidade` (contexto): "as primeiras mudanças acontecem no músculo em 2–6 sem, antes de qualquer exame" |
| 134 | Outputs | Cortes brasileiros: HOMA-IR >2,7; TG/HDL >2,6 (H) / 1,7 (M); cintura >88 (H) / 84 (M). | forte (Geloneze 2009, BRAMS) / moderada (Lelis 2021 ELSA; Barbosa 2006) | **Núcleo** (referência de exame) | 1–4 ✓ como cortes de referência (faixa C) | `registro` — mostrar o corte ao lado do exame |
| 135 | Outputs | Cintura/estatura <0,5 é triagem melhor que IMC (AUC 0,70 vs 0,67). | forte (Browning 2010, 78 estudos) | **Núcleo** (referência) | 1–4 ✓ | `registro` — faixa B |
| 136 | Outputs | Pressão: ótima <120/80; em casa HAS ≥130/80; treino aeróbio reduz −3,5/−2,5 mmHg. | forte (DBHA 2020; Cornelissen & Smart 2013) | **Núcleo** (referência) | 1–4 ✓ como cortes; o efeito do treino (−3,5 mmHg) é pequeno demais para seta | `registro` — média de 3 medidas semanais |
| 137 | Outputs | Glicemia de jejum e HbA1c: cortes SBD; HbA1c só muda em 8–12 sem (meia-vida 35 dias). | forte (SBD 2024 via secundária; CDC; Tahara & Shima 1995) | **Núcleo** (referência) | 1–4 ✓ | `registro` — bloquear repetição de HbA1c antes de 12 sem |
| 138 | Outputs | Balança engana: glicogênio carrega 3–4 g de água por grama; usar média semanal e cintura. | forte (Kreitzman 1992) | **Núcleo** (referência) | 1–4 ✓ | `registro` — peso só como média semanal |
| 139 | Outputs | Bioimpedância doméstica serve para tendência (erro de mudança 2–3 %), não para valor absoluto. | moderada (Siedler 2023, 15 aparelhos, um estudo) | Fronteira | 1 (estudo único) | `registro` — só tendência, mesmo aparelho e hora |
| 140 | Outputs | Conjunto que define excesso de treino: fadiga + queda de performance + humor por semanas, excluindo infecção, déficit energético, ferro e magnésio; ratings de bem-estar detectam carga antes. | forte (consenso Meeusen 2013) / moderada (curva J de infecções: Nieman 1994) | Fronteira | 4 (consenso em atletas; público faz 3 sessões curtas/sem) | `registro` — os sinais já são registrados (itens 7, 45); sem rótulo de "overtraining" |

---

## 1. Contagem

**Total de linhas:** 140.

| Nível | Linhas |
|---|---|
| **Núcleo** | 39 (15 com `seta`, 23 com `registro` — faixas, instrumentos, flags, avisos —, 1 com `curiosidade` como contexto) |
| **Fronteira** | 101 |

| Ação (primeira ação da célula) | Linhas |
|---|---|
| `seta` | 15 (todas Núcleo; as linhas 1+3 e 7+8 se fundem em uma seta cada no mapa → **13 setas**) |
| `registro` | 77 (23 Núcleo + 54 Fronteira) |
| `curiosidade` | 34 (1 Núcleo-contexto + 33 Fronteira) |
| `nao-mostrar` | 14 (todas Fronteira) |

Leitura: **só 13 setas** sobrevivem. Tudo o que a síntese chamava de "entra (evidência ≥ moderada)" e não está nas 13 setas ou nas faixas de referência abaixo caiu para Fronteira — na maior parte por efeito pequeno demais (critério 3) ou por meta-análise contrária (critério 2).

---

## 2. Núcleo — o que vai para o mapa (23 itens)

### Setas (13) — geram cruzamento

**Exercício**
1. Tiros curtos "all-out" 3×/sem → sensibilidade à insulina ↑, VO2/Rockport ↑ (itens 1, 3)
2. Treino de força 2–3×/sem → HbA1c/glicose de jejum ↓, força ↑ (itens 14, 15)
3. Treino regular (qualquer aeróbio) → FC de repouso ↓, cintura ↓ mesmo com peso igual (itens 7, 8)
4. Quebrar o sentar a cada 20–30 min → glicose/insulina pós-refeição ↓ (item 9)
5. Caminhar 10–30 min logo depois de comer → pico glicêmico ↓, maior no jantar (item 12)

**Sono e ritmo**
6. Sono <6 h → sensibilidade à insulina ↓ no dia seguinte (item 28)
7. Sono curto → fome ↑ / "comi sem fome"; dormir mais → come menos (item 29) — *cruzamento principal da fome emocional*
8. Cafeína tarde (dose × horário) → sono ↓ / "como acordei" pior (item 38)
9. Álcool à noite → sono/REM/FC noturna pior (item 39)
10. Última refeição perto de dormir → tolerância à glicose ↓, fome de manhã (item 35)

**Alimentação**
11. Jejum 14–16 h (duração real) → peso/gordura/cintura/HOMA-IR ↓ modestos em 8–12 sem (item 47)
12. Bebida açucarada / suco → cintura, glicemia ↑ (item 63)
13. Ultraprocessado → +~500 kcal/dia, peso/cintura ↑ (item 90)

### Faixas de referência (7) — aparecem como faixa com fonte, sem cruzamento
14. Sono: 7–8 h (item 30)
15. Atividade moderada: 150–300 min/sem, retorno satura em 300–600 (item 5)
16. Passos/dia: inflexão em 5–7 mil (item 11)
17. Proteína: 1,2–1,6 g/kg/dia (item 56)
18. Fibra: 25–29 g/dia (item 61)
19. Álcool em faixas: 0 / ≤7 doses/sem / acima (item 86)
20. Café conta como líquido até ~300–400 mg (item 100)

### Instrumentos e cortes (1 bloco) — item 21
Sessão-RPE (23) · Rockport (129) · FC de repouso do relógio vale, HRV só tendência própria (130) · cintura/estatura <0,5 (135) · cortes BR de HOMA-IR, TG/HDL, cintura (134) · PA (136) · glicemia/HbA1c com bloqueio de 12 sem (137) · peso = média semanal (138) · escalas curtas validadas SQS/PHQ-2/VAS/Hooper/Epworth (45) · contexto "mitocôndria muda em 2–6 sem" (133).

### Flags de perfil (1 bloco) — item 22
Tabaco / fumo passivo / tempo desde que parou (121) · gordura trans no rótulo (65) · "maior bloco sentado sem pausa" (10).

### Avisos de segurança (1 bloco) — item 23
Sintomas no HIIT (dor no peito, tontura, falta de ar desproporcional) → parar e avaliar (25) · beber pela sede, sem "bater meta" no treino (101) · sauna sem álcool; tontura = parar (117).

**23 itens.** Cabe em uma tela. As 13 setas são o mapa; o resto é moldura.

---

## 3. Rebaixamentos notáveis

Itens que a síntese ou o protocolo original tratavam como consolidados e que caíram para Fronteira:

| Item | Estava como | Caiu por | Motivo |
|---|---|---|---|
| **LISS → "expande mitocôndrias para queimar gordura"** (4) | protocolo: consolidado; síntese: moderada | critério 2 e 3 | Storoschuk/Gibala 2025 refuta "zona 2 ótima"; oxidação de gordura não é medível em A–C. Sobrevive só como volume (faixa 150–300 min). |
| **"HIIT protege a mitocôndria durante sono ruim"** (19) | síntese: laço 3 reescrito com isso | critério 1 e 4 | Saner 2020/2021 é um RCT em 24 homens jovens, sem replicação independente; Knowles 2024 aponta o contrário parcial. Não pode virar seta "numa semana ruim, o HIIT segura a linha". |
| **Proteína distribuída em 3–4 refeições** (57) | síntese: forte | critério 1 e 2 | Mamerow 2014 é n=8; Jespersen 2021 (revisão sistemática) diz evidência insuficiente; Schoenfeld 2013 (meta) diz que timing não importa, total importa. Fica a faixa total (1,2–1,6 g/kg); cai a distribuição. |
| **Janela cedo (eTRE) é melhor** (49) | síntese/alimentação: "janela cedo tem evidência melhor" | critério 1 | Sutton n=8; Dote-Montero 2025 e Huang 2023 não veem diferença de peso entre janelas. Curiosidade honesta, não seta. |
| **Cacau ≥70 % → HOMA-IR e pressão** (67) | síntese: moderada, "sobrevive" | critério 3 | Arisi 2024 (31 RCTs): glicose −4,9 mg/dL, PAS −2,5 mmHg, HbA1c ns. Real e pequeno demais. |
| **Chá verde** (69) | síntese: moderada | critério 2 | Asbaghi 2021 (14 RCTs) e Ghoflchi 2025: sem efeito; Xu 2020: −1,4 mg/dL. |
| **Creatina "só com força"** (74) | síntese: moderada; ADR-007 já previa o rebaixamento | critério 3, 2, 4 | Ver veredito abaixo. |
| **Calor passivo (banheira/sauna) → glicose de jejum** (115) | síntese: moderada | critério 2 | Sebők 2021 (meta em DM2): HbA1c e glicose ns. Sobra PA −4 mmHg (pequeno) e mortalidade em coorte única. |
| **Nitrato → performance** (71) | síntese: forte (perf.) | critério 3 | SMD 0,2–0,37 não é perceptível em "tiros até travar", que por sua vez não é medida validada. |
| **Frio com tremor** (106) | ambiente: moderada, "efeito real em insulina" | critério 1 | Hanssen 2015 (n=8) e Sellers 2024 (n=15) são do mesmo grupo de Maastricht. "Saiu estudo recente". |
| **Azeite EV / PREDIMED** (66) | síntese: forte | critério 1 e 3 | RCT único (subgrupo), desfecho a 4 anos. Continua "alimento-chave" registrável. |
| **Hidratação ≥2 % × "travei no tiro"** (97) | hidratação: cruzamento (d) proposto | critério 3 | O efeito forte é em endurance no calor; sprints pouco mudam até ~4 %. O cruzamento com o HIIT do app não é sustentado. |
| **Regularidade do horário de sono** (34) | síntese: forte, "prediz melhor que duração" | dúvida → Fronteira | Duas coortes, desfecho mortalidade. O app calcula e mostra a variação semanal; não afirma efeito. |
| **Ômega-3 → triglicerídeos** (verificação, item 7 da síntese) | "cruzar com TG" | sinal de segurança | Seria Núcleo (TG −50 mg/dL com >2 g/dia, medível em C), mas Gencer 2021 (HR 1,25; >1 g/dia HR 1,49), Jia 2021 e Abuknesha 2026 (35 RCTs: OR 1,43 em alto risco com >1,5 g/dia) mostram fibrilação atrial na dose de efeito. Fica `registro` com aviso; sem seta. |
| **Antioxidantes em megadose anulam o treino** (41) | síntese: moderada | critério 3 e 4 | 2 RCTs consistentes, mas em jovens e sem desfecho perceptível. Registro + texto de curiosidade. |
| **Sono fragmentado** (32) | sono: moderada | dúvida → Fronteira | n=11 e n=9, jovens. Despertares são registrados; sem seta. |
| **Quebra do sentar → biogênese** | exercício: "efeito crônico não demonstrado" | — | Mantida como seta **só para glicose pós-refeição**; qualquer texto sobre mitocôndria fica fora. |

---

## 4. Promoções possíveis (o que faltaria)

| Item | Falta para virar Núcleo |
|---|---|
| **Sono fragmentado → sensibilidade à insulina** (32) | Um RCT com n ≥ 30 em adultos com sobrepeso/RI, medindo despertares (que o app já registra). Direção e mecanismo já são consistentes. |
| **Regularidade do horário de sono** (34) | Um ensaio de intervenção (regularizar horário sem mudar duração) com desfecho perceptível (fome, energia) ou glicêmico; ou terceira coorte independente com desfecho metabólico em <1 ano. |
| **HIIT protege durante sono curto** (19) | Replicação por grupo independente, em sedentários, por mais de 5 noites. |
| **Janela cedo > janela tardia** (49) | RCT head-to-head com peso pareado e HOMA-IR/glicose como desfecho primário em sobrepeso (Dote-Montero deu o sinal em glicose de jejum; falta confirmar). |
| **Frio com tremor** (106) | Replicação por grupo fora de Maastricht, n ≥ 30, com dose praticável (a de 1 h/dia tremendo dificilmente cabe na rotina). |
| **Creatina + força** (74) | Meta-análise em adultos de 30–60 anos sedentários com desfecho que o app meça (1RM ou repetições em protocolo fixo). O sinal de força já é consistente; falta população e medida. |
| **Escada 1–3 min após comer** (13) | Replicação em sobrepeso/RI (Moore 2024 é n=31 jovens). Provavelmente vira anexo do item 12. |
| **"Tiros até travar"** (22) | Validação na PoC contra Rockport/FC de recuperação com protocolo fixo; ou estudo de RSA em sedentários. É o indicador central do app e hoje não passa. |
| **Calor passivo → glicemia** (115) | RCT com HOMA-IR em sobrepeso, n ≥ 30 (Sebők 2021 ns em DM2). |
| **Hidratação crônica × glicemia** (95) | Terceira coorte que resolva D.E.S.I.R. vs Malmö, ou RCT controlado de suplementação de água com HOMA-IR. |
| **B12 + metformina** (85) | Abrir a diretriz (ADA) que recomenda monitorar B12 — provavelmente promove sem estudo novo. |
| **Cafeína/adoçantes: qual adoçante** (92) | RCT crônico com sucralose/sacarina em sobrepeso replicando Suez 2022 (n=120, único). |
| **Antioxidantes megadose** (41) | Um RCT em adultos com RI com HOMA-IR; hoje 2 RCTs em jovens. |
| **FC de recuperação como marcador de adaptação** (24) | Dados em sedentários (Casanova-Lizón 2022 diz insuficientes). O corte prognóstico ≤12 já é sólido, mas é clínico. |

---

## Veredito sobre creatina (item 74–75)

**Fronteira, `registro`.** O que as meta-análises de 2024–2026 dizem (abertas nesta sessão via Europe PMC):
- **Massa magra com treino de força:** Desai 2024 (12 estudos, <50 anos): +1,14 kg [0,69–1,59]; Pashayee-Khamene 2024 (143 RCTs): +0,82 kg; Liu 2025 (idosos, 8 RCTs, n=482): SMD 0,27; Gu 2026 (homens 18–30): +2,7 kg só com treino, nada sem; Yao 2026 (idosos, já na nota): ns, qualidade baixa. **Consistente na direção, ~1 kg em 8–12 sem, não medível em A–C.**
- **Força:** SMD ~0,3 (Liu 2025; Kazeminasab 2025; Zhang 2025) — real, pequeno.
- **Cognição:** Xu 2024 (16 RCTs, n=492): memória SMD 0,31 (certeza moderada), com comentário crítico publicado em 2026.
- **Não houve reviravolta**: creatina não "deixou de funcionar". O que mudou é que o efeito ficou bem medido — e é pequeno demais para o critério 3 da ADR. Falha também o critério 4 (metas em jovens treinados ou idosos; pouco em 30–60 anos sedentários). O app registra (binário + dose, só com força) e não desenha seta.

---

## Verificações externas desta triagem

Cota de WebSearch da sessão esgotada; tudo abaixo foi aberto pela API pública do Europe PMC (`ebi.ac.uk/europepmc/webservices/rest/search`, `resultType=core`), que devolve título, autores, DOI, PMID e resumo. Nenhuma fonte além destas foi acrescentada.

1. **Creatina** — Desai I, J Strength Cond Res 2024, DOI 10.1519/JSC.0000000000004862 · Pashayee-Khamene F, JISSN 2024, DOI 10.1080/15502783.2024.2380058 · Liu S, Eur Rev Aging Phys Act 2025, DOI 10.1186/s11556-025-00392-9 · Sharifian G, Eur Rev Aging Phys Act 2025, DOI 10.1186/s11556-025-00384-9 · Gu J, Front Nutr 2026, DOI 10.3389/fnut.2026.1800546 · Xu C, Front Nutr 2024, DOI 10.3389/fnut.2024.1424972 (cognição) · Citherlet T, Front Nutr 2026, DOI 10.3389/fnut.2026.1716285 (comentário) · Kazeminasab F, Nutrients 2025, DOI 10.3390/nu17172748 · Zhang H, PeerJ 2025, DOI 10.7717/peerj.20380.
2. **Adoçantes** — Lu S, Front Nutr 2026, DOI 10.3389/fnut.2026.1886458 (6 coortes, HR 1,31). A busca não retornou meta-análise de RCT crônico; Zhang 2023 e Suez 2022 continuam sendo a base.
3. **Ômega-3 × fibrilação atrial** — Gencer B, Circulation 2021, DOI 10.1161/circulationaha.121.055654 (7 RCTs, 81 mil: HR 1,25; >1 g/dia HR 1,49) · Jia X, Cardiovasc Drugs Ther 2021, DOI 10.1007/s10557-021-07204-z (RR 1,24; >1 g/dia RR 1,51) · Abuknesha NR, Circ Arrhythm Electrophysiol 2026, DOI 10.1161/circep.125.014785 (35 RCTs, 114 mil: alto risco + >1,5 g/dia OR 1,43).
4. **Jejum × massa magra** — Khalafi M, Diabetes Obes Metab 2024, DOI 10.1111/dom.15730 · Khalafi M, Obes Rev 2025, DOI 10.1111/obr.13855 (FFM −0,81 kg) · He M, Diabetes Metab Syndr 2024, DOI 10.1016/j.dsx.2024.102952 (eTRE FFM −0,56, p=0,06) · Sun Y, IJBNPA 2025, DOI 10.1186/s12966-025-01812-w (TRE FFM −0,58) · Ho Y, Nutrients 2024, DOI 10.3390/nu16183066 (TRF + força: massa muscular sem mudança) · Hays HM, Int J Obes 2025, DOI 10.1038/s41366-024-01704-2 · Dai Z, Adv Nutr 2024, DOI 10.1016/j.advnut.2024.100262.
5. **Cacau** — Arisi TOP, Nutrients 2024, DOI 10.3390/nu16121919 (31 RCTs, n=1.986: glicose −4,91 mg/dL; PAS −2,52; PAD −1,58; HbA1c ns).
6. **Chá verde** — Asbaghi O, Diabetes Metab Syndr 2021, DOI 10.1016/j.dsx.2020.11.004 (14 RCTs: sem efeito em glicose, insulina, HbA1c, HOMA-IR) · Xu R, Nutr Metab 2020, DOI 10.1186/s12986-020-00469-5 (27 RCTs: glicose −1,44 mg/dL; HbA1c ns) · Zamani M, Front Nutr 2022, DOI 10.3389/fnut.2022.1084455 (55 RCTs: glicose −1,67; HbA1c −0,15 %) · Ghoflchi S, Clin Ther 2025, DOI 10.1016/j.clinthera.2025.09.011 (síndrome metabólica: sem efeito geral).
7. **Calor passivo** — Pizzey FK, Exp Physiol 2021, DOI 10.1113/ep089424 (PAS −3,9; PAD −3,9 mmHg) · Sebők J, Int J Hyperthermia 2021, DOI 10.1080/02656736.2021.2003445 (DM2: HbA1c −0,55 %, p=0,13; glicose ns).
8. **Distribuição de proteína** — Jespersen SE, Eur J Nutr 2021, DOI 10.1007/s00394-021-02487-2 (revisão sistemática, 15 estudos: evidência insuficiente para força e turnover) · Schoenfeld BJ, JISSN 2013, DOI 10.1186/1550-2783-10-53 (meta: timing sem efeito após controle de covariáveis; total é o preditor).

## Sugestões para o brain
- Adicionar `nivel: nucleo | fronteira` e `acao:` a cada nota de claim, copiando desta tabela (a coluna "#" serve de índice).
- [[../mapa-input-processo-output]]: desenhar só as 13 setas; faixas de referência como moldura; Fronteira em seção própria.
- [[../indicadores/resistencia-no-hiit]]: marcar `nivel: fronteira` até validação na PoC — hoje é o indicador central e não passa no critério 1.
- [[../protocolos/sono]]: retirar "HIIT segura a linha" do texto de usuário; manter Saner como curiosidade.
- [[../insumos/omega-3]]: acrescentar aviso de fibrilação atrial em dose >1 g/dia (Gencer 2021; Abuknesha 2026) antes de qualquer cruzamento com TG.
- [[../insumos/creatina]] (a criar): `nivel: fronteira`, `acao: registro`, com as metas de 2024–2026 acima.
- Nova pergunta aberta: **o app precisa de um output de força medível (1RM ou repetições em protocolo fixo)?** Sem isso, força (seta 2) só se mede por HbA1c a cada 12 sem, e creatina nunca sobe de nível.
