import { Ban, Check, Shield, Trash2, UserCog, UserX, X } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { api } from '../lib/api';
import type { AdminStats, BannedEmail, Pawn, User } from '../types';

export function Admin({ currentUser }: { currentUser: User }) {
  const isAdmin = currentUser.role === 'admin';
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [pawns, setPawns] = useState<Pawn[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [userPage, setUserPage] = useState(1);
  const [userSearch, setUserSearch] = useState('');
  const [bannedEmails, setBannedEmails] = useState<BannedEmail[]>([]);
  const [banEmail, setBanEmail] = useState('');
  const [banReason, setBanReason] = useState('');
  const [error, setError] = useState('');
  const pageSize = 20;

  async function load(page = userPage, search = userSearch) {
    try {
      const pendingResult = await api.pendingPawns();
      setPawns(pendingResult.pawns);

      if (isAdmin) {
        const [statsResult, usersResult, bannedResult] = await Promise.all([
          api.adminStats(),
          api.adminUsers({ page, pageSize, search }),
          api.bannedEmails(),
        ]);
        setStats(statsResult.stats);
        setUsers(usersResult.users);
        setTotalUsers(usersResult.total);
        setUserPage(usersResult.page);
        setBannedEmails(bannedResult.bannedEmails);
      }

      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load moderation dashboard');
    }
  }

  useEffect(() => {
    void load(1, '');
  }, []);

  async function moderate(id: string, action: 'approve' | 'reject') {
    if (action === 'approve') {
      await api.approvePawn(id);
    } else {
      await api.rejectPawn(id);
    }
    await load();
  }

  async function removePawn(id: string) {
    await api.deletePawn(id);
    await load();
  }

  async function removeUser(id: string) {
    await api.deleteUser(id);
    await load();
  }

  async function updateRole(id: string, role: User['role']) {
    await api.updateUserRole(id, role);
    await load();
  }

  async function submitUserSearch(event: FormEvent) {
    event.preventDefault();
    await load(1, userSearch);
  }

  async function submitBan(event: FormEvent) {
    event.preventDefault();
    await api.banEmail(banEmail, banReason);
    setBanEmail('');
    setBanReason('');
    await load();
  }

  async function unban(email: string) {
    await api.unbanEmail(email);
    await load();
  }

  const totalPages = Math.max(1, Math.ceil(totalUsers / pageSize));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-white">{isAdmin ? 'Admin Dashboard' : 'Moderator Dashboard'}</h1>
        <p className="mt-2 text-zinc-400">
          {isAdmin ? 'Moderate pawns, manage accounts, and block abusive email addresses.' : 'Approve, reject, and delete pending pawns.'}
        </p>
      </div>

      {error ? <p className="alert">{error}</p> : null}

      {isAdmin ? (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Stat label="Accounts" value={stats?.accounts ?? 0} />
          <Stat label="Active" value={stats?.activeAccounts ?? 0} />
          <Stat label="Pending Pawns" value={stats?.pendingPawns ?? pawns.length} />
          <Stat label="Approved Pawns" value={stats?.approvedPawns ?? 0} />
          <Stat label="Banned Emails" value={stats?.bannedEmails ?? 0} />
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold text-white">Pending Pawns</h2>
        {pawns.length === 0 ? <p className="empty">No pending pawns.</p> : null}
        {pawns.map((pawn) => (
          <div key={pawn.id} className="grid gap-4 rounded border border-white/10 bg-ash-900 p-4 md:grid-cols-[120px_1fr_auto] md:items-center">
            <div className="aspect-[4/3] overflow-hidden rounded bg-ash-850">
              {pawn.thumbnailUrl ? <img src={pawn.thumbnailUrl} alt="" className="h-full w-full object-cover" /> : null}
            </div>
            <div>
              <Link className="text-lg font-semibold text-white hover:text-ember-500" to={`/pawns/${pawn.id}`}>
                {pawn.pawnName}
              </Link>
              <p className="text-sm text-zinc-400">
                Lv. {pawn.level} {pawn.vocation} on {pawn.platform} by {pawn.ownerUsername}
              </p>
              <p className="mt-2 line-clamp-2 text-sm text-zinc-300">{pawn.description}</p>
            </div>
            <div className="flex gap-2">
              <button className="icon-button" onClick={() => moderate(pawn.id, 'approve')} aria-label="Approve" title="Approve">
                <Check size={18} />
              </button>
              <button className="button-danger" onClick={() => moderate(pawn.id, 'reject')} aria-label="Reject" title="Reject">
                <X size={18} />
              </button>
              <button className="button-danger" onClick={() => removePawn(pawn.id)} aria-label="Delete" title="Delete">
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </section>

      {isAdmin ? (
        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <h2 className="text-2xl font-semibold text-white">Accounts</h2>
              <form className="flex gap-2" onSubmit={submitUserSearch}>
                <input placeholder="Search username or email" value={userSearch} onChange={(event) => setUserSearch(event.target.value)} />
                <button className="button-secondary">Search</button>
              </form>
            </div>

            <div className="overflow-hidden rounded border border-white/10 bg-ash-900">
              {users.map((account) => (
                <div key={account.id} className="grid gap-3 border-b border-white/10 p-4 last:border-b-0 md:grid-cols-[1fr_auto] md:items-center">
                  <div>
                    <p className="font-semibold text-white">{account.username}</p>
                    <p className="text-sm text-zinc-400">{account.email}</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {account.role} · {account.status} · joined {new Date(account.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {account.role !== 'admin' ? (
                      <button className="button-secondary" onClick={() => updateRole(account.id, 'admin')}>
                        <Shield size={16} /> Admin
                      </button>
                    ) : null}
                    {account.role !== 'moderator' ? (
                      <button className="button-secondary" onClick={() => updateRole(account.id, 'moderator')} disabled={account.id === currentUser.id} title={account.id === currentUser.id ? 'You cannot demote yourself' : 'Make moderator'}>
                        <UserCog size={16} /> Moderator
                      </button>
                    ) : null}
                    {account.role !== 'user' ? (
                      <button className="button-secondary" onClick={() => updateRole(account.id, 'user')} disabled={account.id === currentUser.id} title={account.id === currentUser.id ? 'You cannot demote yourself' : 'Make user'}>
                        <UserCog size={16} /> User
                      </button>
                    ) : null}
                    <button className="button-danger" onClick={() => removeUser(account.id)} disabled={account.id === currentUser.id} aria-label="Delete account" title={account.id === currentUser.id ? 'You cannot delete yourself' : 'Delete account'}>
                      <UserX size={16} /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between gap-3 text-sm text-zinc-400">
              <span>Page {userPage} of {totalPages} · {totalUsers} accounts</span>
              <div className="flex gap-2">
                <button className="button-secondary" disabled={userPage <= 1} onClick={() => load(userPage - 1, userSearch)}>Previous</button>
                <button className="button-secondary" disabled={userPage >= totalPages} onClick={() => load(userPage + 1, userSearch)}>Next</button>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-semibold text-white">Banned Emails</h2>
            <form className="form-panel" onSubmit={submitBan}>
              <label>
                <span>Email</span>
                <input type="email" required value={banEmail} onChange={(event) => setBanEmail(event.target.value)} />
              </label>
              <label>
                <span>Reason</span>
                <input value={banReason} onChange={(event) => setBanReason(event.target.value)} />
              </label>
              <button className="button-danger">
                <Ban size={16} /> Ban Email
              </button>
            </form>

            <div className="space-y-2">
              {bannedEmails.length === 0 ? <p className="empty">No banned emails.</p> : null}
              {bannedEmails.map((item) => (
                <div key={item.email} className="rounded border border-white/10 bg-ash-900 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{item.email}</p>
                      <p className="text-sm text-zinc-400">{item.reason || 'No reason provided'}</p>
                    </div>
                    <button className="button-secondary" onClick={() => unban(item.email)}>
                      Unban
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border border-white/10 bg-ash-900 p-4">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
    </div>
  );
}
