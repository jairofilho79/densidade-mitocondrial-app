import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConviteRegistro } from './ConviteRegistro';
import type { Campo } from '@/dominio/campos';
import { acaoDoCatalogo } from '@/dominio/catalogo';

const passos: Campo = { id: 'dia.passos', nivel: 1, tipo: 'inteiro', rotulo: 'Passos de ontem', desbloqueia: ['seis-mil-passos'] };
const copos: Campo = { id: 'dia.copos', nivel: 2, tipo: 'inteiro', rotulo: 'Copos de água', desbloqueia: ['beba-pela-sede', 'seis-mil-passos'] };

describe('ConviteRegistro', () => {
  test('frase com rótulos e títulos das ações (sem repetir)', () => {
    render(<ConviteRegistro campos={[passos, copos]} />);
    const t1 = acaoDoCatalogo('seis-mil-passos').titulo;
    const t2 = acaoDoCatalogo('beba-pela-sede').titulo;
    expect(screen.getByText(`Registre passos de ontem e copos de água e eu te digo onde você está em ${t1} e ${t2}.`)).toBeInTheDocument();
  });

  test('sem campos não renderiza nada', () => {
    const { container } = render(<ConviteRegistro campos={[]} />);
    expect(container.innerHTML).toBe('');
  });
});
