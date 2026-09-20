import { Button } from '@ValenceUI/Button';
import type { CatalogueMatchListProps } from './CatalogueMatchList.types';

/**
 * What the catalogue offered for a name, each with its poster, title, year and synopsis, to choose
 * one from.
 *
 * @param matches - What the catalogue offered.
 * @param busyId - The one being acted on, which shows it is.
 * @param onChoose - Told which was chosen.
 */
const CatalogueMatchList = ({ matches, busyId = null, onChoose }: CatalogueMatchListProps) => (
  <ul className="flex max-h-[50vh] flex-col gap-2 overflow-y-auto">
    {matches.map((match) => (
      <li key={`${match.kind}-${match.externalId}`}>
        <Button
          variant="row"
          size="none"
          className="items-start gap-4 p-2"
          isLoading={busyId === match.externalId}
          onClick={() => {
            onChoose(match);
          }}
        >
          <span className="aspect-[2/3] w-14 shrink-0 overflow-hidden rounded-lg bg-surface-raised">
            {match.posterUrl === null ? null : (
              <img
                src={match.posterUrl}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover"
              />
            )}
          </span>

          <span className="flex min-w-0 flex-col gap-1">
            <span className="text-sm font-medium text-text">
              {match.title}
              {match.year === null ? '' : ` (${match.year.toString()})`}
            </span>
            <span className="line-clamp-2 font-body text-xs text-text-muted">
              {match.overview ?? 'No synopsis.'}
            </span>
          </span>
        </Button>
      </li>
    ))}
  </ul>
);

CatalogueMatchList.displayName = 'CatalogueMatchList';

export { CatalogueMatchList };
