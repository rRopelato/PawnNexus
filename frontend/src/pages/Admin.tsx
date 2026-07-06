import { Ban, BadgeCheck, Check, Clock, MailX, Search, Shield, ShieldCheck, Trash2, UserCog, Users, UserX, X } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { api } from '../lib/api';
import type { AdminStats, BannedEmail, Pawn, User } from '../types';

type AdminSection = 'overview' | 'accounts' | 'pending' | 'approved' | 'moderation' | 'banned';

type PawnListState = {
  pawns: Pawn[];
  page: number;
  total: number;
  search: string;
};

const pawnPageSize = 10;
const userPageSize = 20;

export function Admin({ currentUser }: { currentUser: User }) {
  const isAdmin = currentUser.role === 'admin';
  const [activeSection, setActiveSection] = useState<AdminSection>('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [pending, setPending] = useState<PawnListState>({ pawns: [], page: 1, total: 0, search: '' });
  const [approved, setApproved] = useState<PawnListState>({ pawns: [], page: 1, total: 0, search: '' });
  const [users, setUsers] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [userPage, setUserPage] = useState(1);
  const [userSearch, setUserSearch] = useState('');
  const [bannedEmails, setBannedEmails] = useState<BannedEmail[]>([]);
  const [banEmail, setBanEmail] = useState('');
  const [banReason, setBanReason] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const sections = useMemo(
    () => [
      { id: 'overview' as const, label: 'Overview', adminOnly: false },
      { id: 'accounts' as const, label: 'Accounts', adminOnly: true },
      { id: 'pending' as const, label: 'Pending Pawns', adminOnly: false },
      { id: 'approved' as const, label: 'Approved Pawns', adminOnly: false },
      { id: 'moderation' as const, label: 'Moderation', adminOnly: false },
      { id: 'banned' as const, label: 'Banned Emails', adminOnly: true },
    ].filter((section) => isAdmin || !section.adminOnly),
    [isAdmin],
  );

  async function loadOverview() {
    const [pendingResult, approvedResult] = await Promise.all([
      api.adminPawns({ status: 'pending', page: pending.page, pageSize: pawnPageSize, search: pending.search }),
      api.adminPawns({ status: 'approved', page: approved.page, pageSize: pawnPageSize, search: approved.search }),
    ]);

    setPending((current) => ({ ...current, pawns: pendingResult.pawns, page: pendingResult.page, total: pendingResult.total }));
    setApproved((current) => ({ ...current, pawns: approvedResult.pawns, page: approvedResult.page, total: approvedResult.total }));
  }

  async function loadAdminData(page = userPage, search = userSearch) {
    if (!isAdmin) return;

    const [statsResult, usersResult, bannedResult] = await Promise.all([
      api.adminStats(),
      api.adminUsers({ page, pageSize: userPageSize, search }),
      api.bannedEmails(),
    ]);

    setStats(statsResult.stats);
    setUsers(usersResult.users);
    setTotalUsers(usersResult.total);
    setUserPage(usersResult.page);
    setBannedEmails(bannedResult.bannedEmails);
  }

  async function load(page = userPage, search = userSearch) {
    try {
      await Promise.all([loadOverview(), loadAdminData(page, search)]);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load moderation dashboard');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load(1, '');
  }, []);

  async function loadPawnList(status: Pawn['status'], page: number, search: string) {
    const result = await api.adminPawns({ status, page, pageSize: pawnPageSize, search });
    const update = { pawns: result.pawns, page: result.page, total: result.total, search };
    if (status === 'pending') setPending(update);
    if (status === 'approved') setApproved(update);
  }

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
    await loadAdminData(1, userSearch);
  }

  async function submitPawnSearch(event: FormEvent, status: Pawn['status'], search: string) {
    event.preventDefault();
    await loadPawnList(status, 1, search);
  }

  async function submitBan(event: FormEvent) {
    event.preventDefault();
    await api.banEmail(banEmail, banReason);
    setBanEmail('');
    setBanReason('');
    await loadAdminData(userPage, userSearch);
  }

  async function unban(email: string) {
    await api.unbanEmail(email);
    await loadAdminData(userPage, userSearch);
  }

  const totalUserPages = Math.max(1, Math.ceil(totalUsers / userPageSize));
  const pendingPages = Math.max(1, Math.ceil(pending.total / pawnPageSize));
  const approvedPages = Math.max(1, Math.ceil(approved.total / pawnPageSize));

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 border-b border-white/10 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-ember-500">Control Room</p>
          <h1 className="mt-3 text-3xl font-semibold text-white">{isAdmin ? 'Admin Dashboard' : 'Moderator Dashboard'}</h1>
          <p className="mt-2 max-w-2xl text-zinc-400">
            {isAdmin ? 'Moderate Pawns, manage accounts, review approved listings, and block abusive email addresses.' : 'Approve, reject, and delete Pawns that need moderation.'}
          </p>
        </div>
        <button className="button-secondary w-full justify-center lg:w-auto" type="button" onClick={() => load()} disabled={loading}>
          Refresh dashboard
        </button>
      </div>

      {error ? <p className="alert">{error}</p> : null}

      <nav className="flex flex-wrap gap-2" aria-label="Admin sections">
        {sections.map((section) => (
          <button
            key={section.id}
            className={activeSection === section.id ? 'button-primary' : 'button-secondary'}
            type="button"
            onClick={() => setActiveSection(section.id)}
          >
            {section.label}
          </button>
        ))}
      </nav>

      {activeSection === 'overview' ? (
        <section className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
            {isAdmin ? <Stat icon={<Users size={18} />} label="Accounts" value={stats?.accounts ?? 0} /> : null}
            {isAdmin ? <Stat icon={<ShieldCheck size={18} />} label="Admins" value={stats?.admins ?? 0} /> : null}
            {isAdmin ? <Stat icon={<UserCog size={18} />} label="Moderators" value={stats?.moderators ?? 0} /> : null}
            <Stat icon={<Clock size={18} />} label="Pending Pawns" value={stats?.pendingPawns ?? pending.total} />
            <Stat icon={<BadgeCheck size={18} />} label="Approved Pawns" value={stats?.approvedPawns ?? approved.total} />
            {isAdmin ? <Stat icon={<MailX size={18} />} label="Banned Emails" value={stats?.bannedEmails ?? 0} /> : null}
          </div>

          <section className="grid gap-4 lg:grid-cols-2">
            <OverviewPanel title="Pending queue" count={pending.total} description="Pawns waiting for a moderator decision." onOpen={() => setActiveSection('pending')} />
            <OverviewPanel title="Approved listings" count={approved.total} description="Public Pawns currently visible or manageable." onOpen={() => setActiveSection('approved')} />
            {isAdmin ? <OverviewPanel title="Accounts" count={totalUsers} description="Search users, promote moderators, ban emails, or delete abusive accounts." onOpen={() => setActiveSection('accounts')} /> : null}
            {isAdmin ? <OverviewPanel title="Banned emails" count={bannedEmails.length} description="Recently blocked email addresses and moderation notes." onOpen={() => setActiveSection('banned')} /> : null}
          </section>
        </section>
      ) : null}

      {activeSection === 'accounts' && isAdmin ? (
        <section className="space-y-4">
          <SectionHeader title="Accounts" description="Search accounts, manage roles, and remove abusive users." />
          <form className="grid gap-2 rounded border border-white/10 bg-ash-900 p-4 sm:grid-cols-[1fr_auto]" onSubmit={submitUserSearch}>
            <label className="sr-only" htmlFor="admin-user-search">Search accounts</label>
            <input id="admin-user-search" placeholder="Search username or email" value={userSearch} onChange={(event) => setUserSearch(event.target.value)} />
            <button className="button-secondary" type="submit"><Search size={16} /> Search</button>
          </form>

          <div className="overflow-hidden rounded border border-white/10 bg-ash-900">
            {users.length === 0 ? <p className="p-4 text-sm text-zinc-400">No accounts found.</p> : null}
            {users.map((account) => (
              <div key={account.id} className="grid gap-3 border-b border-white/10 p-4 last:border-b-0 xl:grid-cols-[1fr_auto] xl:items-center">
                <div className="min-w-0">
                  <p className="font-semibold text-white">{account.username}</p>
                  <p className="break-all text-sm text-zinc-400">{account.email}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {account.role} / {account.status} / joined {new Date(account.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {account.role !== 'admin' ? <RoleButton onClick={() => updateRole(account.id, 'admin')} icon={<Shield size={16} />} label="Admin" /> : null}
                  {account.role !== 'moderator' ? <RoleButton onClick={() => updateRole(account.id, 'moderator')} icon={<UserCog size={16} />} label="Moderator" disabled={account.id === currentUser.id} /> : null}
                  {account.role !== 'user' ? <RoleButton onClick={() => updateRole(account.id, 'user')} icon={<UserCog size={16} />} label="User" disabled={account.id === currentUser.id} /> : null}
                  <button className="button-danger" type="button" onClick={() => removeUser(account.id)} disabled={account.id === currentUser.id} title={account.id === currentUser.id ? 'You cannot delete yourself' : 'Delete account'}>
                    <UserX size={16} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          <Pagination page={userPage} totalPages={totalUserPages} total={totalUsers} label="accounts" onPrevious={() => loadAdminData(userPage - 1, userSearch)} onNext={() => loadAdminData(userPage + 1, userSearch)} />
        </section>
      ) : null}

      {activeSection === 'pending' ? (
        <PawnSection
          title="Pending Pawns"
          description="Approve, reject, or delete Pawns waiting for review."
          state={pending}
          totalPages={pendingPages}
          status="pending"
          onSearch={submitPawnSearch}
          onSearchChange={(search) => setPending((current) => ({ ...current, search }))}
          onPage={(page) => loadPawnList('pending', page, pending.search)}
          onApprove={(id) => moderate(id, 'approve')}
          onReject={(id) => moderate(id, 'reject')}
          onDelete={removePawn}
        />
      ) : null}

      {activeSection === 'approved' ? (
        <PawnSection
          title="Approved Pawns"
          description="Review public listings and remove anything that should no longer stay visible."
          state={approved}
          totalPages={approvedPages}
          status="approved"
          onSearch={submitPawnSearch}
          onSearchChange={(search) => setApproved((current) => ({ ...current, search }))}
          onPage={(page) => loadPawnList('approved', page, approved.search)}
          onReject={(id) => moderate(id, 'reject')}
          onDelete={removePawn}
        />
      ) : null}

      {activeSection === 'moderation' ? (
        <section className="space-y-4">
          <SectionHeader title="Moderation" description="Quick view of the queue and common moderation actions." />
          <div className="grid gap-4 lg:grid-cols-3">
            <ModerationCard title="Pending queue" value={pending.total} action="Open pending" onClick={() => setActiveSection('pending')} />
            <ModerationCard title="Approved listings" value={approved.total} action="Review approved" onClick={() => setActiveSection('approved')} />
            {isAdmin ? <ModerationCard title="Banned emails" value={bannedEmails.length} action="Manage bans" onClick={() => setActiveSection('banned')} /> : null}
          </div>
          <div className="rounded border border-dashed border-white/15 bg-ash-900 p-5 text-sm text-zinc-400">
            Moderators can approve, reject, and delete Pawns. Administrators can additionally manage accounts, roles, and banned emails.
          </div>
        </section>
      ) : null}

      {activeSection === 'banned' && isAdmin ? (
        <section className="space-y-4">
          <SectionHeader title="Banned Emails" description="Block email addresses used for spam, abuse, or ban evasion." />
          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <form className="form-panel" onSubmit={submitBan}>
              <label>
                <span>Email</span>
                <input type="email" required value={banEmail} onChange={(event) => setBanEmail(event.target.value)} />
              </label>
              <label>
                <span>Reason</span>
                <input value={banReason} onChange={(event) => setBanReason(event.target.value)} />
              </label>
              <button className="button-danger" type="submit">
                <Ban size={16} /> Ban Email
              </button>
            </form>

            <div className="space-y-2">
              {bannedEmails.length === 0 ? <p className="empty">No banned emails.</p> : null}
              {bannedEmails.map((item) => (
                <div key={item.email} className="rounded border border-white/10 bg-ash-900 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="break-all font-semibold text-white">{item.email}</p>
                      <p className="text-sm text-zinc-400">{item.reason || 'No reason provided'}</p>
                    </div>
                    <button className="button-secondary" type="button" onClick={() => unban(item.email)}>Unban</button>
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

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-white">{title}</h2>
      <p className="mt-1 text-sm text-zinc-400">{description}</p>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <article className="rounded border border-white/10 bg-ash-900 p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-grid h-9 w-9 place-items-center rounded border border-ember-500/25 bg-ember-500/10 text-ember-500">{icon}</span>
        <strong className="text-2xl font-semibold text-white">{value}</strong>
      </div>
      <p className="mt-3 text-sm text-zinc-400">{label}</p>
    </article>
  );
}

function OverviewPanel({ title, count, description, onOpen }: { title: string; count: number; description: string; onOpen: () => void }) {
  return (
    <article className="rounded border border-white/10 bg-ash-900 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <p className="mt-1 text-sm text-zinc-400">{description}</p>
        </div>
        <span className="rounded border border-ember-500/30 bg-ember-500/10 px-3 py-1 text-lg font-semibold text-ember-500">{count}</span>
      </div>
      <button className="button-secondary mt-5" type="button" onClick={onOpen}>Open section</button>
    </article>
  );
}

function PawnSection({
  title,
  description,
  state,
  totalPages,
  status,
  onSearch,
  onSearchChange,
  onPage,
  onApprove,
  onReject,
  onDelete,
}: {
  title: string;
  description: string;
  state: PawnListState;
  totalPages: number;
  status: Pawn['status'];
  onSearch: (event: FormEvent, status: Pawn['status'], search: string) => void;
  onSearchChange: (search: string) => void;
  onPage: (page: number) => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <section className="space-y-4">
      <SectionHeader title={title} description={description} />
      <form className="grid gap-2 rounded border border-white/10 bg-ash-900 p-4 sm:grid-cols-[1fr_auto]" onSubmit={(event) => onSearch(event, status, state.search)}>
        <label className="sr-only" htmlFor={status + '-pawn-search'}>Search Pawns</label>
        <input id={status + '-pawn-search'} placeholder="Search pawn, arisen, Pawn ID, or owner" value={state.search} onChange={(event) => onSearchChange(event.target.value)} />
        <button className="button-secondary" type="submit"><Search size={16} /> Search</button>
      </form>

      {state.pawns.length === 0 ? <p className="empty">No {status} pawns found.</p> : null}
      <div className="space-y-3">
        {state.pawns.map((pawn) => (
          <PawnAdminRow key={pawn.id} pawn={pawn} onApprove={onApprove} onReject={onReject} onDelete={onDelete} />
        ))}
      </div>

      <Pagination page={state.page} totalPages={totalPages} total={state.total} label="pawns" onPrevious={() => onPage(state.page - 1)} onNext={() => onPage(state.page + 1)} />
    </section>
  );
}

function PawnAdminRow({ pawn, onApprove, onReject, onDelete }: { pawn: Pawn; onApprove?: (id: string) => void; onReject?: (id: string) => void; onDelete: (id: string) => void }) {
  return (
    <article className="grid gap-4 rounded border border-white/10 bg-ash-900 p-4 md:grid-cols-[120px_1fr_auto] md:items-center">
      <div className="aspect-[4/3] overflow-hidden rounded bg-ash-850">
        {pawn.thumbnailUrl ? <img src={pawn.thumbnailUrl} alt="" loading="lazy" className="h-full w-full object-cover" /> : null}
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Link className="text-lg font-semibold text-white hover:text-ember-500" to={`/pawns/${pawn.id}`}>{pawn.pawnName}</Link>
          <span className="tag">{pawn.status}</span>
          <span className="tag">{pawn.activityStars}/3 activity</span>
        </div>
        <p className="mt-1 text-sm text-zinc-400">
          Lv. {pawn.level} {pawn.vocation} on {pawn.platform} by {pawn.ownerUsername}
        </p>
        <p className="mt-2 line-clamp-2 text-sm text-zinc-300">{pawn.description}</p>
      </div>
      <div className="flex flex-wrap gap-2 md:justify-end">
        {onApprove ? <button className="icon-button" type="button" onClick={() => onApprove(pawn.id)} aria-label="Approve" title="Approve"><Check size={18} /></button> : null}
        {onReject ? <button className="button-danger" type="button" onClick={() => onReject(pawn.id)} aria-label="Reject" title="Reject"><X size={18} /></button> : null}
        <button className="button-danger" type="button" onClick={() => onDelete(pawn.id)} aria-label="Delete" title="Delete"><Trash2 size={18} /></button>
      </div>
    </article>
  );
}

function Pagination({ page, totalPages, total, label, onPrevious, onNext }: { page: number; totalPages: number; total: number; label: string; onPrevious: () => void; onNext: () => void }) {
  return (
    <div className="flex flex-col gap-3 text-sm text-zinc-400 sm:flex-row sm:items-center sm:justify-between">
      <span>Page {page} of {totalPages} / {total} {label}</span>
      <div className="flex gap-2">
        <button className="button-secondary" type="button" disabled={page <= 1} onClick={onPrevious}>Previous</button>
        <button className="button-secondary" type="button" disabled={page >= totalPages} onClick={onNext}>Next</button>
      </div>
    </div>
  );
}

function RoleButton({ icon, label, disabled, onClick }: { icon: React.ReactNode; label: string; disabled?: boolean; onClick: () => void }) {
  return (
    <button className="button-secondary" type="button" onClick={onClick} disabled={disabled} title={disabled ? 'You cannot change your own role here' : label}>
      {icon} {label}
    </button>
  );
}

function ModerationCard({ title, value, action, onClick }: { title: string; value: number; action: string; onClick: () => void }) {
  return (
    <article className="rounded border border-white/10 bg-ash-900 p-5">
      <p className="text-sm text-zinc-400">{title}</p>
      <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
      <button className="button-secondary mt-4" type="button" onClick={onClick}>{action}</button>
    </article>
  );
}
