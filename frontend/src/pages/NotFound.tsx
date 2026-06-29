import { Link } from 'react-router';

export function NotFound() {
  return (
    <div className="mx-auto max-w-lg py-20 text-center">
      <h1 className="text-5xl font-semibold text-white">404</h1>
      <p className="mt-4 text-zinc-400">This path has not been charted.</p>
      <Link className="button-primary mt-6 inline-flex" to="/">
        Back to Browse
      </Link>
    </div>
  );
}
