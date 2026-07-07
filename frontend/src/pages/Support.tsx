import { Coffee, Copy, Github, Globe, Heart, Linkedin, MessageCircle, QrCode, Shield, Swords } from 'lucide-react';
import { creator } from '../lib/support';

export function Support() {
  async function copyPawnId() {
    await navigator.clipboard?.writeText(creator.pawnId).catch(() => undefined);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <section className="space-y-4 border-b border-white/10 pb-8">
        <p className="text-sm uppercase tracking-[0.2em] text-ember-500">Support PawnNexus</p>
        <h1 className="max-w-3xl text-4xl font-semibold text-white md:text-5xl">Help keep the lantern lit.</h1>
        <p className="max-w-3xl text-zinc-400">
          PawnNexus is a portfolio and community project maintained by one developer. Support helps with domain costs, testing time, and future features.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <div className="rounded border border-ember-500/25 bg-ember-500/10 p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded border border-ember-500/40 bg-ash-850 text-ember-500">
                <Swords size={20} />
              </span>
              <div>
                <h2 className="text-xl font-semibold text-white">Use my Pawn Isaac</h2>
                <p className="mt-1 text-sm text-zinc-300">
                  A free way to help is taking Isaac for a run in Dragon's Dogma 2.
                </p>
              </div>
            </div>
            <a className="button-secondary shrink-0" href={creator.steamUrl} target="_blank" rel="noreferrer">
              Steam profile
            </a>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-[0.8fr_1.2fr]">
            <InfoBox label="Pawn" value={creator.pawnName} href="https://pawnnexus.com/pawns/3bb93d31-55d0-4753-a973-7d1fe4f6c19f" />
            <div className="rounded border border-white/10 bg-ash-900 p-3">
              <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Pawn ID</p>
              <div className="mt-1 flex items-center justify-between gap-3">
                <p className="break-all font-mono text-base font-semibold text-white">{creator.pawnId}</p>
                <button className="icon-button h-9 w-9" type="button" onClick={copyPawnId} aria-label="Copy Pawn ID" title="Copy Pawn ID">
                  <Copy size={15} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded border border-white/10 bg-ash-900 p-4">
          <div className="flex gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded border border-white/10 bg-ash-850 text-ember-500">
              <Heart size={20} />
            </span>
            <div>
              <h2 className="text-xl font-semibold text-white">Made by {creator.name}</h2>
              <p className="mt-1 text-sm leading-6 text-zinc-400">
                I build PawnNexus as a lightweight Cloudflare project for portfolio, learning, and the DD2 community.
              </p>
              <ContactLinks />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <a
          className="group rounded border border-white/10 bg-ash-900 p-4 transition hover:border-ember-500/50"
          href={creator.koFiUrl}
          target="_blank"
          rel="noreferrer"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded border border-ember-500/40 bg-ash-850 text-ember-500">
                <Coffee size={20} />
              </span>
              <div>
                <h2 className="text-xl font-semibold text-white">Ko-fi</h2>
                <p className="mt-1 text-sm leading-6 text-zinc-400">International donations for people outside Brazil.</p>
                <p className="mt-4 text-sm font-medium text-ember-500 group-hover:text-ember-600">Open Ko-fi</p>
              </div>
            </div>
          </div>
        </a>

        <div className="rounded border border-white/10 bg-ash-900 p-4">
          <div className="grid gap-5 md:grid-cols-[240px_1fr] md:items-center">
            <div className="grid h-60 w-60 max-w-full place-items-center justify-self-center rounded border border-white/10 bg-white p-3">
              {creator.pixQrCodeUrl ? (
                <img src={creator.pixQrCodeUrl} alt="Pix QR Code" className="h-full w-full object-contain" />
              ) : (
                <QrCode className="text-zinc-500" size={48} />
              )}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded border border-ember-500/40 bg-ash-850 text-ember-500">
                  <QrCode size={20} />
                </span>
                <div>
                  <h2 className="text-xl font-semibold text-white">Pix</h2>
                  <p className="text-sm text-zinc-400">Brazilian instant payment.</p>
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-zinc-400">
                Scan the QR code with your banking app. Any amount helps keep the project online while it is in testing.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded border border-white/10 bg-ash-900 p-4">
        <div className="flex gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded border border-white/10 bg-ash-850 text-ember-500">
            <Shield size={20} />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-white">No pressure</h2>
            <p className="mt-1 text-sm leading-6 text-zinc-400">
              PawnNexus is free to use. Sharing the site, reporting bugs, and using Isaac are also meaningful ways to support it.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function InfoBox({ label, value, href }: { label: string; value: string; href?: string }) {
  const content = (
    <>
      <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">{label}</p>
      <p className="mt-1 text-base font-semibold text-white">{value}</p>
    </>
  );

  if (href) {
    return (
      <a className="rounded border border-white/10 bg-ash-900 p-3 transition hover:border-ember-500/50 hover:bg-ash-850" href={href}>
        {content}
      </a>
    );
  }

  return <div className="rounded border border-white/10 bg-ash-900 p-3">{content}</div>;
}

function ContactLinks() {
  return (
    <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
      <a className="inline-flex items-center gap-2 text-ember-500 hover:text-ember-600" href={creator.githubUrl} target="_blank" rel="noreferrer">
        <Github size={15} /> GitHub
      </a>
      <a className="inline-flex items-center gap-2 text-ember-500 hover:text-ember-600" href={creator.linkedInUrl} target="_blank" rel="noreferrer">
        <Linkedin size={15} /> LinkedIn
      </a>
      <a className="inline-flex items-center gap-2 text-ember-500 hover:text-ember-600" href={creator.portfolioUrl} target="_blank" rel="noreferrer">
        <Globe size={15} /> Portfolio
      </a>
      <span className="inline-flex items-center gap-2 text-zinc-300">
        <MessageCircle size={15} /> Discord: {creator.discordUsername}
      </span>
    </div>
  );
}
