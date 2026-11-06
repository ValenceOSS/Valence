import { PosterMatchList } from '@ValenceScreens/components/AdminArea/components/PosterMatchList/PosterMatchList';
import type { CatalogueMatch } from '@ValenceClient/admin/fetchAdmin';
import type { CatalogueMatchListProps } from './CatalogueMatchList.types';
import { say } from '@ValenceI18n/say';

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
 * @param scoreOf - How well each fits, out of a hundred, where that is worked out.
 */
const CatalogueMatchList = ({
  matches,
  busyId = null,
  onChoose,
  scoreOf,
}: CatalogueMatchListProps) => {
  const busy = matches.find((match) => match.externalId === busyId);

  return (
    <PosterMatchList
      matches={matches.map((match) => ({
        id: keyOf(match),
        title: match.title,
        year: match.year,
        detail: match.overview ?? say('common.noSynopsis'),
        posterUrl: match.posterUrl,
        ...(scoreOf === undefined ? {} : { score: scoreOf(match) }),
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
