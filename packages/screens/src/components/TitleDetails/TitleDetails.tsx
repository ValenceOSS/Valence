import { describeTitleDetails } from '@ValenceClient/library/describeTitleDetails';
import type { TitleDetailsProps } from './TitleDetails.types';
import { say } from '@ValenceI18n/say';

/**
 * The facts of a title beyond what a card carries: when it came out, whether it is out or still
 * being made, what it cost and what it took. Each appears only where the catalogue knew it, and the
 * whole thing not at all where it knew none of them, so a title it knew little about is not given a
 * row of dashes.
 *
 * @param seriesTitle - The series it belongs to, where it is an episode.
 * @param releaseDate - The day it came out, or an episode aired, as a calendar date.
 * @param status - Where the catalogue says it stands, such as "Released".
 * @param budget - What it cost to make, in dollars.
 * @param revenue - What it took at the box office, in dollars.
 * @param rottenTomatoes - Its Rotten Tomatoes score, as a percentage.
 */
const TitleDetails = ({
  seriesTitle,
  releaseDate,
  status,
  budget,
  revenue,
  rottenTomatoes,
}: TitleDetailsProps) => {
  const facts = describeTitleDetails({
    seriesTitle,
    releaseDate,
    status,
    budget,
    revenue,
    rottenTomatoes,
  });

  if (facts.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-text-muted">
        {say('screens.titleDetails.heading')}
      </h3>

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
