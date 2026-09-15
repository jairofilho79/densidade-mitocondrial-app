import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BarraZona } from './BarraZona';

describe('BarraZona', () => {
  test('marcador "você" só na posição — não assume meta em 0,5', () => {
    const { container } = render(<BarraZona zona="atencao" posicao={0.4} faixa={{ pouco: 2000, meta: 5000, demais: 10000 }} />);
    expect(screen.getByRole('img', { name: 'Zona: perto' })).toBeInTheDocument();
    const voce = container.querySelector('.voce') as HTMLElement;
    expect(voce.style.left).toBe('40%');
  });

  test('três segmentos rotulados pela faixa (pouco/meta/demais)', () => {
    render(<BarraZona zona="atencao" posicao={0.4} faixa={{ pouco: 2000, meta: 5000, demais: 10000 }} />);
    expect(screen.getByText('2000')).toBeInTheDocument();
    expect(screen.getByText('5000')).toBeInTheDocument();
    expect(screen.getByText('10000')).toBeInTheDocument();
  });

  test('sem-dado: sem marcador e segmentos neutros', () => {
    const { container } = render(<BarraZona zona="sem-dado" posicao={null} faixa={null} />);
    expect(container.querySelector('.voce')).toBeNull();
    expect(container.querySelectorAll('i.nd')).toHaveLength(3);
  });
});
