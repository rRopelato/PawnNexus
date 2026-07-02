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

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded border border-ember-500/25 bg-ember-500/10 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded border border-ember-500/40 bg-ash-850 text-ember-500">
                <Swords size={22} />
              </span>
              <div>
                <h2 className="text-xl font-semibold text-white">Hire Isaac</h2>
                <p className="mt-1 text-sm text-zinc-300">
                  A free way to help is taking my Pawn for a run in Dragon's Dogma 2.
                </p>
              </div>
            </div>
            <a className="button-secondary" href={creator.steamUrl} target="_blank" rel="noreferrer">
              Steam profile
            </a>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded border border-white/10 bg-ash-900 p-4">
              <p className="text-sm text-zinc-500">Pawn</p>
              <p className="mt-1 text-lg font-semibold text-white">{creator.pawnName}</p>
            </div>
            <div className="rounded border border-white/10 bg-ash-900 p-4">
              <p className="text-sm text-zinc-500">Pawn ID</p>
              <div className="mt-1 flex items-center justify-between gap-3">
                <p className="font-mono text-lg font-semibold text-white">{creator.pawnId}</p>
                <button className="icon-button" type="button" onClick={copyPawnId} aria-label="Copy Pawn ID" title="Copy Pawn ID">
                  <Copy size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded border border-white/10 bg-ash-900 p-5">
          <div className="flex gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded border border-white/10 bg-ash-850 text-ember-500">
              <Heart size={22} />
            </span>
            <div>
              <h2 className="text-xl font-semibold text-white">Made by {creator.name}</h2>
              <p className="mt-1 text-sm text-zinc-400">
                I build PawnNexus as a lightweight Cloudflare project for portfolio, learning, and the DD2 community.
              </p>
              <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                <a className="inline-flex items-center gap-2 text-ember-500 hover:text-ember-600" href={creator.githubUrl} target="_blank" rel="noreferrer">
                  <Github size={16} /> GitHub
                </a>
                <a className="inline-flex items-center gap-2 text-ember-500 hover:text-ember-600" href={creator.linkedInUrl} target="_blank" rel="noreferrer">
                  <Linkedin size={16} /> LinkedIn
                </a>
                <a className="inline-flex items-center gap-2 text-ember-500 hover:text-ember-600" href={creator.portfolioUrl} target="_blank" rel="noreferrer">
                  <Globe size={16} /> Portfolio
                </a>
                <span className="inline-flex items-center gap-2 text-zinc-300">
                  <MessageCircle size={16} /> Discord: {creator.discordUsername}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
        <a
          className="group rounded border border-white/10 bg-ash-900 p-5 transition hover:border-ember-500/50 hover:shadow-glow"
          href={creator.koFiUrl}
          target="_blank"
          rel="noreferrer"
        >
          <div className="flex gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded border border-ember-500/40 bg-ash-850 text-ember-500">
              <Coffee size={22} />
            </span>
            <div>
              <h2 className="text-xl font-semibold text-white">Ko-fi</h2>
              <p className="mt-1 text-sm text-zinc-400">International donations for people outside Brazil.</p>
              <p className="mt-4 text-sm font-medium text-ember-500 group-hover:text-ember-600">Open Ko-fi</p>
            </div>
          </div>
        </a>

        <div className="rounded border border-white/10 bg-ash-900 p-5">
          <div className="grid gap-5 sm:grid-cols-[auto_1fr] sm:items-center">
            <div className="grid h-52 w-52 place-items-center rounded border border-dashed border-white/20 bg-white p-3">
              {creator.pixQrCodeUrl ? (
                <img src={creator.pixQrCodeUrl} alt="Pix QR Code" className="h-full w-full object-contain" />
              ) : (
                <QrCode className="text-zinc-500" size={46} />
              )}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded border border-ember-500/40 bg-ash-850 text-ember-500">
                  <QrCode size={22} />
                </span>
                <div>
                  <h2 className="text-xl font-semibold text-white">Pix</h2>
                  <p className="text-sm text-zinc-400">Brazilian instant payment.</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-zinc-400">
                Scan the QR code with your banking app. Any amount helps keep the project online while it is in testing.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded border border-white/10 bg-ash-900 p-5">
        <div className="flex gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded border border-white/10 bg-ash-850 text-ember-500">
            <Shield size={20} />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-white">No pressure</h2>
            <p className="mt-1 text-sm text-zinc-400">
              PawnNexus is free to use. Sharing the site, reporting bugs, and using Isaac are also meaningful ways to support it.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
