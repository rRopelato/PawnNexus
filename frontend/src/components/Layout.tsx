import { Link, NavLink, Outlet, useNavigate } from 'react-router';
import { Github, Heart, LogOut, Shield, Swords, UserRound } from 'lucide-react';
import type { ReactNode } from 'react';
import type { User } from '../types';
import { clearToken } from '../lib/api';
import { creator } from '../lib/support';

type Props = {
  user: User | null;
  onLogout: () => void;
};

export function Layout({ user, onLogout }: Props) {
  const navigate = useNavigate();

  function logout() {
    clearToken();
    onLogout();
    navigate('/');
  }

  return (
    <div className="flex min-h-screen flex-col bg-ash-950 text-zinc-100">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-ash-950/88 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded border border-ember-500/40 bg-ash-850 text-ember-500">
              <Swords size={22} />
            </span>
            <span className="text-lg font-semibold tracking-wide">PawnNexus</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            <NavItem to="/">Browse</NavItem>
            {user ? <NavItem to="/my-pawns">My Pawns</NavItem> : null}
            {user ? <NavItem to="/add-pawn">Add Pawn</NavItem> : null}
            <NavItem to="/support">Support</NavItem>
            {user?.role === 'admin' ? <NavItem to="/admin">Admin</NavItem> : null}
          </nav>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Link
                  to="/profile"
                  className="hidden items-center gap-2 rounded border border-white/10 px-3 py-2 text-sm text-zinc-300 transition hover:border-ember-500/40 hover:text-white sm:flex"
                >
                  {user.role === 'admin' ? <Shield size={16} /> : <UserRound size={16} />}
                  {user.username}
                </Link>
                <button className="icon-button" onClick={logout} aria-label="Log out" title="Log out">
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <>
                <Link className="button-secondary" to="/login">
                  Login
                </Link>
                <Link className="button-primary" to="/register">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-white/10 bg-ash-900/60">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 text-sm text-zinc-400 md:flex-row md:items-center md:justify-between">
          <p>
            PawnNexus is heavily inspired by{' '}
            <a className="text-ember-500 hover:text-ember-600" href="https://pawnguild.xyz" target="_blank" rel="noreferrer">
              PawnGuild.xyz
            </a>
            . Made by{' '}
            <a className="text-ember-500 hover:text-ember-600" href={creator.githubUrl} target="_blank" rel="noreferrer">
              {creator.name}
            </a>
            .
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link className="inline-flex items-center gap-2 text-zinc-300 hover:text-white" to="/support">
              <Heart size={16} /> Support
            </Link>
            <a className="inline-flex items-center gap-2 text-zinc-300 hover:text-white" href={creator.githubUrl} target="_blank" rel="noreferrer">
              <Github size={16} /> GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function NavItem({ to, children }: { to: string; children: ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `rounded px-3 py-2 text-sm transition ${
          isActive ? 'bg-ember-500 text-ash-950' : 'text-zinc-300 hover:bg-white/5 hover:text-white'
        }`
      }
    >
      {children}
    </NavLink>
  );
}
