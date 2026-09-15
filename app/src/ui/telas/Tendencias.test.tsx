import { beforeEach, describe, expect, test } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { Tendencias } from './Tendencias';
import { salvarPerfil } from '@/dados/repositorios/perfil';
import { salvarDia } from '@/dados/repositorios/dia';
import { apagarTudo } from '@/dados/exportImport';
import { hojeISO, somarDias } from '@/dados/datas';
import { PERFIL, PERFIL_SEM_CAFE } from '@/test/fixtures';

beforeEach(async () => {
  await apagarTudo();
});

function renderizar() {
  return render(<MemoryRouter><Tendencias /></MemoryRouter>);
}

/**
 * 13 dias consecutivos (do mais antigo, hoje−12, até hoje), 8 h na cama (≈ 7,7 h de sono)
 * exceto a cada 4 dias uma noite curta (deitou 01:30). Convenção de registro (contratos,
 * `dominio/tendencias/sonoFomeCafe.ts`): o `fome`/`comiSemFome` do registro de um dia
 * descreve o dia ANTERIOR — por isso quem marca "dia seguinte a uma noite curta" é o
 * registro seguinte (`k + 1`), não o próprio dia da noite curta.
 */
async function fixtureDias() {
  const hoje = hojeISO();
  const datas = Array.from({ length: 13 }, (_, k) => somarDias(hoje, k - 12));
  for (let k = 0; k < datas.length; k++) {
    const curta = k % 4 === 3; // noite curta (deitou → levantou) a cada 4 dias
    const diaSeguinteACurta = k > 0 && (k - 1) % 4 === 3; // este registro descreve o dia após uma noite curta
    await salvarDia(datas[k], {
      deitou: curta ? '01:30' : '23:00',
      levantou: '07:00',
      fome: diaSeguinteACurta ? 7 : 4,
      comiSemFome: diaSeguinteACurta,
      ultimoCafe: k % 2 === 0 ? '10:00' : '17:00',
    });
  }
}

describe('Tendências', () => {
  test('sem check-ins: diz quantos faltam e o que vai dizer', async () => {
    await salvarPerfil(PERFIL);
    renderizar();
    expect(await screen.findByText(/^Faltam \d+ check-ins/)).toBeInTheDocument();
  });

  test('com 13 dias: mostra frases com o delta real (não só o n)', async () => {
    await salvarPerfil(PERFIL);
    await fixtureDias();
    renderizar();
    await screen.findByRole('heading', { name: 'Tendências' });
    await waitFor(() => expect(screen.queryByText(/^Faltam/)).toBeNull());
    const frases = await screen.findAllByRole('listitem');
    expect(frases.length).toBeGreaterThanOrEqual(2);
    // 3 noites curtas (fome 7) vs baseline 4 (fome nos dias após noite normal) → delta +3,0.
    expect(frases[0].textContent).toMatch(/\+3,0 acima do seu normal \(n = 3\)/);
  });

  test('perfil sem café explica que a tendência é sono × fome', async () => {
    await salvarPerfil(PERFIL_SEM_CAFE);
    await fixtureDias();
    renderizar();
    expect(await screen.findByText(/sua tendência é sono × fome/)).toBeInTheDocument();
  });
});
