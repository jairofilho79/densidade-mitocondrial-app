import { describe, expect, it } from 'vitest';
import { avisoSeguranca } from './seguranca';
import type { Perfil } from './tipos';

const base: Perfil = {
  peso: 90,
  altura: 175,
  idade: 40,
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

describe('avisoSeguranca', () => {
  it('perfil sem flags: nenhum aviso para nenhuma ação', () => {
    expect(avisoSeguranca('tres-tiros', base)).toBeUndefined();
    expect(avisoSeguranca('feche-a-cozinha', base)).toBeUndefined();
    expect(avisoSeguranca('emagreca-devagar', base)).toBeUndefined();
    expect(avisoSeguranca('seis-mil-passos', base)).toBeUndefined();
  });

  it('tres-tiros: remédio para pressão', () => {
    expect(avisoSeguranca('tres-tiros', { ...base, remedios: ['pressao'] })).toBe(
      'Você marcou remédio para pressão no perfil — converse com quem te acompanha antes de mudar isso.',
    );
  });

  it('tres-tiros: fuma', () => {
    expect(avisoSeguranca('tres-tiros', { ...base, fuma: 'sim' })).toBe(
      'Você marcou que fuma no perfil — converse com quem te acompanha antes de mudar isso.',
    );
  });

  it('tres-tiros: pressão e fuma juntos', () => {
    expect(avisoSeguranca('tres-tiros', { ...base, remedios: ['pressao'], fuma: 'sim' })).toBe(
      'Você marcou remédio para pressão e que fuma no perfil — converse com quem te acompanha antes de mudar isso.',
    );
  });

  it('tres-tiros: parou de fumar não gera aviso; glicemia não afeta tiros', () => {
    expect(avisoSeguranca('tres-tiros', { ...base, fuma: 'parou' })).toBeUndefined();
    expect(avisoSeguranca('tres-tiros', { ...base, remedios: ['glicemia'] })).toBeUndefined();
  });

  it('feche-a-cozinha e emagreca-devagar: glicemia ou tireoide', () => {
    expect(avisoSeguranca('feche-a-cozinha', { ...base, remedios: ['glicemia'] })).toBe(
      'Você marcou remédio para glicemia no perfil — converse com quem te acompanha antes de mudar isso.',
    );
    expect(avisoSeguranca('emagreca-devagar', { ...base, remedios: ['tireoide'] })).toBe(
      'Você marcou remédio para tireoide no perfil — converse com quem te acompanha antes de mudar isso.',
    );
    expect(avisoSeguranca('emagreca-devagar', { ...base, remedios: ['glicemia', 'tireoide'] })).toBe(
      'Você marcou remédio para glicemia e remédio para tireoide no perfil — converse com quem te acompanha antes de mudar isso.',
    );
  });

  it('feche-a-cozinha: pressão não afeta', () => {
    expect(avisoSeguranca('feche-a-cozinha', { ...base, remedios: ['pressao'] })).toBeUndefined();
  });
});
