---
tipo: moc
---
# 🧬 Brain — Fornalha Metabólica

Vault Obsidian (Markdown + `[[wikilinks]]`). Abra a pasta `docs/brain` no Obsidian.
Tudo o que aprendermos na [[poc/README|PoC conversacional]] entra aqui **antes** de virar sistema.

## Como usar
- Cada nota tem um `tipo` e um `status` no frontmatter (ver [[_templates/nota]]).
- Toda nota de `protocolo` ou `insumo` **deve** apontar um `mecanismo` (conceito biológico). Se não aponta, é suspeita.
- Todo conhecimento **deve** desaguar em `vira-feature-em` (um domínio do app). Se não desagua, é contexto ou ponto solto.
- Cada nota de claim tem `nivel: nucleo | fronteira | misto` e `acao: seta | faixa | registro | curiosidade | flag | instrumento` (ADR-007). **Só `nucleo`+`seta` entra no mapa.**
- Afirmações científicas carregam `evidencia`: `nao-verificada | fraca | moderada | forte`. Nada sai do status `rascunho` com `nao-verificada`.
- Pontos soltos vivem em [[perguntas-abertas]]. A regra: **nenhuma pergunta some sem resposta ou sem "descartada porque..."**.

## Mapa
### Camada 1 — Mecanismos (por quê)
[[conceitos/densidade-mitocondrial]] · [[conceitos/biogenese-mitocondrial]] · [[conceitos/ampk]] · [[conceitos/autofagia-mitofagia]] · [[conceitos/resistencia-a-insulina]] · [[conceitos/estresse-oxidativo]] · [[conceitos/tecido-adiposo-marrom]] · [[conceitos/hidratacao]]
Novos (2026-09-14): [[conceitos/destreino-inatividade]] ← o dano mais importante · [[conceitos/metabolismo-basal]] · [[conceitos/ritmo-circadiano]] · [[conceitos/eixo-do-estresse]] · [[conceitos/overreaching]] · [[conceitos/ferro-e-ferritina]] · [[conceitos/pico-de-glicose]] · [[conceitos/medicamentos-que-modulam-adaptacao]]

### Camada 2 — Alavancas (o que fazer)
Protocolos: [[protocolos/hiit]] · [[protocolos/liss-walking-workout]] · [[protocolos/jejum-intermitente]] · [[protocolos/exposicao-ao-frio]] · [[protocolos/sono]] · [[protocolos/evitar-ultraprocessados]]
Novos: [[protocolos/treino-de-forca]] · [[protocolos/deficit-calorico]] · [[protocolos/caminhada-pos-refeicao]] · [[protocolos/quebra-de-sedentarismo]] · [[protocolos/calor-sauna]]
Insumos: [[insumos/carne-vermelha-ovos]] · [[insumos/chocolate-80]] · [[insumos/omega-3]] · [[insumos/nitrato]]
Novos: [[insumos/proteina]] · [[insumos/fibra-e-carboidrato-integral]] · [[insumos/azeite-e-gorduras]] · [[insumos/cafeina]] · [[insumos/alcool]] · [[insumos/adocantes]] · [[insumos/bebidas-acucaradas]] · [[insumos/ar-e-fumaca]] · [[insumos/suplementos-registrar-nao-afirmar]] · [[insumos/creatina]]

### Camada 3 — Sinais (o que medir)
[[indicadores/faixas-de-custo]] ← comece aqui (resposta à Q2)
A (nada): [[indicadores/resistencia-no-hiit]] · [[indicadores/rpe-sessao]] · [[indicadores/brain-fog]] · [[indicadores/fome-emocional]] · [[indicadores/sonolencia-diurna]]
B (fita/relógio): [[indicadores/cintura-e-cintura-estatura]] · [[indicadores/massa-magra]] · [[indicadores/fc-de-repouso]] · [[indicadores/fc-de-recuperacao]] · [[indicadores/passos-por-dia]]
C (exame): [[indicadores/exames-de-sangue]] · Negativos: [[indicadores/sinais-de-excesso]]

### Camada 4 — Domínios do app (o que registrar)
[[dominios-do-app/registro-de-habitos]] · [[dominios-do-app/alimentacao]] · [[dominios-do-app/exercicio]] · [[dominios-do-app/sono]] · [[dominios-do-app/hidratacao]] · [[dominios-do-app/jejum]]

### Ações atômicas (o Núcleo acionável)
[[acoes/00-catalogo]] — 22 ações com gatilho, ação mínima, faixa pessoal, registro por níveis e sinal de progresso. Fonte única: `acoes/acoes.json`.

### Decisões
[[decisoes/ADR-001-diario-nao-prescritivo]] · [[decisoes/ADR-002-divulgacao-progressiva]] · [[decisoes/ADR-003-poc-conversacional]] · [[decisoes/ADR-004-causa-efeito-em-faixas]] · [[decisoes/ADR-005-baseline-proprio]] · [[decisoes/ADR-006-evidencia-obrigatoria-na-seta]] · [[decisoes/ADR-007-nucleo-e-fronteira]] · [[decisoes/ADR-008-acoes-atomicas]]

### PoC
[[poc/README]] — sessões em `poc/sessoes/`.

### Pesquisa (2026-09-14)
[[pesquisa/2026-09-14-sintese]] ← placar dos claims, o que entrou, laços revisados
[[pesquisa/2026-09-14-verificacao-claims]] · [[pesquisa/2026-09-14-hidratacao]] · [[pesquisa/2026-09-14-alimentacao-jejum]] · [[pesquisa/2026-09-14-exercicio]] · [[pesquisa/2026-09-14-sono-estresse-circadiano]] · [[pesquisa/2026-09-14-ambiente-termico-toxicos]] · [[pesquisa/2026-09-14-outputs-medicao]] · [[pesquisa/2026-09-14-danos-mitocondria]] · [[pesquisa/2026-09-14-metabolismo-basal-massa-magra]] · **[[pesquisa/2026-09-14-triagem-nucleo-fronteira]]** (Núcleo vs Fronteira) · formato: [[pesquisa/_formato]]

### Lentes de entendimento
[[mapa-input-processo-output]] — input → processo → output (não é estrutura do app)
