import { Button } from '@ValenceUI/Button';
import type { PosterMatchListProps } from './PosterMatchList.types';

/**
 * What a catalogue offered for a name, each with its poster or cover, title, year and a line about
 * it, to choose one from.
 *
 * @param matches - What was offered.
 * @param busyId - The one being acted on, which shows it is.
 * @param onChoose - Told which was chosen.
 */
const PosterMatchList = ({ matches, busyId = null, onChoose }: PosterMatchListProps) => (
  <ul className="flex max-h-[50vh] flex-col gap-2 overflow-y-auto">
    {matches.map((match) => (
      <li key={match.id}>
        <Button
          variant="row"
          size="none"
          className="items-start gap-4 p-2"
          isLoading={busyId === match.id}
          onClick={() => {
            onChoose(match.id);
          }}
        >
          <span className="relative aspect-[2/3] w-14 shrink-0 overflow-hidden rounded-lg bg-surface-raised">
            {match.posterUrl === null ? null : (
              <img
                src={match.posterUrl}
                alt=""
                loading="lazy"
                className="absolute inset-0 size-full object-cover"
              />
            )}
          </span>

          <span className="flex min-w-0 flex-col gap-1">
            <span className="text-sm font-medium text-text">
              {match.title}
              {match.year === null ? '' : ` (${match.year.toString()})`}
            </span>
            <span className="line-clamp-2 font-body text-xs text-text-muted">{match.detail}</span>
          </span>
        </Button>
      </li>
    ))}
  </ul>
);

PosterMatchList.displayName = 'PosterMatchList';

export { PosterMatchList };
