import { beforeEach, describe, expect, test } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { Perfil } from './Perfil';
import { lerPerfil } from '@/dados/repositorios/perfil';
import { apagarTudo } from '@/dados/exportImport';
import { renderComContexto } from '@/test/render';

beforeEach(async () => {
  await apagarTudo();
});

describe('Perfil', () => {
  test('preencher e salvar grava o perfil', async () => {
    const { container } = renderComContexto(<Perfil />);
    expect(screen.getByRole('heading', { name: 'Seu perfil' })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Peso (kg)'), { target: { value: '90' } });
    fireEvent.change(screen.getByLabelText('Altura (cm)'), { target: { value: '175' } });
    fireEvent.change(screen.getByLabelText('Idade (anos)'), { target: { value: '40' } });
    fireEvent.click(screen.getByLabelText('Homem'));
    fireEvent.change(screen.getByLabelText('Hora que levanta'), { target: { value: '06:30' } });
    fireEvent.change(screen.getByLabelText('Hora que deita'), { target: { value: '23:30' } });
    fireEvent.change(screen.getByLabelText('Café ou chá com cafeína'), { target: { value: 'diario' } });
    fireEvent.change(screen.getByLabelText('Álcool'), { target: { value: 'nao' } });
    fireEvent.click(screen.getByLabelText('Pressão'));
    fireEvent.change(screen.getByLabelText('Fuma?'), { target: { value: 'nao' } });

    // medidas ao vivo: IMC aparece com os números digitados (90 / 1,75² = 29,4)
    // fix wave, item 10: CartaoMedida formata o valor com fmt (vírgula decimal).
    await waitFor(() => expect(container.querySelector('[data-medida="imc"] .big')?.textContent).toContain('29,4'));

    fireEvent.click(screen.getByRole('button', { name: 'Salvar perfil' }));

    await waitFor(async () => {
      const p = await lerPerfil();
      expect(p?.peso).toBe(90);
      expect(p?.altura).toBe(175);
      expect(p?.idade).toBe(40);
      expect(p?.cafe).toBe('diario');
      expect(p?.remedios).toEqual(['pressao']);
    });
  });

  test('não salva sem peso, altura e idade', () => {
    renderComContexto(<Perfil />);
    expect(screen.getByRole('button', { name: 'Salvar perfil' })).toBeDisabled();
  });

  // fix wave, item 12: rótulo visível do grupo de sexo, dica só enquanto o botão
  // está desabilitado, e Medidas ao vivo restritas às que dependem só do perfil.
  test('grupo de sexo tem rótulo visível "Sexo"', () => {
    renderComContexto(<Perfil />);
    const grupo = screen.getByRole('radiogroup', { name: 'Sexo' });
    expect(grupo).toHaveAttribute('aria-labelledby', 'sexo-rotulo');
    expect(document.getElementById('sexo-rotulo')).toHaveTextContent('Sexo');
  });

  test('dica "Preencha peso, altura e idade para salvar" some quando o botão habilita', () => {
    renderComContexto(<Perfil />);
    expect(screen.getByText('Preencha peso, altura e idade para salvar.')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Peso (kg)'), { target: { value: '90' } });
    fireEvent.change(screen.getByLabelText('Altura (cm)'), { target: { value: '175' } });
    fireEvent.change(screen.getByLabelText('Idade (anos)'), { target: { value: '40' } });
    expect(screen.getByRole('button', { name: 'Salvar perfil' })).toBeEnabled();
    expect(screen.queryByText('Preencha peso, altura e idade para salvar.')).toBeNull();
  });

  test('Medidas ao vivo mostra só imc, fc_max, rmr e agua', async () => {
    const { container } = renderComContexto(<Perfil />);
    fireEvent.change(screen.getByLabelText('Peso (kg)'), { target: { value: '90' } });
    fireEvent.change(screen.getByLabelText('Altura (cm)'), { target: { value: '175' } });
    fireEvent.change(screen.getByLabelText('Idade (anos)'), { target: { value: '40' } });
    await waitFor(() => expect(container.querySelectorAll('.medidas [data-medida]')).toHaveLength(4));
    const ids = Array.from(container.querySelectorAll('.medidas [data-medida]')).map((el) => el.getAttribute('data-medida'));
    expect(ids.sort()).toEqual(['agua', 'fc_max', 'imc', 'rmr']);
  });
});
