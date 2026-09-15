import { describe, expect, test, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CampoRegistro, numeroDe } from './CampoRegistro';
import type { Campo } from '@/dominio/campos';

const copos: Campo = { id: 'dia.copos', nivel: 2, tipo: 'inteiro', rotulo: 'Copos de água', unidade: 'copos', min: 0, max: 30, desbloqueia: ['beba-pela-sede'] };
const acordei: Campo = { id: 'dia.comoAcordei', nivel: 1, tipo: 'escala', rotulo: 'Como acordei', min: 1, max: 5, desbloqueia: ['durma-7'] };
const fome: Campo = { id: 'dia.fome', nivel: 1, tipo: 'escala', rotulo: 'Fome de ontem', min: 1, max: 10, desbloqueia: ['pergunte-a-fome'] };
const semFome: Campo = { id: 'dia.comiSemFome', nivel: 1, tipo: 'bool', rotulo: 'Comi sem estar com fome?', desbloqueia: ['pergunte-a-fome'] };
const deitou: Campo = { id: 'dia.deitou', nivel: 1, tipo: 'hora', rotulo: 'Deitei às', desbloqueia: ['durma-7'] };
const cafe: Campo = { id: 'dia.ultimoCafe', nivel: 1, tipo: 'hora-ou-nao', rotulo: 'Último café de ontem', desbloqueia: ['ultimo-cafe'] };
const doses: Campo = { id: 'dia.alcoolDoses', nivel: 2, tipo: 'inteiro-ou-nao', rotulo: 'Doses de álcool ontem', min: 0, max: 30, desbloqueia: ['se-beber'] };
const notas: Campo = { id: 'dia.notas', nivel: 3, tipo: 'texto', rotulo: 'Notas', desbloqueia: [] };

describe('CampoRegistro', () => {
  test('inteiro: valor fora da faixa mostra a mensagem e não chama onChange', () => {
    const onChange = vi.fn();
    render(<CampoRegistro campo={copos} valor={undefined} onChange={onChange} />);
    const input = screen.getByLabelText(/Copos de água/);
    fireEvent.change(input, { target: { value: '500' } });
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('alert').textContent).not.toBe('');

    fireEvent.change(input, { target: { value: '12' } });
    expect(onChange).toHaveBeenCalledWith(12);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  test('escala: 5 botões para max 5 e 10 para max 10', () => {
    const onChange = vi.fn();
    const { unmount } = render(<CampoRegistro campo={acordei} valor={undefined} onChange={onChange} />);
    expect(screen.getAllByRole('button')).toHaveLength(5);
    fireEvent.click(screen.getByRole('button', { name: '4' }));
    expect(onChange).toHaveBeenCalledWith(4);
    unmount();

    render(<CampoRegistro campo={fome} valor={7} onChange={onChange} />);
    expect(screen.getAllByRole('button')).toHaveLength(10);
    expect(screen.getByRole('button', { name: '7' })).toHaveAttribute('aria-pressed', 'true');
  });

  test('bool: Sim/Não', () => {
    const onChange = vi.fn();
    render(<CampoRegistro campo={semFome} valor={undefined} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Não' }));
    expect(onChange).toHaveBeenCalledWith(false);
    fireEvent.click(screen.getByRole('button', { name: 'Sim' }));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  test('hora: input time', () => {
    const onChange = vi.fn();
    render(<CampoRegistro campo={deitou} valor={undefined} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText(/Deitei às/), { target: { value: '23:15' } });
    expect(onChange).toHaveBeenCalledWith('23:15');
  });

  test('hora-ou-nao: botão "Não tomei" emite null', () => {
    const onChange = vi.fn();
    render(<CampoRegistro campo={cafe} valor={undefined} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Não tomei' }));
    expect(onChange).toHaveBeenCalledWith(null);
    fireEvent.change(screen.getByLabelText(/Último café de ontem/), { target: { value: '14:00' } });
    expect(onChange).toHaveBeenCalledWith('14:00');
  });

  test('inteiro-ou-nao: botão "Não bebi" emite null', () => {
    const onChange = vi.fn();
    render(<CampoRegistro campo={doses} valor={null} onChange={onChange} />);
    const botao = screen.getByRole('button', { name: 'Não bebi' });
    expect(botao).toHaveAttribute('aria-pressed', 'true');
    fireEvent.change(screen.getByLabelText(/Doses de álcool ontem/), { target: { value: '2' } });
    expect(onChange).toHaveBeenCalledWith(2);
  });

  test('texto: textarea', () => {
    const onChange = vi.fn();
    render(<CampoRegistro campo={notas} valor={undefined} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText(/Notas/), { target: { value: 'dia bom' } });
    expect(onChange).toHaveBeenCalledWith('dia bom');
  });

  test('marca o wrapper com data-campo e data-tipo', () => {
    const { container } = render(<CampoRegistro campo={copos} valor={3} onChange={() => {}} />);
    const el = container.querySelector('[data-campo="dia.copos"]');
    expect(el).not.toBeNull();
    expect(el).toHaveAttribute('data-tipo', 'inteiro');
  });

  test('inteiro-ou-nao: clicar "Não bebi" com valor numérico anterior limpa o texto do input (fix round 1)', () => {
    const onChange = vi.fn();
    render(<CampoRegistro campo={doses} valor={5} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Não bebi' }));
    expect(onChange).toHaveBeenCalledWith(null);
    expect(screen.getByLabelText(/Doses de álcool ontem/)).toHaveValue(null);
  });

  test('inteiro: rerender de valor numérico para undefined limpa o input (fix round 1)', () => {
    const onChange = vi.fn();
    const { rerender } = render(<CampoRegistro campo={copos} valor={5} onChange={onChange} />);
    expect(screen.getByLabelText(/Copos de água/)).toHaveValue(5);
    rerender(<CampoRegistro campo={copos} valor={undefined} onChange={onChange} />);
    expect(screen.getByLabelText(/Copos de água/)).toHaveValue(null);
  });

  test('inteiro: rerender de undefined para um número mostra o valor novo (fix round 1)', () => {
    const onChange = vi.fn();
    const { rerender } = render(<CampoRegistro campo={copos} valor={undefined} onChange={onChange} />);
    expect(screen.getByLabelText(/Copos de água/)).toHaveValue(null);
    rerender(<CampoRegistro campo={copos} valor={7} onChange={onChange} />);
    expect(screen.getByLabelText(/Copos de água/)).toHaveValue(7);
  });

  test('badInput (ex.: "1,2,3" que o navegador não interpreta) mostra erro e não chama onChange (fix wave, item 7)', () => {
    const onChange = vi.fn();
    // Começa com um valor não-vazio: o navegador zera .value para texto inválido em
    // input[type=number], e o evento só dispara quando o valor realmente muda.
    render(<CampoRegistro campo={copos} valor={5} onChange={onChange} />);
    const input = screen.getByLabelText(/Copos de água/);
    Object.defineProperty(input, 'validity', { value: { badInput: true }, configurable: true });
    fireEvent.change(input, { target: { value: '' } });
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Digite um número.');
  });

  test('sufixo aparece depois do rótulo quando informado (fix wave, item 4)', () => {
    render(<CampoRegistro campo={copos} valor={undefined} onChange={() => {}} sufixo="· ontem" />);
    const label = screen.getByText('Copos de água').closest('label');
    expect(label?.querySelector('.sufixo')).toHaveTextContent('· ontem');
  });

  test('sem sufixo, não renderiza o span extra', () => {
    const { container } = render(<CampoRegistro campo={copos} valor={undefined} onChange={() => {}} />);
    expect(container.querySelector('.sufixo')).toBeNull();
  });

  test('decimal: mais de um separador não é um número (fix round 1, minor 2)', () => {
    // Um <input type="number"> do jsdom (e dos navegadores) já sanitiza sozinho
    // "1,2,3" para "" antes do evento chegar ao React, então o bug do parseFloat
    // truncando silenciosamente ("1,2,3" → 1.2) não é alcançável simulando o DOM —
    // testa-se a função de parsing diretamente.
    expect(numeroDe('1,2,3', 'decimal')).toBeNull();
    expect(numeroDe('1.2.3', 'decimal')).toBeNull();
    expect(numeroDe('1,2', 'decimal')).toBe(1.2);
    expect(numeroDe('12', 'inteiro')).toBe(12);
  });
});
