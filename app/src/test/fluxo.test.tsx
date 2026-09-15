import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { App } from '@/app/App';
import { apagarTudo } from '@/dados/exportImport';

/**
 * Fix wave round 2, item 1 (CRITICAL, ruling do re-reviewer): com duas
 * useLiveQuery independentes (Guarda em App.tsx e a tela Perfil), sob latência
 * real do IndexedDB elas podiam resolver em ticks diferentes — Perfil navegava
 * assim que A SUA consulta via `usePerfil()` resolvia, mas a Guarda (seu
 * próprio `useContexto()`) ainda via `semPerfil` por mais um instante e
 * devolvia para /perfil; Perfil desmontava e `pediuSalvar` se perdia. O
 * re-reviewer reproduziu o bounce `#/perfil → #/ → #/perfil` em 6/25 execuções
 * com 1–8 ms de jitter (23/25 com 1–30 ms).
 *
 * Este teste reproduz a mesma condição de corrida atrasando aleatoriamente
 * TODA operação assíncrona do fake-indexeddb — que, em `lib/scheduling.js`,
 * lê `globalThis.setImmediate` a cada chamada de `queueTask`, não uma vez só
 * no carregamento do módulo — e roda o fluxo de primeiro uso (perfil vazio →
 * preencher → salvar → chegar em Hoje) 10 vezes, cada uma com o banco limpo.
 *
 * Contra o código de antes da correção estrutural (Guarda e Perfil lendo dois
 * useLiveQuery separados), isto falha de forma intermitente — confirmado
 * rodando este teste antes do fix (ver fix-wave-report.md, round 2). Depois
 * do ContextoProvider compartilhado, Guarda e Perfil leem exatamente o mesmo
 * valor no mesmo render, e o teste passa de forma determinística.
 */
function instalarJitterSetImmediate(): () => void {
  const original = globalThis.setImmediate;
  const comJitter = ((callback: (...args: unknown[]) => void, ...args: unknown[]) => {
    const atrasoMs = 1 + Math.floor(Math.random() * 8); // 1–8 ms, como no relato do re-reviewer
    return original(() => setTimeout(() => callback(...args), atrasoMs));
  }) as typeof setImmediate;
  // setImmediate mantém as propriedades auxiliares (ex.: __promisify__) que o typing espera.
  Object.assign(comJitter, original);
  globalThis.setImmediate = comJitter;
  return () => {
    globalThis.setImmediate = original;
  };
}

let restaurarSetImmediate: () => void;

beforeEach(() => {
  restaurarSetImmediate = instalarJitterSetImmediate();
});

afterEach(() => {
  restaurarSetImmediate();
});

describe('fluxo de primeiro uso — latência aleatória de IndexedDB', () => {
  test('salvar o primeiro perfil sempre leva a Hoje, mesmo com IndexedDB lento e instável', async () => {
    for (let i = 0; i < 10; i++) {
      await apagarTudo();
      window.location.hash = '';

      render(<App />);
      expect(await screen.findByRole('heading', { name: 'Seu perfil' }, { timeout: 3000 })).toBeInTheDocument();

      fireEvent.change(screen.getByLabelText('Peso (kg)'), { target: { value: '90' } });
      fireEvent.change(screen.getByLabelText('Altura (cm)'), { target: { value: '175' } });
      fireEvent.change(screen.getByLabelText('Idade (anos)'), { target: { value: '40' } });
      fireEvent.click(screen.getByRole('button', { name: 'Salvar perfil' }));

      expect(await screen.findByRole('heading', { name: 'Hoje' }, { timeout: 3000 })).toBeInTheDocument();

      cleanup();
    }
  }, 30000);
});
