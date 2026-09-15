import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { comErro: boolean; }

/** Único ErrorBoundary da app (spec §9): qualquer erro inesperado ao ler os dados vira uma mensagem única, sem derrubar a página branca. */
export class ErroLimite extends Component<Props, State> {
  state: State = { comErro: false };

  static getDerivedStateFromError(): State {
    return { comErro: true };
  }

  componentDidCatch(erro: Error, info: ErrorInfo) {
    console.error('ErroLimite capturou:', erro, info.componentStack);
  }

  render() {
    if (this.state.comErro) {
      return (
        <p className="aviso" role="alert">
          Algo deu errado ao ler os dados neste navegador. Recarregue a página; se persistir, exporte seus dados em Ajustes.
          <br />
          <button type="button" className="botao" onClick={() => window.location.reload()}>Recarregar</button>
        </p>
      );
    }
    return this.props.children;
  }
}
