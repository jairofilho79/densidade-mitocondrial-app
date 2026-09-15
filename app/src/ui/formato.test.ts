import { describe, expect, test } from 'vitest';
import { chaveDe, listar, ROTULO_ZONA, horaAgora, primeiraSegundaDoMes, diasEntre, formatarData, formatarMes } from './formato';
import type { Campo } from '@/dominio/campos';

const campoPassos: Campo = { id: 'dia.passos', nivel: 1, tipo: 'inteiro', rotulo: 'Passos', desbloqueia: ['seis-mil-passos'] };

describe('formato', () => {
  test('chaveDe tira o prefixo da tabela', () => {
    expect(chaveDe(campoPassos)).toBe('passos');
  });

  test('listar junta com vírgula e "e"', () => {
    expect(listar([])).toBe('');
    expect(listar(['a'])).toBe('a');
    expect(listar(['a', 'b'])).toBe('a e b');
    expect(listar(['a', 'b', 'c'])).toBe('a, b e c');
  });

  test('ROTULO_ZONA cobre as cinco zonas', () => {
    expect(ROTULO_ZONA.meta).toBe('na meta');
    expect(ROTULO_ZONA['sem-dado']).toBe('sem dado');
    expect(ROTULO_ZONA.atencao).toBe('perto');
  });

  test('horaAgora formata com dois dígitos', () => {
    expect(horaAgora(new Date(2026, 8, 14, 7, 5))).toBe('07:05');
  });

  test('primeiraSegundaDoMes', () => {
    expect(primeiraSegundaDoMes('2026-09-07')).toBe(true);  // segunda, dia 7
    expect(primeiraSegundaDoMes('2026-09-14')).toBe(false); // segunda, dia 14
    expect(primeiraSegundaDoMes('2026-09-01')).toBe(false); // terça
  });

  test('diasEntre e formatarData', () => {
    expect(diasEntre('2026-06-22', '2026-09-14')).toBe(84);
    expect(formatarData('2026-09-14')).toBe('14/09/2026');
  });

  test('formatarMes escreve o mês por extenso (fix wave, item 3)', () => {
    expect(formatarMes('2026-09')).toBe('setembro de 2026');
    expect(formatarMes('2026-01')).toBe('janeiro de 2026');
    expect(formatarMes('2026-12')).toBe('dezembro de 2026');
  });
});
