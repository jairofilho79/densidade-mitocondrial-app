import { useState, type ReactNode } from 'react';
import type { Campo } from '@/dominio/campos';
import { validar } from '@/dominio/campos';
import './componentes.css';

export interface CampoRegistroProps {
  campo: Campo;
  valor: unknown;
  onChange: (v: unknown) => void;
}

function textoDe(valor: unknown): string {
  return valor === undefined || valor === null ? '' : String(valor);
}

export function CampoRegistro({ campo, valor, onChange }: CampoRegistroProps) {
  const id = `campo-${campo.id.replace('.', '-')}`;
  const [erro, setErro] = useState<string | null>(null);

  // Texto local para inputs numéricos: um valor inválido fica visível (com a
  // mensagem) sem ser gravado; quando a prop muda de fora, o texto acompanha.
  const [texto, setTexto] = useState(textoDe(valor));
  const [valorAnterior, setValorAnterior] = useState(valor);
  if (valor !== valorAnterior) {
    setValorAnterior(valor);
    if (valor !== undefined && valor !== null) setTexto(String(valor));
  }

  /** Estados "não registrou" (undefined) e "não se aplica" (null) não passam por validar. */
  function emitir(v: unknown) {
    if (v === undefined || v === null) {
      setErro(null);
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
    const n = campo.tipo === 'inteiro' || campo.tipo === 'inteiro-ou-nao'
      ? parseInt(t, 10)
      : parseFloat(t.replace(',', '.'));
    if (Number.isNaN(n)) {
      setErro('Digite um número.');
      return;
    }
    emitir(n);
  }

  const rotulo = (
    <>
      {campo.rotulo}
      {campo.unidade && <span className="u"> {campo.unidade}</span>}
    </>
  );

  const numero = (
    <input
      id={id}
      type="number"
      inputMode="decimal"
      min={campo.min}
      max={campo.max}
      step={campo.tipo === 'decimal' ? 0.1 : 1}
      value={texto}
      onChange={(e) => emitirNumero(e.target.value)}
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
