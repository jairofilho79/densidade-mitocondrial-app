import { r1 } from '../derivados';
import type { Contexto, Zona } from '../metas/tipos';

export type MedidaId = 'imc' | 'whtr' | 'panturrilha' | 'preensao' | 'fc_repouso' | 'fc_max' | 'rmr' | 'agua' | 'peso';

export interface MedidaResultado {
  id: MedidaId;
  valor: number | null;
  unidade: string;
  zona: Zona | 'neutra';
  texto: string;
  zonas: Array<{ tom: 'ok' | 'weak' | 'bad'; rotulo: string }>;
}

type Rotulo = MedidaResultado['zonas'][number];
const z = (tom: Rotulo['tom'], rotulo: string): Rotulo => ({ tom, rotulo });

function imc(ctx: Contexto): MedidaResultado {
  const zonas = [z('weak', '< 18,5 abaixo'), z('ok', '18,5–24,9'), z('weak', '25–29,9 sobrepeso'), z('bad', '≥ 30 obesidade')];
  const v = ctx.derivados.imc;
  if (v === null) return { id: 'imc', valor: null, unidade: '', zona: 'sem-dado', texto: 'preencha peso e altura no perfil', zonas };

  const categoria =
    v < 18.5 ? 'abaixo' : v < 25 ? 'normal' : v < 30 ? 'sobrepeso' : v < 35 ? 'obesidade I' : v < 40 ? 'obesidade II' : 'obesidade III';
  const zona: Zona = v < 25 ? 'meta' : v < 30 ? 'atencao' : 'pouco';
  const texto =
    `Categoria: ${categoria}. ` +
    (v >= 30
      ? 'Ponto de partida dos tiros: 70% do esforço já mantém o ganho enzimático (Boyd 2013). Não é falha, é dose de entrada.'
      : 'Tiros no máximo são o padrão dos estudos.');
  return { id: 'imc', valor: v, unidade: '', zona, texto, zonas };
}

function whtr(ctx: Contexto): MedidaResultado {
  const zonas = [z('ok', '< 0,50'), z('weak', '0,50–0,59'), z('bad', '≥ 0,60')];
  const c = ctx.semana?.cintura;
  const h = ctx.perfil.altura;
  if (c === undefined || !h) {
    return { id: 'whtr', valor: null, unidade: '', zona: 'sem-dado', texto: 'registre a cintura na revisão de segunda', zonas };
  }
  const corte = ctx.derivados.corteCintura;
  const r = r1((c / h) * 100) / 100;
  const zona: Zona = r < 0.5 ? 'meta' : c < corte ? 'atencao' : 'pouco';
  const metaCm = Math.round(h / 2);
  const texto =
    `Meta: abaixo de ${metaCm} cm (0,5 × ${h}). Hoje ${c} cm` +
    (c >= corte ? ` — acima do corte de risco (${corte} cm)` : '') +
    `. Faltam ${Math.max(0, c - metaCm)} cm.`;
  return { id: 'whtr', valor: r, unidade: '', zona, texto, zonas };
}

function panturrilha(ctx: Contexto): MedidaResultado {
  const { pantCorte, pantGrave } = ctx.derivados;
  const zonas = [z('bad', `< ${pantGrave} grave`), z('weak', `${pantGrave}–${r1(pantCorte - 0.1)} baixa`), z('ok', `≥ ${pantCorte}`)];
  const p = ctx.mes?.panturrilha;
  if (p === undefined) {
    return { id: 'panturrilha', valor: null, unidade: 'cm', zona: 'sem-dado', texto: 'meça a panturrilha na primeira segunda do mês', zonas };
  }
  const zona: Zona = p >= pantCorte ? 'meta' : p >= pantGrave ? 'atencao' : 'pouco';
  const texto = `Corte: ${pantCorte} cm (baixa) / ${pantGrave} cm (grave). Meta: estável ou subindo enquanto a cintura cai.`;
  return { id: 'panturrilha', valor: p, unidade: 'cm', zona, texto, zonas };
}

function preensao(ctx: Contexto): MedidaResultado {
  const corte = ctx.derivados.preensaoCorte;
  const zonas = [z('bad', `< ${corte} kg`), z('ok', `≥ ${corte} kg`)];
  const p = ctx.mes?.preensao;
  if (p === undefined) {
    return {
      id: 'preensao',
      valor: null,
      unidade: 'kg',
      zona: 'sem-dado',
      texto: 'Sem dinamômetro: anote repetições até falhar num exercício fixo (flexão ou agachamento) e compare semana a semana.',
      zonas,
    };
  }
  const zona: Zona = p >= corte ? 'meta' : 'pouco';
  return { id: 'preensao', valor: p, unidade: 'kg', zona, texto: `Corte: ${corte} kg. Meta: subir com o treino de força em 4–8 semanas.`, zonas };
}

function fcRepouso(ctx: Contexto): MedidaResultado {
  const zonas = [z('ok', '< 75 (treinado: < 60)'), z('weak', '75–85'), z('bad', '> 85 ou subindo')];
  const f = ctx.derivados.fcRepousoMedia7d;
  if (f === null) return { id: 'fc_repouso', valor: null, unidade: 'bpm', zona: 'sem-dado', texto: 'registre a FC ao acordar por 7 dias', zonas };
  const zona: Zona = f <= 75 ? 'meta' : f <= 85 ? 'atencao' : 'pouco';
  const texto =
    'Meta: cair 3–10 bpm em 4–8 semanas de treino regular. Subiu 5+ bpm na média de 7 dias? Excesso, infecção, álcool ou sono ruim.';
  return { id: 'fc_repouso', valor: f, unidade: 'bpm', zona, texto, zonas };
}

function fcMax(ctx: Contexto): MedidaResultado {
  const zonas = [z('ok', 'conversa 60–70%'), z('weak', 'moderado-forte 70–85%'), z('bad', 'máximo > 85%')];
  const { fcMax: v, fc60, fc70, fc85 } = ctx.derivados;
  if (v === null || fc60 === null || fc70 === null || fc85 === null) {
    return { id: 'fc_max', valor: null, unidade: 'bpm', zona: 'sem-dado', texto: 'preencha a idade no perfil', zonas };
  }
  const texto = `Ritmo de conversa ≈ ${fc60}–${fc70} bpm (60–70%). Tiros no máximo: acima de ~${fc85} (85%). Recuperação: cair pelo menos 12 bpm no 1º minuto após o último tiro.`;
  return { id: 'fc_max', valor: v, unidade: 'bpm', zona: 'neutra', texto, zonas };
}

function rmr(ctx: Contexto): MedidaResultado {
  const zonas = [z('ok', 'déficit 15–25%'), z('weak', '25–40%'), z('bad', '≥ 40–50% ou comer pouco e treinar muito')];
  const { rmr: v, pal, tdee, defLo, defHi } = ctx.derivados;
  if (v === null || pal === null || tdee === null || defLo === null || defHi === null) {
    return { id: 'rmr', valor: null, unidade: 'kcal/dia', zona: 'sem-dado', texto: 'preencha peso, altura e idade no perfil', zonas };
  }
  const texto = `Com seu nível de atividade (fator ${pal}): gasto total ≈ ${tdee} kcal/dia. Déficit moderado = ${defLo}–${defHi} kcal/dia → ~0,5 kg/semana, adaptação de 50–120 kcal/dia. Abaixo de ${Math.round(tdee * 0.5)} kcal/dia é severo.`;
  return { id: 'rmr', valor: v, unidade: 'kcal/dia', zona: 'neutra', texto, zonas };
}

function agua(ctx: Contexto): MedidaResultado {
  const zonas = [z('bad', 'urina escura, < 60% da referência'), z('ok', 'referência ± sede'), z('bad', '> 1 L/h além da sede em exercício longo')];
  const { coposMeta, aguaMetaL } = ctx.derivados;
  const homem = ctx.perfil.sexo === 'H';
  const base = homem ? 2.0 : 1.6;
  const n = ctx.hoje?.copos;
  const zona: Zona | 'neutra' = n === undefined ? 'neutra' : n < coposMeta * 0.6 ? 'pouco' : n < coposMeta ? 'atencao' : 'meta';
  const texto = `Base ${homem ? '2,0' : '1,6'} L de bebidas + ${r1(Math.max(0, aguaMetaL - base))} L pelo treino de hoje. Hoje: ${n === undefined ? '—' : n} copos. Urina cor 1–3 confirma; café conta.`;
  return { id: 'agua', valor: coposMeta, unidade: `copos (${aguaMetaL} L)`, zona, texto, zonas };
}

function peso(ctx: Contexto): MedidaResultado {
  const zonas = [z('ok', 'até 0,5%/sem'), z('weak', '0,5–1%/sem'), z('bad', '> 1%/sem sustentado')];
  const w = ctx.derivados.pesoMedioSemana;
  const w0 = ctx.derivados.pesoMedioSemanaAnterior;
  if (w === null) return { id: 'peso', valor: null, unidade: 'kg', zona: 'sem-dado', texto: 'registre o peso alguns dias na semana', zonas };
  if (w0 === null) {
    return { id: 'peso', valor: w, unidade: 'kg', zona: 'neutra', texto: 'Média da semana. Registre mais uma semana para ver a velocidade.', zonas };
  }
  // Limiares reais (0,5 % e 1 % do peso), sem arredondar — mesma regra de
  // emagreca-devagar: r1 antes da comparação classificaria 0,5 kg como
  // 'meta' a 90 kg (0,45 → 0,5), quando já passou do limiar de 0,5 %.
  const idealBruto = 0.005 * w;
  const maxBruto = 0.01 * w;
  const dl = r1(w0 - w); // perda (positivo = emagreceu); só para exibição/comparação com o rótulo
  const zona: Zona | 'neutra' = dl <= 0 ? 'neutra' : dl <= idealBruto ? 'meta' : dl <= maxBruto ? 'atencao' : 'pouco';
  const delta = dl === 0 ? 'peso estável' : `${dl > 0 ? '−' : '+'}${Math.abs(dl)} kg`;
  const texto = `Esta semana: ${delta}. Meta de velocidade: até ${r1(idealBruto)} kg/semana (0,5%); acima de ${r1(maxBruto)} é rápido demais.`;
  return { id: 'peso', valor: w, unidade: 'kg', zona, texto, zonas };
}

/** As 9 medidas, na ordem do catálogo (`acoes.json` → `medidas`). */
export function medidas(ctx: Contexto): MedidaResultado[] {
  return [imc(ctx), whtr(ctx), panturrilha(ctx), preensao(ctx), fcRepouso(ctx), fcMax(ctx), rmr(ctx), agua(ctx), peso(ctx)];
}
