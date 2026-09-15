import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CartaoMedida } from './CartaoMedida';
import type { MedidaResultado } from '@/dominio/medidas';

const imc: MedidaResultado = {
  id: 'imc', valor: 29.4, unidade: '', zona: 'atencao', texto: 'Categoria: sobrepeso.',
  zonas: [{ tom: 'ok', rotulo: '18,5–24,9' }, { tom: 'weak', rotulo: '25–29,9 sobrepeso' }, { tom: 'bad', rotulo: '≥ 30 obesidade' }],
};

describe('CartaoMedida', () => {
  test('título do catálogo, valor, zona e faixas', () => {
    render(<CartaoMedida m={imc} />);
    expect(screen.getByText('IMC')).toBeInTheDocument();
    expect(screen.getByText('29,4')).toBeInTheDocument();
    expect(screen.getByText('perto')).toBeInTheDocument();
    expect(screen.getByText('Categoria: sobrepeso.')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  test('sem valor mostra travessão e "preencha o perfil"', () => {
    render(<CartaoMedida m={{ ...imc, valor: null, zona: 'neutra', texto: '', zonas: [] }} />);
    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.getByText('preencha o perfil')).toBeInTheDocument();
  });
});
