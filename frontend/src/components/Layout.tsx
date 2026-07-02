import { Link, NavLink, Outlet, useNavigate } from 'react-router';
import { AlertTriangle, Github, Heart, LogOut, Menu, Shield, Swords, UserRound, X } from 'lucide-react';
import { useState } from 'react';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function logout() {
    clearToken();
    onLogout();
    setMobileMenuOpen(false);
    navigate('/');
  }

  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }

  return (
    <div className="flex min-h-screen flex-col bg-ash-950 text-zinc-100">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-ash-950/88 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4">
          <Link to="/" className="flex min-w-0 items-center gap-3" onClick={closeMobileMenu}>
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded border border-ember-500/40 bg-ash-850 text-ember-500">
              <Swords size={22} />
            </span>
            <span className="truncate text-lg font-semibold tracking-wide">PawnNexus</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            <NavItem to="/">Browse</NavItem>
            {user ? <NavItem to="/my-pawns">My Pawns</NavItem> : null}
            {user ? <NavItem to={user.emailVerifiedAt ? '/add-pawn' : '/verify-required'}>Add Pawn</NavItem> : null}
            <NavItem to="/faq">FAQ</NavItem>
            <NavItem to="/support">Support</NavItem>
            {user && user.emailVerifiedAt && (user.role === 'admin' || user.role === 'moderator') ? <NavItem to="/admin">Admin</NavItem> : null}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            {user ? (
              <>
                <Link
                  to="/profile"
                  className="hidden items-center gap-2 rounded border border-white/10 px-3 py-2 text-sm text-zinc-300 transition hover:border-ember-500/40 hover:text-white sm:flex"
                >
                  {user.role === 'admin' || user.role === 'moderator' ? <Shield size={16} /> : <UserRound size={16} />}
                  {user.username}
                </Link>
                <button className="icon-button" onClick={logout} aria-label="Log out" title="Log out">
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <div className="hidden items-center gap-2 sm:flex">
                <Link className="button-secondary" to="/login">
                  Login
                </Link>
                <Link className="button-primary" to="/register">
                  Register
                </Link>
              </div>
            )}

            <button
              className="icon-button md:hidden"
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
              title={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen ? (
          <nav className="border-t border-white/10 px-4 pb-4 md:hidden">
            <div className="mx-auto grid max-w-7xl gap-2 pt-4">
              <MobileNavItem to="/" onClick={closeMobileMenu}>Browse</MobileNavItem>
              {user ? <MobileNavItem to="/my-pawns" onClick={closeMobileMenu}>My Pawns</MobileNavItem> : null}
              {user ? <MobileNavItem to={user.emailVerifiedAt ? '/add-pawn' : '/verify-required'} onClick={closeMobileMenu}>Add Pawn</MobileNavItem> : null}
              <MobileNavItem to="/faq" onClick={closeMobileMenu}>FAQ</MobileNavItem>
              <MobileNavItem to="/support" onClick={closeMobileMenu}>Support</MobileNavItem>
              {user ? <MobileNavItem to="/profile" onClick={closeMobileMenu}>Profile</MobileNavItem> : null}
              {user && user.emailVerifiedAt && (user.role === 'admin' || user.role === 'moderator') ? <MobileNavItem to="/admin" onClick={closeMobileMenu}>Admin</MobileNavItem> : null}
              {!user ? (
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Link className="button-secondary justify-center" to="/login" onClick={closeMobileMenu}>
                    Login
                  </Link>
                  <Link className="button-primary justify-center" to="/register" onClick={closeMobileMenu}>
                    Register
                  </Link>
                </div>
              ) : null}
            </div>
          </nav>
        ) : null}
      </header>

      <section className="border-b border-ember-500/20 bg-ember-500/10">
        <div className="mx-auto flex max-w-7xl gap-3 px-4 py-4 text-sm text-zinc-200">
          <AlertTriangle className="mt-0.5 shrink-0 text-ember-500" size={18} />
          <div className="space-y-1">
            <p className="font-semibold text-white">Sorry - recent database work cleared the existing Pawn listings.</p>
            <p className="text-zinc-300">
              PawnNexus is still in testing, so issues like this can happen while the system is being updated. The developer will keep a separate database backup from now on to prevent this from happening again.
            </p>
          </div>
        </div>
      </section>

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
            <Link className="inline-flex items-center gap-2 text-zinc-300 hover:text-white" to="/faq">
              FAQ
            </Link>
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

function MobileNavItem({ to, children, onClick }: { to: string; children: ReactNode; onClick: () => void }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `rounded border px-4 py-3 text-sm transition ${
          isActive ? 'border-ember-500/60 bg-ember-500 text-ash-950' : 'border-white/10 bg-ash-850 text-zinc-200 hover:border-ember-500/40 hover:text-white'
        }`
      }
    >
      {children}
    </NavLink>
  );
}
