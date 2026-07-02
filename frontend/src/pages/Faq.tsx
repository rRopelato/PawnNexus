import { Github, Heart, Mail, Shield, Sparkles, Upload, UserCheck } from 'lucide-react';
import { Link } from 'react-router';
import { creator } from '../lib/support';

const faqSections = [
  {
    title: 'About PawnNexus',
    icon: Sparkles,
    items: [
      {
        question: 'What is PawnNexus?',
        answer:
          `PawnNexus is a community website for sharing Dragon's Dogma 2 Pawns. You can browse approved Pawns, search by basic filters, and submit your own Pawn for other players to find.`,
      },
      {
        question: 'Is this an official Capcom project?',
        answer:
          'No. PawnNexus is an independent fan and portfolio project. It is inspired by PawnGuild.xyz, but it is not affiliated with Capcom and does not use official game assets.',
      },
      {
        question: 'Why does the site say it is in testing?',
        answer:
          'The project is still evolving. Features, database structure, and moderation tools may change while the MVP is being tested. The goal is to keep it simple, fast, and safe before adding larger community features.',
      },
    ],
  },
  {
    title: 'Using the Site',
    icon: UserCheck,
    items: [
      {
        question: 'How do I add a Pawn?',
        answer:
          'Create an account, verify your email, open Add Pawn, fill in the Pawn details, upload images, and submit. New Pawns enter moderation before appearing publicly.',
      },
      {
        question: 'Why is my Pawn pending?',
        answer:
          'Every new or edited Pawn is reviewed first. This helps avoid spam, broken images, offensive submissions, and fake listings.',
      },
      {
        question: 'Why do I need to refresh my Pawn?',
        answer:
          'Pawn activity is based on weekly refreshes. Pawns start at 3 stars. If you do not refresh a Pawn each week, it loses activity. At 1 star it stops appearing in public browsing, but it can still be seen on your profile.',
      },
      {
        question: 'What if I do not want to show my platform ID?',
        answer:
          'Steam, PSN, Xbox Gamertag, and Nintendo Switch 2 friend ID are optional. If you leave one empty, public pages show Not filled instead of exposing private information.',
      },
    ],
  },
  {
    title: 'Images and Performance',
    icon: Upload,
    items: [
      {
        question: 'How many images can each Pawn have?',
        answer:
          'Each Pawn can have up to 5 images. Browse pages load only the thumbnail, while the Pawn details page loads the full carousel on demand.',
      },
      {
        question: 'What image formats are accepted?',
        answer:
          'Uploads accept JPG, JPEG, PNG, and WebP up to 5 MB each. Images are processed into optimized WebP when possible, with JPEG fallback for mobile browsers that cannot export WebP reliably.',
      },
      {
        question: 'Why does the first image matter?',
        answer:
          'The first image is used as the main thumbnail in Browse. You can reorder images while editing or adding a Pawn.',
      },
    ],
  },
  {
    title: 'Account and Safety',
    icon: Shield,
    items: [
      {
        question: 'Why do I need to verify my email?',
        answer:
          'Email verification helps reduce spam and account abuse. Unverified users can log in and browse, but cannot add Pawns, upload images, refresh listings, or use moderation tools.',
      },
      {
        question: 'Can users see my email?',
        answer:
          'No. Public pages use your username. Email is used for login, verification, password reset, and admin safety tools.',
      },
      {
        question: 'How does password reset work?',
        answer:
          'Password reset links are sent by email and expire after 1 hour. PawnNexus stores only a hash of reset tokens, never the raw token.',
      },
      {
        question: 'Who can approve or remove Pawns?',
        answer:
          'Moderators can approve, reject, and delete Pawn submissions. Administrators can also manage accounts, roles, bans, and moderation settings.',
      },
    ],
  },
];

export function Faq() {
  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <section className="space-y-4 border-b border-white/10 pb-8">
        <p className="text-sm uppercase tracking-[0.2em] text-ember-500">FAQ</p>
        <h1 className="max-w-3xl text-4xl font-semibold text-white md:text-5xl">How PawnNexus works</h1>
        <p className="max-w-3xl text-zinc-400">
          Quick answers about the project, moderation, accounts, images, privacy, and how to reach the developer.
        </p>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        {faqSections.map((section) => {
          const Icon = section.icon;
          return (
            <section key={section.title} className="rounded border border-white/10 bg-ash-900 p-5">
              <div className="mb-5 flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded border border-ember-500/40 bg-ash-850 text-ember-500">
                  <Icon size={20} />
                </span>
                <h2 className="text-xl font-semibold text-white">{section.title}</h2>
              </div>
              <div className="divide-y divide-white/10">
                {section.items.map((item) => (
                  <details key={item.question} className="group py-4 first:pt-0 last:pb-0">
                    <summary className="cursor-pointer list-none text-sm font-semibold text-zinc-100 transition group-open:text-ember-500">
                      <span className="inline-flex w-full items-center justify-between gap-4">
                        {item.question}
                        <span className="text-ember-500 transition group-open:rotate-45">+</span>
                      </span>
                    </summary>
                    <p className="mt-3 text-sm leading-6 text-zinc-400">{item.answer}</p>
                  </details>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded border border-white/10 bg-ash-900 p-5">
          <div className="flex gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded border border-white/10 bg-ash-850 text-ember-500">
              <Github size={20} />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-white">Who made this?</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                PawnNexus is made by {creator.name}, a developer building this project as a portfolio piece and a useful DD2 community tool.
              </p>
              <a className="mt-4 inline-flex items-center gap-2 text-sm text-ember-500 hover:text-ember-600" href={creator.githubUrl} target="_blank" rel="noreferrer">
                Contact on GitHub
              </a>
            </div>
          </div>
        </div>

        <div className="rounded border border-ember-500/25 bg-ember-500/10 p-5">
          <div className="flex gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded border border-ember-500/40 bg-ash-850 text-ember-500">
              <Heart size={20} />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-white">How can I help?</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-300">
                Share the site, report bugs, support the project, or hire my Pawn {creator.pawnName}. Pawn ID: <span className="font-mono text-white">{creator.pawnId}</span>.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link className="button-primary" to="/support">Support page</Link>
                <a className="button-secondary" href={creator.steamUrl} target="_blank" rel="noreferrer">Steam profile</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded border border-white/10 bg-ash-900 p-5">
        <div className="flex gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded border border-white/10 bg-ash-850 text-ember-500">
            <Mail size={20} />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-white">Contact</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              The best contact path for now is GitHub. Open an issue, send feedback through the repository, or reach me through my profile.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
