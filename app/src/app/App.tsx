import { useEffect, useState, type ReactNode } from 'react';
import { HashRouter, Routes, Route, NavLink, Navigate, useLocation } from 'react-router';
import { useContexto } from '@/ui/hooks/useContexto';
import { indexedDbDisponivel } from '@/dados/disponibilidade';
import { Hoje } from '@/ui/telas/Hoje';
import { Perfil } from '@/ui/telas/Perfil';
import { Acoes } from '@/ui/telas/Acoes';
import { Segunda } from '@/ui/telas/Segunda';
import { Exames } from '@/ui/telas/Exames';
import { Tendencias } from '@/ui/telas/Tendencias';
import { Ajustes } from '@/ui/telas/Ajustes';

const NAV = [
  { para: '/', rotulo: 'Hoje' },
  { para: '/acoes', rotulo: 'Ações' },
  { para: '/segunda', rotulo: 'Segunda' },
  { para: '/tendencias', rotulo: 'Tendências' },
  { para: '/ajustes', rotulo: 'Ajustes' },
];

function Guarda({ children }: { children: ReactNode }) {
  const { carregando, semPerfil } = useContexto();
  const { pathname } = useLocation();
  if (carregando) return <p className="carregando">Carregando…</p>;
  // /ajustes fica acessível sem perfil: é o único jeito de restaurar um backup
  // exportado noutro aparelho (fix wave, item 2).
  if (semPerfil && pathname !== '/perfil' && pathname !== '/ajustes') return <Navigate to="/perfil" replace />;
  return <>{children}</>;
}

export function App() {
  // null = verificando; false = mensagem única, sem rotas (spec §9, a v1 não tem modo em memória); true = app.
  const [dbOk, setDbOk] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelado = false;
    indexedDbDisponivel().then((ok) => {
      if (!cancelado) setDbOk(ok);
    });
    return () => {
      cancelado = true;
    };
  }, []);

  if (dbOk === null) return <p className="carregando">Carregando…</p>;

  if (!dbOk) {
    return (
      <p className="aviso" role="alert">
        Este navegador não permite guardar dados (modo privado ou bloqueio de armazenamento). Abra fora do modo privado para usar a app.
      </p>
    );
  }

  return (
    <HashRouter>
      <div className="app">
        <main className="conteudo">
          <Guarda>
            <Routes>
              <Route path="/" element={<Hoje />} />
              <Route path="/perfil" element={<Perfil />} />
              <Route path="/acoes" element={<Acoes />} />
              <Route path="/segunda" element={<Segunda />} />
              <Route path="/exames" element={<Exames />} />
              <Route path="/tendencias" element={<Tendencias />} />
              <Route path="/ajustes" element={<Ajustes />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Guarda>
        </main>
        <nav className="nav" aria-label="Principal">
          {NAV.map((i) => (
            <NavLink key={i.para} to={i.para} end={i.para === '/'} className={({ isActive }) => (isActive ? 'ativo' : undefined)}>
              {i.rotulo}
            </NavLink>
          ))}
        </nav>
      </div>
    </HashRouter>
  );
}
