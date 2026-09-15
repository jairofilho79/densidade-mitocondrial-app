import { describe, expect, it } from 'vitest';
import { derivar, horaParaMin, horasEntre, media, mediana, minParaHora, pos, r1, somarDias } from './derivados';
import type { Dia, EventoTreino, Perfil, Semana } from './tipos';

const HOJE = '2026-09-14';

/** HOJE menos `offset` dias, em YYYY-MM-DD. */
function d(offset: number): string {
  return new Date(Date.UTC(2026, 8, 14 - offset)).toISOString().slice(0, 10);
}

const perfilBase: Perfil = {
  peso: 90,
  altura: 175,
  idade: 45,
  sexo: 'H',
  levantar: '06:30',
  deitar: '23:30',
  cafe: 'diario',
  alcool: 'nao',
  remedios: [],
  fuma: 'nao',
  examesQueTem: [],
  atualizadoEm: '2026-09-14T08:00:00.000Z',
};
const perfilMulher: Perfil = { ...perfilBase, peso: 70, altura: 165, idade: 35, sexo: 'M' };

function dia(data: string, parcial: Partial<Dia> = {}): Dia {
  return { data, atualizadoEm: `${data}T08:00:00.000Z`, ...parcial };
}

let contador = 0;
function treino(data: string, minutos: number, tipo: EventoTreino['tipo'] = 'moderado'): EventoTreino {
  contador += 1;
  return { id: `ev-${contador}`, data, hora: '07:00', tipo, minutos, atualizadoEm: `${data}T08:00:00.000Z` };
}

function semana(parcial: Partial<Semana>): Semana {
  return { semana: '2026-W37', atualizadoEm: '2026-09-14T08:00:00.000Z', ...parcial };
}

const vazio = (perfil: Perfil = perfilBase) => derivar(perfil, [], [], undefined, HOJE);

describe('utilitários de hora', () => {
  it('horaParaMin', () => {
    expect(horaParaMin('23:30')).toBe(1410);
    expect(horaParaMin('00:00')).toBe(0);
    expect(horaParaMin('06:30')).toBe(390);
  });

  it('minParaHora normaliza módulo 1440', () => {
    expect(minParaHora(1410)).toBe('23:30');
    expect(minParaHora(0)).toBe('00:00');
    expect(minParaHora(1440)).toBe('00:00');
    expect(minParaHora(-30)).toBe('23:30');
    expect(minParaHora(1500)).toBe('01:00');
    expect(minParaHora(389.6)).toBe('06:30');
  });

  it('horasEntre atravessa a meia-noite', () => {
    expect(horasEntre('23:30', '06:30')).toBe(7);
    expect(horasEntre('06:30', '23:30')).toBe(17);
    expect(horasEntre('19:00', '09:00')).toBe(14);
    expect(horasEntre('12:00', '12:00')).toBe(0);
  });
});

describe('somarDias', () => {
  it('atravessa mês, ano e fevereiro bissexto', () => {
    expect(somarDias('2026-03-01', -1)).toBe('2026-02-28');
    expect(somarDias('2024-02-28', 1)).toBe('2024-02-29');
    expect(somarDias('2026-12-31', 1)).toBe('2027-01-01');
  });
});

describe('utilitários numéricos', () => {
  it('r1', () => {
    expect(r1(29.387)).toBe(29.4);
    expect(r1(6.67)).toBe(6.7);
    expect(r1(2)).toBe(2);
  });

  it('media', () => {
    expect(media([])).toBeNull();
    expect(media([70, 72, 74])).toBe(72);
    expect(media([1, 2])).toBe(1.5);
  });

  it('mediana', () => {
    expect(mediana([])).toBeNull();
    expect(mediana([3, 1, 2])).toBe(2);
    expect(mediana([4, 1, 3, 2])).toBe(2.5);
    expect(mediana([5])).toBe(5);
  });

  it('pos: lo → 0.5, hi → 0.75, limitado a [0.02, 0.98]', () => {
    expect(pos(5000, 5000, 7000)).toBe(0.5);
    expect(pos(7000, 5000, 7000)).toBe(0.75);
    expect(pos(6000, 5000, 7000)).toBe(0.625);
    expect(pos(0, 5000, 7000)).toBe(0.02);
    expect(pos(20000, 5000, 7000)).toBe(0.98);
    expect(pos(2, 2, 3)).toBe(0.5);
    expect(pos(5, 5, 5)).toBe(0.5);
  });
});

describe('derivar — perfil', () => {
  it('homem 90 kg, 175 cm, 45 anos', () => {
    const r = vazio();
    expect(r.imc).toBe(29.4);
    expect(r.fcMax).toBe(177);
    expect(r.fc60).toBe(106);
    expect(r.fc70).toBe(124);
    expect(r.fc85).toBe(150);
    expect(r.rmr).toBe(1774);
    expect(r.pal).toBe(1.4);
    expect(r.tdee).toBe(2484);
    expect(r.defLo).toBe(373);
    expect(r.defHi).toBe(621);
    expect(r.aguaMetaL).toBe(2);
    expect(r.coposMeta).toBe(8);
    expect(r.pantCorte).toBe(34);
    expect(r.pantGrave).toBe(32);
    expect(r.preensaoCorte).toBe(27);
    expect(r.corteCintura).toBe(88);
  });

  it('mulher 70 kg, 165 cm, 35 anos', () => {
    const r = vazio(perfilMulher);
    expect(r.imc).toBe(25.7);
    expect(r.fcMax).toBe(184);
    expect(r.rmr).toBe(1395);
    expect(r.aguaMetaL).toBe(1.6);
    expect(r.coposMeta).toBe(6);
    expect(r.pantCorte).toBe(33);
    expect(r.pantGrave).toBe(31);
    expect(r.preensaoCorte).toBe(16);
    expect(r.corteCintura).toBe(84);
  });

  it('sem altura: imc, rmr, pal, tdee e déficits são null; fcMax continua', () => {
    const r = vazio({ ...perfilBase, altura: 0 });
    expect(r.imc).toBeNull();
    expect(r.rmr).toBeNull();
    expect(r.pal).toBeNull();
    expect(r.tdee).toBeNull();
    expect(r.defLo).toBeNull();
    expect(r.defHi).toBeNull();
    expect(r.fcMax).toBe(177);
  });

  it('sem idade: fcMax e zonas são null; imc continua', () => {
    const r = vazio({ ...perfilBase, idade: 0 });
    expect(r.fcMax).toBeNull();
    expect(r.fc60).toBeNull();
    expect(r.fc70).toBeNull();
    expect(r.fc85).toBeNull();
    expect(r.rmr).toBeNull();
    expect(r.imc).toBe(29.4);
  });

  it('valores não finitos contam como faltantes', () => {
    expect(vazio({ ...perfilBase, peso: Number.NaN }).imc).toBeNull();
  });

  it('todas as chaves de Derivados existem mesmo sem dado', () => {
    expect(Object.keys(vazio()).sort()).toEqual(
      [
        'imc', 'fcMax', 'fc60', 'fc70', 'fc85', 'rmr', 'pal', 'tdee', 'defLo', 'defHi',
        'aguaMetaL', 'coposMeta', 'pantCorte', 'pantGrave', 'preensaoCorte', 'corteCintura',
        'diasParado', 'pesoMedioSemana', 'pesoMedioSemanaAnterior', 'fcRepousoMedia7d',
        'jejumHoras', 'sonoHoras', 'variacaoDeitarMin',
      ].sort(),
    );
  });
});

describe('derivar — pal e tdee pela semana', () => {
  const com = (s: Partial<Semana>) => derivar(perfilBase, [], [], semana(s), HOJE);

  it('ativ = minAtiv + sessoesTiros·20', () => {
    expect(com({ minAtiv: 60, sessoesTiros: 3 }).pal).toBe(1.4); // 120
    expect(com({ minAtiv: 200, sessoesTiros: 3 }).pal).toBe(1.5); // 260
    expect(com({ minAtiv: 300, sessoesTiros: 3 }).pal).toBe(1.6); // 360
  });

  it('limites: 150 e 300 são 1.5; 301 é 1.6', () => {
    expect(com({ minAtiv: 149 }).pal).toBe(1.4);
    expect(com({ minAtiv: 150 }).pal).toBe(1.5);
    expect(com({ minAtiv: 300 }).pal).toBe(1.5);
    expect(com({ minAtiv: 301 }).pal).toBe(1.6);
  });

  it('tdee e déficits acompanham o pal', () => {
    const r = com({ minAtiv: 200, sessoesTiros: 3 });
    expect(r.tdee).toBe(2661); // 1774 · 1.5
    expect(r.defLo).toBe(399);
    expect(r.defHi).toBe(665);
    expect(com({ minAtiv: 400 }).tdee).toBe(2838); // 1774 · 1.6 = 2838.4
  });
});

describe('derivar — água', () => {
  it('sem treino hoje: base por sexo', () => {
    expect(vazio().aguaMetaL).toBe(2);
    expect(vazio().coposMeta).toBe(8);
  });

  it('30 min de treino hoje somam 0,4 L', () => {
    const r = derivar(perfilBase, [], [treino(HOJE, 30)], undefined, HOJE);
    expect(r.aguaMetaL).toBe(2.4);
    expect(r.coposMeta).toBe(10);
  });

  it('dois eventos de hoje somam; evento de ontem não conta', () => {
    expect(derivar(perfilBase, [], [treino(HOJE, 15), treino(HOJE, 15, 'tiros')], undefined, HOJE).aguaMetaL).toBe(2.4);
    expect(derivar(perfilBase, [], [treino(d(1), 30)], undefined, HOJE).aguaMetaL).toBe(2);
  });

  it('o acréscimo tem teto de 2 L', () => {
    const r = derivar(perfilBase, [], [treino(HOJE, 200)], undefined, HOJE);
    expect(r.aguaMetaL).toBe(4);
    expect(r.coposMeta).toBe(16);
  });

  it('mulher com 30 min: 1,6 + 0,4', () => {
    const r = derivar(perfilMulher, [], [treino(HOJE, 30)], undefined, HOJE);
    expect(r.aguaMetaL).toBe(2);
    expect(r.coposMeta).toBe(8);
  });
});

describe('derivar — diasParado', () => {
  const parado = (dias: Dia[], eventos: EventoTreino[]) => derivar(perfilBase, dias, eventos, undefined, HOJE).diasParado;

  it('sem nenhum registro é 0', () => {
    expect(parado([], [])).toBe(0);
  });

  it('evento ou moveu === true hoje zera', () => {
    expect(parado([], [treino(HOJE, 10)])).toBe(0);
    expect(parado([dia(HOJE, { moveu: true })], [])).toBe(0);
  });

  it('ontem moveu, hoje ainda nada: 1', () => {
    expect(parado([], [treino(d(1), 10)])).toBe(1);
    expect(parado([dia(d(1), { moveu: true }), dia(HOJE, { passos: 100 })], [])).toBe(1);
  });

  it('último movimento há 3 dias: 3', () => {
    expect(parado([dia(HOJE), dia(d(1)), dia(d(2), { moveu: false })], [treino(d(3), 20)])).toBe(3);
  });

  it('moveu === false não conta como movimento; evento no mesmo dia vence', () => {
    expect(parado([dia(HOJE, { moveu: false })], [treino(HOJE, 10)])).toBe(0);
  });

  it('para no registro mais antigo (não inventa dias antes do primeiro registro)', () => {
    const dias = [0, 1, 2, 3, 4].map((i) => dia(d(i), { moveu: false }));
    expect(parado(dias, [])).toBe(5);
  });

  it('teto de 28 dias', () => {
    expect(parado([dia(d(40))], [])).toBe(28);
  });
});

describe('derivar — médias de janela', () => {
  it('peso: últimos 7 dias e os 7 anteriores, 1 casa', () => {
    const dias = [
      dia(HOJE, { peso: 90.2 }),
      dia(d(3), { peso: 89.8 }),
      dia(d(6), { peso: 90.0 }),
      dia(d(7), { peso: 91.0 }),
      dia(d(10), { peso: 90.6 }),
      dia(d(14), { peso: 95 }), // fora das duas janelas
    ];
    const r = derivar(perfilBase, dias, [], undefined, HOJE);
    expect(r.pesoMedioSemana).toBe(90);
    expect(r.pesoMedioSemanaAnterior).toBe(90.8);
  });

  it('sem peso: null nas duas', () => {
    const r = derivar(perfilBase, [dia(HOJE, { passos: 1 })], [], undefined, HOJE);
    expect(r.pesoMedioSemana).toBeNull();
    expect(r.pesoMedioSemanaAnterior).toBeNull();
  });

  it('fcRepouso: média dos últimos 7 dias', () => {
    const dias = [dia(HOJE, { fcRepouso: 70 }), dia(d(1), { fcRepouso: 72 }), dia(d(2), { fcRepouso: 74 }), dia(d(9), { fcRepouso: 90 })];
    expect(derivar(perfilBase, dias, [], undefined, HOJE).fcRepousoMedia7d).toBe(72);
    expect(vazio().fcRepousoMedia7d).toBeNull();
  });
});

describe('derivar — jejum, sono e variação de deitar', () => {
  it('jejumHoras: jantarFim de ontem → primeiraRefeicao de hoje', () => {
    const dias = [dia(HOJE, { primeiraRefeicao: '09:00' }), dia(d(1), { jantarFim: '19:00' })];
    expect(derivar(perfilBase, dias, [], undefined, HOJE).jejumHoras).toBe(14);
  });

  it('jejumHoras é null se falta um dos lados ou se o jantar é do dia errado', () => {
    expect(derivar(perfilBase, [dia(d(1), { jantarFim: '19:00' })], [], undefined, HOJE).jejumHoras).toBeNull();
    expect(derivar(perfilBase, [dia(HOJE, { primeiraRefeicao: '09:00' })], [], undefined, HOJE).jejumHoras).toBeNull();
    expect(derivar(perfilBase, [dia(HOJE, { primeiraRefeicao: '09:00', jantarFim: '19:00' })], [], undefined, HOJE).jejumHoras).toBeNull();
  });

  it('sonoHoras: (levantou − deitou) − 0,33 do dia mais recente com ambos', () => {
    expect(derivar(perfilBase, [dia(HOJE, { deitou: '23:30', levantou: '06:30' })], [], undefined, HOJE).sonoHoras).toBe(6.7);
    const dias = [dia(HOJE, { levantou: '06:30' }), dia(d(1), { deitou: '23:00', levantou: '07:00' })];
    expect(derivar(perfilBase, dias, [], undefined, HOJE).sonoHoras).toBe(7.7);
    const tarde = [dia(HOJE, { levantou: '06:30' }), dia(d(2), { deitou: '00:30', levantou: '07:00' })];
    expect(derivar(perfilBase, tarde, [], undefined, HOJE).sonoHoras).toBe(6.2);
    expect(vazio().sonoHoras).toBeNull();
  });

  it('variacaoDeitarMin: desvio-padrão em minutos, com meia-noite tratada como "tarde"', () => {
    const dias = [dia(HOJE, { deitou: '23:00' }), dia(d(1), { deitou: '23:30' }), dia(d(2), { deitou: '00:00' })];
    expect(derivar(perfilBase, dias, [], undefined, HOJE).variacaoDeitarMin).toBe(24.5);
    const iguais = [dia(HOJE, { deitou: '23:00' }), dia(d(1), { deitou: '23:00' }), dia(d(2), { deitou: '23:00' })];
    expect(derivar(perfilBase, iguais, [], undefined, HOJE).variacaoDeitarMin).toBe(0);
  });

  it('variacaoDeitarMin é null com menos de 2 dias na janela de 7', () => {
    expect(derivar(perfilBase, [dia(HOJE, { deitou: '23:00' })], [], undefined, HOJE).variacaoDeitarMin).toBeNull();
    const fora = [dia(HOJE, { deitou: '23:00' }), dia(d(8), { deitou: '01:00' })];
    expect(derivar(perfilBase, fora, [], undefined, HOJE).variacaoDeitarMin).toBeNull();
  });
});
