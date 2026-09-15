import { describe, expect, it } from 'vitest';
import { medidas, type MedidaId, type MedidaResultado } from './index';
import { HOJE, ctxBase, diaBase, mesBase, perfilBase, semanaBase, type CtxParcial } from '../metas/_fixtures';

function medida(id: MedidaId, parcial: CtxParcial = {}): MedidaResultado {
  const r = medidas(ctxBase(parcial)).find((m) => m.id === id);
  if (!r) throw new Error(`medida ${id} não veio`);
  return r;
}

describe('medidas(ctx)', () => {
  it('devolve sempre as 9, na ordem do catálogo', () => {
    expect(medidas(ctxBase()).map((m) => m.id)).toEqual([
      'imc',
      'whtr',
      'panturrilha',
      'preensao',
      'fc_repouso',
      'fc_max',
      'rmr',
      'agua',
      'peso',
    ]);
  });
});

describe('imc', () => {
  it('atencao: 29,4 sobrepeso', () => {
    const m = medida('imc', { derivados: { imc: 29.4 } });
    expect(m.valor).toBe(29.4);
    expect(m.unidade).toBe('');
    expect(m.zona).toBe('atencao');
    expect(m.texto).toBe('Categoria: sobrepeso. Tiros no máximo são o padrão dos estudos.');
    expect(m.zonas).toEqual([
      { tom: 'weak', rotulo: '< 18,5 abaixo' },
      { tom: 'ok', rotulo: '18,5–24,9' },
      { tom: 'weak', rotulo: '25–29,9 sobrepeso' },
      { tom: 'bad', rotulo: '≥ 30 obesidade' },
    ]);
  });

  it('pouco: 32 obesidade I com o ponto de partida dos tiros', () => {
    const m = medida('imc', { derivados: { imc: 32 } });
    expect(m.zona).toBe('pouco');
    expect(m.texto).toBe(
      'Categoria: obesidade I. Ponto de partida dos tiros: 70% do esforço já mantém o ganho enzimático (Boyd 2013). Não é falha, é dose de entrada.',
    );
  });

  it('meta: 23 normal; categorias extremas', () => {
    expect(medida('imc', { derivados: { imc: 23 } }).zona).toBe('meta');
    expect(medida('imc', { derivados: { imc: 17 } }).texto).toContain('Categoria: abaixo.');
    expect(medida('imc', { derivados: { imc: 37 } }).texto).toContain('Categoria: obesidade II.');
    expect(medida('imc', { derivados: { imc: 41 } }).texto).toContain('Categoria: obesidade III.');
  });

  it('sem-dado', () => {
    const m = medida('imc', { derivados: { imc: null } });
    expect(m.zona).toBe('sem-dado');
    expect(m.valor).toBeNull();
    expect(m.texto).toBe('preencha peso e altura no perfil');
  });
});

describe('whtr (altura 175 → meta abaixo de 88 cm; corte de risco H = 88)', () => {
  it('pouco: cintura 100', () => {
    const m = medida('whtr', { semana: semanaBase({ cintura: 100 }) });
    expect(m.valor).toBeCloseTo(0.571, 3);
    expect(m.zona).toBe('pouco');
    expect(m.texto).toBe('Meta: abaixo de 88 cm (0,5 × 175). Hoje 100 cm — acima do corte de risco (88 cm). Faltam 12 cm.');
    expect(m.zonas).toEqual([
      { tom: 'ok', rotulo: '< 0,50' },
      { tom: 'weak', rotulo: '0,50–0,59' },
      { tom: 'bad', rotulo: '≥ 0,60' },
    ]);
  });

  it('atencao: cintura 87,5 (0,50, abaixo do corte)', () => {
    const m = medida('whtr', { semana: semanaBase({ cintura: 87.5 }) });
    expect(m.valor).toBeCloseTo(0.5, 3);
    expect(m.zona).toBe('atencao');
  });

  it('meta: cintura 86', () => {
    const m = medida('whtr', { semana: semanaBase({ cintura: 86 }) });
    expect(m.valor).toBeCloseTo(0.491, 3);
    expect(m.zona).toBe('meta');
    expect(m.texto).toBe('Meta: abaixo de 88 cm (0,5 × 175). Hoje 86 cm. Faltam 0 cm.');
  });

  it('sem-dado: sem cintura', () => {
    const m = medida('whtr');
    expect(m.zona).toBe('sem-dado');
    expect(m.valor).toBeNull();
    expect(m.texto).toBe('registre a cintura na revisão de segunda');
  });
});

describe('panturrilha (H: corte 34 / grave 32)', () => {
  it('meta: 38 cm', () => {
    const m = medida('panturrilha', { mes: mesBase({ panturrilha: 38 }) });
    expect(m.valor).toBe(38);
    expect(m.unidade).toBe('cm');
    expect(m.zona).toBe('meta');
    expect(m.texto).toBe('Corte: 34 cm (baixa) / 32 cm (grave). Meta: estável ou subindo enquanto a cintura cai.');
    expect(m.zonas).toEqual([
      { tom: 'bad', rotulo: '< 32 grave' },
      { tom: 'weak', rotulo: '32–33,9 baixa' },
      { tom: 'ok', rotulo: '≥ 34' },
    ]);
  });

  it('atencao 33; pouco 31', () => {
    expect(medida('panturrilha', { mes: mesBase({ panturrilha: 33 }) }).zona).toBe('atencao');
    expect(medida('panturrilha', { mes: mesBase({ panturrilha: 31 }) }).zona).toBe('pouco');
  });

  it('mulher usa 33 / 31', () => {
    const m = medida('panturrilha', { perfil: { ...perfilBase, sexo: 'M' }, mes: mesBase({ panturrilha: 33.5 }) });
    expect(m.zona).toBe('meta');
    expect(m.texto).toContain('Corte: 33 cm (baixa) / 31 cm (grave)');
  });

  it('sem-dado', () => {
    const m = medida('panturrilha');
    expect(m.zona).toBe('sem-dado');
    expect(m.texto).toBe('meça a panturrilha na primeira segunda do mês');
  });
});

describe('preensao (H: corte 27 kg)', () => {
  it('meta: 30 kg', () => {
    const m = medida('preensao', { mes: mesBase({ preensao: 30 }) });
    expect(m.valor).toBe(30);
    expect(m.unidade).toBe('kg');
    expect(m.zona).toBe('meta');
    expect(m.texto).toBe('Corte: 27 kg. Meta: subir com o treino de força em 4–8 semanas.');
    expect(m.zonas).toEqual([
      { tom: 'bad', rotulo: '< 27 kg' },
      { tom: 'ok', rotulo: '≥ 27 kg' },
    ]);
  });

  it('pouco: 20 kg', () => {
    expect(medida('preensao', { mes: mesBase({ preensao: 20 }) }).zona).toBe('pouco');
  });

  it('sem-dado com a dica do exercício fixo', () => {
    const m = medida('preensao');
    expect(m.zona).toBe('sem-dado');
    expect(m.valor).toBeNull();
    expect(m.texto).toBe(
      'Sem dinamômetro: anote repetições até falhar num exercício fixo (flexão ou agachamento) e compare semana a semana.',
    );
    expect(m.zonas).toHaveLength(2);
  });
});

describe('fc_repouso', () => {
  it('meta: 58 e 72', () => {
    const m = medida('fc_repouso', { derivados: { fcRepousoMedia7d: 72 } });
    expect(m.valor).toBe(72);
    expect(m.unidade).toBe('bpm');
    expect(m.zona).toBe('meta');
    expect(m.texto).toBe(
      'Meta: cair 3–10 bpm em 4–8 semanas de treino regular. Subiu 5+ bpm na média de 7 dias? Excesso, infecção, álcool ou sono ruim.',
    );
    expect(medida('fc_repouso', { derivados: { fcRepousoMedia7d: 58 } }).zona).toBe('meta');
    expect(m.zonas).toEqual([
      { tom: 'ok', rotulo: '≤ 75 (treinado: < 60)' },
      { tom: 'weak', rotulo: '75–85' },
      { tom: 'bad', rotulo: '> 85 ou subindo' },
    ]);
  });

  it('atencao 80; pouco 90', () => {
    expect(medida('fc_repouso', { derivados: { fcRepousoMedia7d: 80 } }).zona).toBe('atencao');
    expect(medida('fc_repouso', { derivados: { fcRepousoMedia7d: 90 } }).zona).toBe('pouco');
  });

  it('sem-dado', () => {
    const m = medida('fc_repouso', { derivados: { fcRepousoMedia7d: null } });
    expect(m.zona).toBe('sem-dado');
    expect(m.texto).toBe('registre a FC ao acordar por 7 dias');
  });
});

describe('fc_max', () => {
  it('neutra com as zonas de esforço', () => {
    const m = medida('fc_max', { derivados: { fcMax: 180, fc60: 108, fc70: 126, fc85: 153 } });
    expect(m.valor).toBe(180);
    expect(m.unidade).toBe('bpm');
    expect(m.zona).toBe('neutra');
    expect(m.texto).toBe(
      'Ritmo de conversa ≈ 108–126 bpm (60–70%). Tiros no máximo: acima de ~153 (85%). Recuperação: cair pelo menos 12 bpm no 1º minuto após o último tiro.',
    );
    expect(m.zonas).toEqual([
      { tom: 'ok', rotulo: 'conversa 60–70%' },
      { tom: 'weak', rotulo: 'moderado-forte 70–85%' },
      { tom: 'bad', rotulo: 'máximo > 85%' },
    ]);
  });

  it('sem-dado sem idade', () => {
    const m = medida('fc_max', { derivados: { fcMax: null, fc60: null, fc70: null, fc85: null } });
    expect(m.zona).toBe('sem-dado');
    expect(m.texto).toBe('preencha a idade no perfil');
  });
});

describe('rmr', () => {
  it('neutra com déficit moderado', () => {
    const m = medida('rmr', { derivados: { rmr: 1799, pal: 1.4, tdee: 2519, defLo: 378, defHi: 630 } });
    expect(m.valor).toBe(1799);
    expect(m.unidade).toBe('kcal/dia');
    expect(m.zona).toBe('neutra');
    expect(m.texto).toBe(
      'Com seu nível de atividade (fator 1,4): gasto total ≈ 2519 kcal/dia. Déficit moderado = 378–630 kcal/dia → ~0,5 kg/semana, adaptação de 50–120 kcal/dia. Abaixo de 1260 kcal/dia é severo.',
    );
    expect(m.zonas).toEqual([
      { tom: 'ok', rotulo: 'déficit 15–25%' },
      { tom: 'weak', rotulo: '25–40%' },
      { tom: 'bad', rotulo: '≥ 40–50% ou comer pouco e treinar muito' },
    ]);
  });

  it('sem-dado', () => {
    const m = medida('rmr', { derivados: { rmr: null, pal: null, tdee: null, defLo: null, defHi: null } });
    expect(m.zona).toBe('sem-dado');
    expect(m.texto).toBe('preencha peso, altura e idade no perfil');
  });
});

describe('agua (referência fixada em 8 copos / 2 L)', () => {
  const ref = { coposMeta: 8, aguaMetaL: 2 };

  it('neutra sem copos hoje', () => {
    const m = medida('agua', { derivados: ref });
    expect(m.valor).toBe(8);
    expect(m.unidade).toBe('copos (2 L)');
    expect(m.zona).toBe('neutra');
    expect(m.texto).toBe('Base 2,0 L de bebidas + 0 L pelo treino de hoje. Hoje: — copos. Urina cor 1–3 confirma; café conta.');
    expect(m.zonas).toEqual([
      { tom: 'bad', rotulo: 'urina escura, < 60% da referência' },
      { tom: 'ok', rotulo: 'referência ± sede' },
      { tom: 'bad', rotulo: '> 1 L/h além da sede em exercício longo' },
    ]);
  });

  it('pouco 4, atencao 5, meta 9', () => {
    expect(medida('agua', { hoje: diaBase(HOJE, { copos: 4 }), derivados: ref }).zona).toBe('pouco');
    const m = medida('agua', { hoje: diaBase(HOJE, { copos: 5 }), derivados: ref });
    expect(m.zona).toBe('atencao');
    expect(m.texto).toContain('Hoje: 5 copos.');
    expect(medida('agua', { hoje: diaBase(HOJE, { copos: 9 }), derivados: ref }).zona).toBe('meta');
  });

  it('mulher: base 1,6 L; treino de hoje soma na referência', () => {
    const m = medida('agua', { perfil: { ...perfilBase, sexo: 'M' }, derivados: { coposMeta: 8, aguaMetaL: 2 } });
    expect(m.texto).toContain('Base 1,6 L de bebidas + 0,4 L pelo treino de hoje.');
  });

  it('sem copos hoje, mas ontem registrado: usa o valor de ontem e rotula "Ontem"', () => {
    const m = medida('agua', { dias: [diaBase('2026-09-16', { copos: 5 })], derivados: ref });
    expect(m.zona).toBe('atencao');
    expect(m.texto).toContain('Ontem: 5 copos.');
  });
});

describe('peso (média 90 → meta até 0,5 kg/sem, 1 % = 0,9)', () => {
  it('meta: −0,4 kg', () => {
    const m = medida('peso', { derivados: { pesoMedioSemana: 90, pesoMedioSemanaAnterior: 90.4 } });
    expect(m.valor).toBe(90);
    expect(m.unidade).toBe('kg');
    expect(m.zona).toBe('meta');
    expect(m.texto).toBe('Esta semana: −0,4 kg. Meta de velocidade: até 0,45 kg/semana (0,5%); acima de 0,9 é rápido demais.');
    expect(m.zonas).toEqual([
      { tom: 'ok', rotulo: 'até 0,5%/sem' },
      { tom: 'weak', rotulo: '0,5–1%/sem' },
      { tom: 'bad', rotulo: '> 1%/sem sustentado' },
    ]);
  });

  it('atencao −0,8; pouco −1,5; neutra estável ou ganhou', () => {
    expect(medida('peso', { derivados: { pesoMedioSemana: 90, pesoMedioSemanaAnterior: 90.8 } }).zona).toBe('atencao');
    expect(medida('peso', { derivados: { pesoMedioSemana: 90, pesoMedioSemanaAnterior: 91.5 } }).zona).toBe('pouco');
    const estavel = medida('peso', { derivados: { pesoMedioSemana: 90, pesoMedioSemanaAnterior: 90 } });
    expect(estavel.zona).toBe('neutra');
    expect(estavel.texto).toContain('Esta semana: peso estável.');
    const ganhou = medida('peso', { derivados: { pesoMedioSemana: 90, pesoMedioSemanaAnterior: 89.5 } });
    expect(ganhou.zona).toBe('neutra');
    expect(ganhou.texto).toContain('Esta semana: +0,5 kg.');
  });

  it('neutra sem semana anterior', () => {
    const m = medida('peso', { derivados: { pesoMedioSemana: 90, pesoMedioSemanaAnterior: null } });
    expect(m.zona).toBe('neutra');
    expect(m.valor).toBe(90);
    expect(m.texto).toBe('Média da semana. Registre mais uma semana para ver a velocidade.');
  });

  it('sem-dado sem peso', () => {
    const m = medida('peso', { derivados: { pesoMedioSemana: null, pesoMedioSemanaAnterior: null } });
    expect(m.zona).toBe('sem-dado');
    expect(m.valor).toBeNull();
    expect(m.texto).toBe('registre o peso alguns dias na semana');
  });
});
