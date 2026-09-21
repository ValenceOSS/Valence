import { formatCalendarDate } from '@ValenceCore/functions/formatCalendarDate';
import { formatMoney } from '@ValenceCore/functions/formatMoney';
import type { TitleDetailsProps } from './TitleDetails.types';

/**
 * The facts of a title beyond what a card carries: when it came out, whether it is out or still
 * being made, what it cost and what it took. Each appears only where the catalogue knew it, and the
 * whole thing not at all where it knew none of them, so a title it knew little about is not given a
 * row of dashes.
 *
 * @param releaseDate - The day it came out, or an episode aired, as a calendar date.
 * @param status - Where the catalogue says it stands, such as "Released".
 * @param budget - What it cost to make, in dollars.
 * @param revenue - What it took at the box office, in dollars.
 * @param rottenTomatoes - Its Rotten Tomatoes score, as a percentage.
 */
const TitleDetails = ({
  releaseDate,
  status,
  budget,
  revenue,
  rottenTomatoes,
}: TitleDetailsProps) => {
  const facts: { label: string; value: string }[] = [
    ...(releaseDate === undefined || releaseDate === null || releaseDate === ''
      ? []
      : [{ label: 'Released', value: formatCalendarDate(releaseDate) }]),
    ...(status === undefined || status === null || status === ''
      ? []
      : [{ label: 'Status', value: status }]),
    ...(budget === undefined || budget === null || budget <= 0
      ? []
      : [{ label: 'Budget', value: formatMoney(budget) }]),
    ...(revenue === undefined || revenue === null || revenue <= 0
      ? []
      : [{ label: 'Box office', value: formatMoney(revenue) }]),
    ...(rottenTomatoes === undefined || rottenTomatoes === null
      ? []
      : [{ label: 'Rotten Tomatoes', value: `${rottenTomatoes.toString()}%` }]),
  ];

  if (facts.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-text-muted">Details</h3>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
        {facts.map((fact) => (
          <div key={fact.label} className="flex flex-col gap-0.5">
            <dt className="text-xs text-text-muted">{fact.label}</dt>
            <dd className="text-sm font-medium tabular-nums text-text">{fact.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
};

TitleDetails.displayName = 'TitleDetails';

export { TitleDetails };
