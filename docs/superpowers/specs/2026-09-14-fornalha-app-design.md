# Fornalha Metabólica — design da app (v1)

Data: 2026-09-14
Status: aprovado em conversa, seção a seção
Base de conhecimento: `docs/brain/` (ADR-001 a ADR-008, `acoes/acoes.json`)

## 1. O que é

Um **diário local** (PWA, sem conta, sem servidor) que registra hábitos ligados à densidade mitocondrial — movimento, sono, alimentação, hidratação, medidas — e devolve, para cada uma das 22 ações atômicas do catálogo, **onde a pessoa está em relação à sua meta pessoal** e **qual é o próximo passo**. Uma tendência na v1: sono × fome × café.

Não prescreve (ADR-001). Não compara com tabelas quando o dado é do próprio corpo (ADR-005). Só afirma o que passou na triagem Núcleo (ADR-007). Pede pouco e convida a registrar mais mostrando o que passaria a conseguir dizer (ADR-002).

### Decisões já tomadas

| Decisão | Escolha |
|---|---|
| Plataforma | Web PWA; wrapper nativo (Capacitor) na v2 |
| Stack | React + TypeScript + Vite; Dexie (IndexedDB); Vitest + Testing Library |
| Escopo v1 | Perfil + check-in diário + eventos (treino/refeição) + revisão semanal/mensal + exames + 22 ações com meta e próximo passo + 1 tendência |
| Dados de saúde | Manuais na v1; Health Connect (Android) na v2 |
| Arquitetura | "C": tabelas tipadas por cadência + camada de ações guiada pelo catálogo `acoes.json` + telas geradas de um registro de campos |
| Motor de hábito | "Nunca dois dias seguidos" (contador de dias parado), não streaks |
| Notificações | Nenhuma na v1; o gatilho é abrir de manhã |

### Fora da v1 (registrado, não esquecido)

- Conta, sync, múltiplos aparelhos.
- Visão do profissional (Q6). O export JSON é o gancho.
- Outras tendências além de sono × fome × café.
- Ordem dos nutrientes (fibra → proteína → carboidrato) como ação (Q26): só depois de verificar. Na v1 é um campo opcional no evento refeição (`comecouPelaFibra`) para já haver dado.
- "Tiros até travar" como afirmação (Q24): na v1 é só registro pessoal, sem interpretação.
- Notificações locais, Health Connect, Capacitor (v2).

## 2. Estrutura do projeto

```
app/                          Vite + React + TS, PWA
  public/
  src/
    dominio/                  TypeScript puro. Não importa React, Dexie ou DOM.
      catalogo/
        acoes.json            cópia de docs/brain/acoes/acoes.json (script de sync + teste de hash)
        tipos.ts              tipos do catálogo
      campos.ts               registro de campos (id, cadência, nível, tipo, unidade, condicao)
      tipos.ts                Perfil, Dia, EventoTreino, EventoRefeicao, Semana, Mes, Exame
      derivados.ts            imc, whtr, fcMax, rmr, tdee, aguaMeta, diasParado, jejumHoras, sonoHoras, medias
      metas/
        tipos.ts              Contexto, Meta, Zona, AcaoMeta
        index.ts              registro id → módulo
        seisMilPassos.ts …    um arquivo por ação
      medidas/                imc, cinturaEstatura, panturrilha, preensao, fcRepouso, fcMax, gastoRepouso, agua, peso
      tendencias/
        sonoFomeCafe.ts
      seguranca.ts            flags do perfil que trocam o próximo passo por "converse com quem te acompanha"
    dados/
      db.ts                   Dexie: schema version(1)
      repositorios/           perfil, dia, eventos, semana, mes, exame
      exportImport.ts         JSON versionado
      contexto.ts             monta Contexto (28 dias) a partir dos repositórios
    ui/
      telas/                  Perfil, Hoje, Acoes, Segunda, Tendencias, Ajustes
      componentes/            CampoRegistro (renderiza pelo registro de campos), CardAcao, BarraZona, Medida…
      hooks/                  useContexto, useDia, usePerfil (dexie-react-hooks)
    app/                      rotas, shell, service worker
  scripts/sync-catalogo.mjs   copia acoes.json do brain e grava o hash
docs/brain/                   a verdade sobre *por quê*
docs/superpowers/specs/       este documento
```

**Regra de dependência:** `dominio/` não importa nada de `dados/`, `ui/` ou `app/`. Todo comportamento que o usuário lê (zona, texto, próximo passo, tendência) vive em `dominio/` e é testado sem browser.

**Catálogo:** `acoes.json` é a fonte de títulos, descrições, faixas em texto, evidência e fontes. O TypeScript implementa só a regra numérica de cada ação. Um teste de contrato garante `ids(acoes.json) == ids(metas/index.ts)`.

## 3. Modelo de dados

Uma tabela por cadência. Chaves naturais onde existem.

### `perfil` (chave fixa `'me'`)

| Campo | Tipo | Nota |
|---|---|---|
| peso, altura, idade | number | kg, cm, anos |
| sexo | `'H' \| 'M'` | só para fórmulas (RMR, cortes de cintura/panturrilha/preensão) |
| levantar, deitar | `"HH:MM"` | horário habitual; base das metas de café/jantar |
| cafe | `'nao' \| 'as-vezes' \| 'diario'` | condiciona o check-in e a ação `ultimo-cafe` |
| alcool | `'nao' \| 'as-vezes' \| 'regular'` | condiciona o check-in e a ação `se-beber` |
| remedios | string[] de flags (`'glicemia'`, `'pressao'`, `'tireoide'`, `'outro'`) | usado por `seguranca.ts` |
| fuma | `'nao' \| 'sim' \| 'parou'` + `parouEm?` | idem |
| examesQueTem | string[] | só para decidir o que pedir |
| atualizadoEm | ISO | |

### `dia` (chave `YYYY-MM-DD`)

Nível no registro de campos define em que tela aparece.

| Campo | Tipo | Nível | Condição |
|---|---|---|---|
| deitou, levantou | `"HH:MM"` | 1 | |
| comoAcordei | 1–5 | 1 | |
| fome | 1–10 (VAS, dia anterior) | 1 | |
| comiSemFome | boolean | 1 | |
| ultimoCafe | `undefined \| null \| "HH:MM"` | 1 | `perfil.cafe !== 'nao'`; com `'as-vezes'` pergunta sim/não antes da hora |
| jantarFim | `"HH:MM"` | 1 | |
| passos | number | 1 | |
| moveu | boolean | 1 | derivável de eventos; a pergunta só aparece se não houve evento |
| primeiraRefeicao | `"HH:MM"` | 2 | |
| maiorBloco | min sentado sem levantar | 2 | |
| minPosJantar | min | 2 | |
| copos | number | 2 | |
| proteinaG, fibraG | number | 2 | soma dos eventos refeição se existirem; senão manual |
| refeicoesCozinhadas | number | 2 | |
| bebidaDoce | number | 2 | |
| alcoolDoses | number | 2 | `perfil.alcool !== 'nao'` |
| peso | number | 2 | opcional; só a média semanal é mostrada |
| fcRepouso | number | 2 | opcional; só a média de 7 dias é mostrada |
| notas | string | 3 | |
| fonte | `Record<campo, 'manual' \| 'health'>` | — | preparado para a v2 |
| atualizadoEm | ISO | — | |

**Três estados por campo:** `undefined` = não registrou; `null` = "não se aplica hoje" (não tomei café, não bebi); valor = registrou. A tela e o motor tratam os três de forma diferente.

### `eventoTreino` (id uuid)

data, hora, tipo (`'tiros' | 'forca' | 'moderado'`), minutos, tiros?, tiroTravou?, rpe?, fc1min?, calor?, jejum?

### `eventoRefeicao` (id uuid)

data, hora, proteinaG?, fibraG?, cozinhada?, comecouPelaFibra? (dado para Q26; sem interpretação na v1)

### `semana` (chave semana ISO `YYYY-Www`)

cintura, sessoesTiros, sessoesForca, minAtiv, maiorBlocoTipico, alcoolDoses, docesSemana — **pré-preenchida** dos eventos e dos dias; a pessoa confirma ou corrige.

### `mes` (chave `YYYY-MM`)

panturrilha, preensao? *ou* repsAteFalhar? (uma das duas)

### `exame` (chave data)

glicemia, hba1c, homaIr, tg, hdl, ferritina, b12, vitD, paSistolica, paDiastolica — todos opcionais.

### Derivados (nunca gravados)

imc, whtr, fcMax (208 − 0,7·idade), fc60/70/85, rmr (Mifflin-St Jeor), pal, tdee, aguaMeta, coposMeta, cortes de panturrilha/preensão/cintura, **diasParado** (dias consecutivos sem `moveu` nem evento), pesoMedioSemana, fcRepousoMedia7d, jejumHoras (jantarFim → primeiraRefeicao), sonoHoras, variacaoHorarioDeitar. Fórmulas iguais às da PoC (`acoes-atomicas.html`, função `D()`), portadas para `derivados.ts` com testes.

## 4. Registro de campos (`campos.ts`)

Cada campo do `dia`, `semana`, `mes` e `exame` é declarado uma vez:

```ts
interface Campo {
  id: CampoId;
  tabela: 'dia' | 'semana' | 'mes' | 'exame';
  nivel: 1 | 2 | 3;
  tipo: 'hora' | 'inteiro' | 'decimal' | 'escala' | 'bool' | 'texto' | 'hora-ou-nao';
  rotulo: string;              // como o usuário lê
  unidade?: string;
  min?: number; max?: number;
  condicao?: (perfil: Perfil) => boolean;   // ex.: café só se perfil.cafe !== 'nao'
  desbloqueia: AcaoId[];       // quais ações passam a ter meta com este campo
}
```

As telas de registro são geradas deste registro. `desbloqueia` alimenta o convite "registre X e eu te digo Y" (ADR-002). `condicao` resolve café/álcool sem `if` espalhado pela UI.

## 5. Telas

1. **Perfil** — onboarding na primeira abertura; editável depois. Mostra as Medidas ao vivo (IMC, cintura/estatura, FC máx e faixas 60/70/85, gasto de repouso, meta de água) enquanto a pessoa digita.
2. **Hoje** — tela inicial.
   - **Check-in da manhã** (nível 1): deitei/levantei, como acordei, fome de ontem, comi sem fome?, último café de ontem (condicional), jantar de ontem terminou às, passos de ontem, moveu? (se sem evento). 7 a 9 campos (café condicional ao perfil; `moveu` só sem evento). Botão "quero registrar mais" abre nível 2 com a frase do que desbloqueia.
   - **Eventos:** botões *Treinei*, *Comi*, *Levantei* (este incrementa uma contagem do dia usada por `levante-a-cada-30`).
   - **Dias sem movimento:** contador `diasParado` com a ação mínima que zera.
   - **Três ações em foco:** as 3 com zona `atencao`/`pouco` mais perto da meta (menor distância relativa), com próximo passo. Ações `sem-dado` aparecem em cinza com o convite.
3. **Ações** — catálogo completo agrupado (Movimento, Sono e ritmo, Alimentação, Corpo e medida). Cada card: título, gatilho, ação mínima, barra de zona, meta pessoal, próximo passo, "afeta", evidência com fontes. `meca-a-cintura` e `panturrilha-preensao` aparecem como Medidas, não como cards. `ultimo-cafe` e `se-beber` somem com perfil `nao`.
4. **Segunda** — revisão semanal, pré-preenchida. Primeira segunda do mês acrescenta panturrilha/preensão. A cada 12 semanas desde o último exame, lembra exames (link para a tela de exames).
5. **Tendências** — só sono × fome × café. Antes de estar pronta: "faltam N check-ins" e o que vai dizer.
6. **Ajustes** — exportar/importar JSON, apagar tudo (com confirmação), Fronteira (curiosidades do brain marcadas `fronteira`), sobre/evidência.

Sem push. Sem gamificação além do contador de dias parado.

## 6. Motor de metas

```ts
type Zona = 'pouco' | 'atencao' | 'meta' | 'demais' | 'sem-dado';

interface Contexto {
  perfil: Perfil;
  hoje: Dia | undefined;
  dias: Dia[];               // últimos 28, mais recente primeiro
  eventos: EventoTreino[];   // mesma janela
  refeicoes: EventoRefeicao[];
  semana: Semana | undefined;
  mes: Mes | undefined;
  derivados: Derivados;
  agora: Date;
}

interface Meta {
  zona: Zona;
  valor: number | null;                       // onde a pessoa está
  faixa: { pouco: number; meta: number; demais: number } | null;  // personalizada
  posicao: number | null;                     // 0–1 para a barra
  texto: string;
  proximoPasso: string;
  precisaDe?: CampoId[];                      // quando sem-dado
  seguranca?: string;                         // substitui proximoPasso quando aplicável
}

interface AcaoMeta {
  id: AcaoId;
  aplica(perfil: Perfil): boolean;            // ex.: ultimo-cafe → perfil.cafe !== 'nao'
  meta(ctx: Contexto): Meta;
}
```

Regras:

- **`sem-dado` é zona, não erro.** Nunca chuta valor. `precisaDe` lista os campos que desbloqueiam.
- **Próximo passo é incremental e limitado:** passos +500/semana; horário de deitar/café/jantar ±15 min; proteína/fibra +10 g/+5 g; sessões +1. Nunca salta para a meta.
- **Segurança (`seguranca.ts`):** ações marcadas no catálogo (`tres-tiros`, `feche-a-cozinha`/jejum, `emagreca-devagar`) consultam `perfil.remedios`/`fuma`; se aplicável, `Meta.seguranca` traz "converse com quem te acompanha antes de mudar isso" e a UI o mostra no lugar do próximo passo.
- **Janela:** metas semanais (`tres-tiros`, `levante-peso`, `some-150`, `nunca-dois-dias`) olham eventos + `semana`; diárias olham `hoje` ou o último dia com o campo, dizendo de que dia é.
- **Café esporádico:** `ultimo-cafe` com `perfil.cafe === 'as-vezes'` avalia só os dias em que `ultimoCafe` não é `null`; texto "nos dias em que tomar, antes das HH:MM".

Fonte das regras numéricas: `CALC` da PoC (`acoes-atomicas.html`), portado ação por ação com testes pouco/atencao/meta/demais/sem-dado.

## 7. Tendência sono × fome × café (`tendencias/sonoFomeCafe.ts`)

Entrada: `dias[]` (28), `perfil.cafe`.

Pré-requisito: ≥ 7 check-ins com sono e fome; baseline = mediana da fome nos dias com sono ≥ 7 h (≥ 5 dias). Senão retorna `{ pronta: false, faltam, precisaDe }`.

Saída `{ pronta: true, frases: Frase[] }`, cada frase com `texto`, `n` e `tipo`:

- **sono → fome:** fome nos dias após sono < 6 h vs baseline. n < 3 → "ainda poucas noites curtas para comparar".
- **sono → comer sem fome:** proporção de `comiSemFome` em noites curtas vs normais.
- **café → sono:**
  - `diario`: café após o corte pessoal (`deitar − 9 h`) vs antes → diferença de horas de sono.
  - `as-vezes`: dias com café vs sem → diferença de horas de sono (ambos n mostrados).
  - `nao`: frase omitida; o card explica que a tendência é sono × fome.

Sem teste estatístico. Sempre mostra n. Comparação é sempre com a própria pessoa (ADR-005).

## 8. Persistência, export, PWA

- **Dexie** `version(1)` com as 7 tabelas; índices: `dia.data`, `eventoTreino.data`, `eventoRefeicao.data`. Migrações futuras numeradas.
- **`contexto.ts`** monta `Contexto` com uma consulta por tabela (janela de 28 dias) — é a única ponte `dados/ → dominio/`.
- **Export/import:** `{ versao: 1, exportadoEm, perfil, dia[], eventoTreino[], eventoRefeicao[], semana[], mes[], exame[] }`. Import valida `versao` e faz merge por chave (o mais recente `atualizadoEm` vence).
- **PWA:** `vite-plugin-pwa`, `registerType: 'autoUpdate'`, shell em cache, offline completo. Manifest com nome, ícones, `display: standalone`.
- **Ganchos v2:** Capacitor embrulha `app/` sem tocar `dominio/`; Health Connect vira `dados/fontes/healthConnect.ts` que escreve `dia.passos` com `fonte.passos = 'health'`; notificações locais entram em `app/`.

## 9. Tratamento de erro

- Campo fora de faixa (`min`/`max` do registro): a tela avisa e não grava; o domínio nunca recebe valor inválido.
- Perfil incompleto: as metas que dependem do campo faltante retornam `sem-dado` com `precisaDe: ['perfil.altura']`; a tela Hoje leva ao Perfil.
- IndexedDB indisponível (modo privado): mensagem única na abertura, app continua em memória na sessão, export ainda funciona.
- Import inválido: mostra o motivo (versão, JSON malformado, tabela desconhecida) e não altera nada.
- Catálogo fora de sync com o brain: o teste de hash falha no CI; nunca em runtime.

## 10. Testes

- **`dominio/`** (Vitest, sem DOM): cada `AcaoMeta` com 5 casos (uma zona cada) + `aplica`; `derivados.ts` contra os números da PoC; `sonoFomeCafe` com fixtures de 7, 14 e 28 dias nos três perfis de café; `seguranca.ts`; contrato `acoes.json` ↔ `metas/index.ts`; `campos.ts` (todo `desbloqueia` aponta para id existente).
- **`dados/`**: `fake-indexeddb`; repositórios, `contexto.ts`, export → import round-trip, merge.
- **`ui/`**: um teste de fumaça por tela (renderiza com contexto fixo, sem crash; check-in grava `dia`). Sem E2E na v1.
- **CI** (GitHub Actions): `pnpm lint && pnpm test && pnpm build`.

## 11. Ordem de construção sugerida

1. Scaffold + lint + Vitest + CI vazio.
2. `dominio/tipos.ts`, `campos.ts`, `derivados.ts` com testes.
3. Catálogo sync + tipos + teste de contrato (com módulos-stub).
4. `metas/` ação por ação (Movimento → Sono → Alimentação → Corpo), `seguranca.ts`.
5. `tendencias/sonoFomeCafe.ts`.
6. `dados/` (Dexie, repositórios, contexto, export/import).
7. `ui/`: Perfil → Hoje → Ações → Segunda → Tendências → Ajustes.
8. PWA + manifest + ícones.
9. Sync do brain: marcar nas notas `vira-feature-em: v1` o que entrou.

## 12. Perguntas abertas que o design respeita

- Q24 — "tiros até travar": campo `tiroTravou` gravado, nunca interpretado.
- Q26 — ordem dos nutrientes: campo `comecouPelaFibra` gravado, nunca interpretado.
- Q19 — frase da fome: `fome` (VAS 1–10) + `comiSemFome` (bool) com rótulo "comi sem estar com fome?"; a redação pode mudar sem mudar o dado.
- Q6 — profissional: export JSON é o único gancho.
