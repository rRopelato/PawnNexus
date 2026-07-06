import type { ReactNode } from 'react';

export function LoadingBlock({ label = 'Loading...', rows = 3 }: { label?: string; rows?: number }) {
  return (
    <section className="rounded border border-white/10 bg-ash-900 p-5" aria-busy="true" aria-live="polite">
      <p className="text-sm text-zinc-400">{label}</p>
      <div className="mt-4 grid gap-3">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="h-4 rounded bg-white/5" />
        ))}
      </div>
    </section>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <section className="empty space-y-2">
      <p className="text-white">{title}</p>
      {children ? <div className="text-sm text-zinc-500">{children}</div> : null}
    </section>
  );
}
