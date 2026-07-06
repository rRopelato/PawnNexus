const absoluteFormatter = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

const relativeFormatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ['year', 365 * 24 * 60 * 60 * 1000],
  ['month', 30 * 24 * 60 * 60 * 1000],
  ['week', 7 * 24 * 60 * 60 * 1000],
  ['day', 24 * 60 * 60 * 1000],
  ['hour', 60 * 60 * 1000],
  ['minute', 60 * 1000],
];

export function formatDate(value: string | null | undefined) {
  const date = parseDate(value);
  return date ? absoluteFormatter.format(date) : 'Unknown';
}

export function relativeDate(value: string | null | undefined) {
  const date = parseDate(value);
  if (!date) return 'Unknown';

  const delta = date.getTime() - Date.now();
  const abs = Math.abs(delta);
  const unit = units.find(([, size]) => abs >= size);
  if (!unit) return 'just now';

  const [name, size] = unit;
  return relativeFormatter.format(Math.round(delta / size), name);
}

function parseDate(value: string | null | undefined) {
  if (!value) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp) : null;
}
