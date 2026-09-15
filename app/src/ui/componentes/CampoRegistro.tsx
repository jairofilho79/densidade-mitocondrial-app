import { useEffect, useState, type ChangeEvent, type ReactNode } from 'react';
import type { Campo } from '@/dominio/campos';
import { validar } from '@/dominio/campos';
import './componentes.css';

export interface CampoRegistroProps {
  campo: Campo;
  valor: unknown;
  onChange: (v: unknown) => void;
  /** Diz de que dia o campo fala (ex.: "· ontem"), renderizado depois do rótulo. */
  sufixo?: string;
}

function textoDe(valor: unknown): string {
  return valor === undefined || valor === null ? '' : String(valor);
}

/** Aceita um único separador decimal (','  ou '.'); "1,2,3" ou "1.2.3" não é um número. */
const NUMERO_INTEIRO_RE = /^-?\d+$/;
const NUMERO_DECIMAL_RE = /^-?\d+([.,]\d+)?$/;

/**
 * Texto digitado → número, ou `null` se não for um número válido (exportada para
 * teste direto: um `<input type="number">` sanitiza sozinho grande parte dos
 * textos malformados antes de disparar o evento, então "1,2,3" nunca chega ao
 * `onChange` do React — o parsing precisa ser testado à parte da simulação de DOM).
 */
export function numeroDe(t: string, tipo: Campo['tipo']): number | null {
  const inteiro = tipo === 'inteiro' || tipo === 'inteiro-ou-nao';
  const re = inteiro ? NUMERO_INTEIRO_RE : NUMERO_DECIMAL_RE;
  if (!re.test(t.trim())) return null;
  const n = inteiro ? parseInt(t, 10) : parseFloat(t.replace(',', '.'));
  return Number.isNaN(n) ? null : n;
}

export function CampoRegistro({ campo, valor, onChange, sufixo }: CampoRegistroProps) {
  const id = `campo-${campo.id.replace('.', '-')}`;
  const [erro, setErro] = useState<string | null>(null);

  // Texto local para inputs numéricos: um valor inválido fica visível (com a
  // mensagem) sem ser gravado. Quando a prop muda de fora — inclusive para `null`
  // ou `undefined`, ex.: "Não tomei"/"Não bebi" ou troca do registro em edição —
  // o texto acompanha sempre (nunca fica um número obsoleto ao lado de um botão
  // "não" marcado).
  const [texto, setTexto] = useState(textoDe(valor));
  useEffect(() => {
    setTexto(textoDe(valor));
  }, [valor]);

  /** Estados "não registrou" (undefined) e "não se aplica" (null) não passam por validar. */
  function emitir(v: unknown) {
    if (v === undefined || v === null) {
      setErro(null);
      setTexto('');
      onChange(v);
      return;
    }
    const msg = validar(campo, v);
    setErro(msg);
    if (msg === null) onChange(v);
  }

  function emitirNumero(t: string) {
    setTexto(t);
    if (t.trim() === '') {
      emitir(undefined);
      return;
    }
    const n = numeroDe(t, campo.tipo);
    if (n === null) {
      setErro('Digite um número.');
      return;
    }
    emitir(n);
  }

  const rotulo = (
    <>
      {campo.rotulo}
      {campo.unidade && <span className="u"> {campo.unidade}</span>}
      {sufixo && <span className="sufixo">{sufixo}</span>}
    </>
  );

  function aoMudarNumero(e: ChangeEvent<HTMLInputElement>) {
    // Um <input type="number"> zera o value ('') para texto que ele não consegue
    // interpretar como número (ex.: "1,2,3"); sem checar validity.badInput primeiro,
    // isso cairia no caminho de "apagou o campo" e emitiria undefined em silêncio.
    if (e.target.validity?.badInput) {
      setTexto(e.target.value);
      setErro('Digite um número.');
      return;
    }
    emitirNumero(e.target.value);
  }

  const numero = (
    <input
      id={id}
      type="number"
      inputMode="decimal"
      min={campo.min}
      max={campo.max}
      step={campo.tipo === 'decimal' ? 0.1 : 1}
      value={texto}
      onChange={aoMudarNumero}
    />
  );

  const hora = (
    <input
      id={id}
      type="time"
      value={typeof valor === 'string' ? valor : ''}
      onChange={(e) => emitir(e.target.value === '' ? undefined : e.target.value)}
    />
  );

  let controle: ReactNode;
  let usaLabel = true;

  switch (campo.tipo) {
    case 'hora':
      controle = hora;
      break;
    case 'inteiro':
    case 'decimal':
      controle = numero;
      break;
    case 'texto':
      controle = (
        <textarea
          id={id}
          value={typeof valor === 'string' ? valor : ''}
          onChange={(e) => emitir(e.target.value === '' ? undefined : e.target.value)}
        />
      );
      break;
    case 'escala': {
      usaLabel = false;
      const de = campo.min ?? 1;
      const ate = campo.max ?? 5;
      const opcoes: number[] = [];
      for (let n = de; n <= ate; n++) opcoes.push(n);
      controle = (
        <div className="escolha" role="group" aria-labelledby={id}>
          {opcoes.map((n) => (
            <button key={n} type="button" className="botao" aria-pressed={valor === n} onClick={() => emitir(n)}>
              {n}
            </button>
          ))}
        </div>
      );
      break;
    }
    case 'bool':
      usaLabel = false;
      controle = (
        <div className="escolha" role="group" aria-labelledby={id}>
          <button type="button" className="botao" aria-pressed={valor === true} onClick={() => emitir(true)}>Sim</button>
          <button type="button" className="botao" aria-pressed={valor === false} onClick={() => emitir(false)}>Não</button>
        </div>
      );
      break;
    case 'hora-ou-nao':
      controle = (
        <div className="ou-nao">
          <button type="button" className="botao" aria-pressed={valor === null} onClick={() => emitir(null)}>Não tomei</button>
          {hora}
        </div>
      );
      break;
    case 'inteiro-ou-nao':
      controle = (
        <div className="ou-nao">
          <button type="button" className="botao" aria-pressed={valor === null} onClick={() => emitir(null)}>Não bebi</button>
          {numero}
        </div>
      );
      break;
  }

  return (
    <div className="campo" data-campo={campo.id} data-tipo={campo.tipo}>
      {usaLabel ? <label htmlFor={id}>{rotulo}</label> : <span className="rotulo" id={id}>{rotulo}</span>}
      {controle}
      {campo.ajuda && <small className="ajuda">{campo.ajuda}</small>}
      {erro && <p className="erro" role="alert">{erro}</p>}
    </div>
  );
}
