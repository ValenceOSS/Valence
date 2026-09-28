import { PosterMatchList } from '@ValenceScreens/components/AdminArea/components/PosterMatchList/PosterMatchList';
import type { CatalogueMatch } from '@ValenceClient/admin/fetchAdmin';
import type { CatalogueMatchListProps } from './CatalogueMatchList.types';

/**
 * Tells a film from a programme that shares its catalogue number.
 *
 * @param match - What the catalogue offered.
 * @returns A key no other match shares.
 */
const keyOf = (match: CatalogueMatch): string => `${match.kind}-${match.externalId}`;

/**
 * What the catalogue offered for a name, each with its poster, title, year and synopsis, to choose
 * one from.
 *
 * @param matches - What the catalogue offered.
 * @param busyId - The one being acted on, which shows it is.
 * @param onChoose - Told which was chosen.
 */
const CatalogueMatchList = ({ matches, busyId = null, onChoose }: CatalogueMatchListProps) => {
  const busy = matches.find((match) => match.externalId === busyId);

  return (
    <PosterMatchList
      matches={matches.map((match) => ({
        id: keyOf(match),
        title: match.title,
        year: match.year,
        detail: match.overview ?? 'No synopsis.',
        posterUrl: match.posterUrl,
      }))}
      busyId={busy === undefined ? null : keyOf(busy)}
      onChoose={(id) => {
        const chosen = matches.find((match) => keyOf(match) === id);

        if (chosen !== undefined) {
          onChoose(chosen);
        }
      }}
    />
  );
};

CatalogueMatchList.displayName = 'CatalogueMatchList';

export { CatalogueMatchList };
