import { Coffee, Github, Heart, QrCode } from 'lucide-react';
import { creator } from '../lib/support';

export function Support() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <section className="space-y-4 border-b border-white/10 pb-8">
        <p className="text-sm uppercase tracking-[0.2em] text-ember-500">Support PawnNexus</p>
        <h1 className="max-w-2xl text-4xl font-semibold text-white md:text-5xl">Help keep the lantern lit.</h1>
        <p className="max-w-2xl text-zinc-400">
          PawnNexus is a small community project maintained by one developer. Donations help cover domain costs, testing time, and future features.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <a
          className="group rounded border border-white/10 bg-ash-900 p-5 transition hover:border-ember-500/50 hover:shadow-glow"
          href={creator.koFiUrl}
          target="_blank"
          rel="noreferrer"
        >
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded border border-ember-500/40 bg-ash-850 text-ember-500">
              <Coffee size={22} />
            </span>
            <div>
              <h2 className="text-xl font-semibold text-white">Ko-fi</h2>
              <p className="text-sm text-zinc-400">Support with an international donation.</p>
            </div>
          </div>
          <p className="mt-5 text-sm font-medium text-ember-500 group-hover:text-ember-600">Open Ko-fi</p>
        </a>

        <div className="rounded border border-white/10 bg-ash-900 p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded border border-ember-500/40 bg-ash-850 text-ember-500">
              <QrCode size={22} />
            </span>
            <div>
              <h2 className="text-xl font-semibold text-white">Pix</h2>
              <p className="text-sm text-zinc-400">Brazilian instant payment.</p>
            </div>
          </div>

          <div className="mt-5 grid aspect-square max-w-72 place-items-center rounded border border-dashed border-white/20 bg-ash-850 p-6 text-center text-sm text-zinc-400">
            {creator.pixQrCodeUrl ? (
              <img src={creator.pixQrCodeUrl} alt="Pix QR Code" className="h-full w-full object-contain" />
            ) : (
              <div className="space-y-3">
                <QrCode className="mx-auto text-zinc-500" size={46} />
                <p>Pix QR code not configured yet.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="rounded border border-white/10 bg-ash-900 p-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded border border-white/10 bg-ash-850 text-ember-500">
            <Heart size={20} />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-white">Made by {creator.name}</h2>
            <a className="mt-1 inline-flex items-center gap-2 text-sm text-ember-500 hover:text-ember-600" href={creator.githubUrl} target="_blank" rel="noreferrer">
              <Github size={16} /> GitHub
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
