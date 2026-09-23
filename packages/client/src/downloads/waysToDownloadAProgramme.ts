import { nameSeason } from '@ValenceClient/library/nameSeason';
import type { ShowDetail } from '@ValenceContracts/schemas/Show';
import type { AWayToDownload } from './waysToDownloadAProgramme.types';

/**
 * Counts episodes in words.
 *
 * @param count - How many.
 * @returns It, with the right noun.
 */
const episodesIn = (count: number): string =>
  count === 1 ? '1 episode' : `${count.toString()} episodes`;

/**
 * What somebody can download of a programme, as every client offers it: the season they are
 * looking at, every season, or the ones they pick.
 *
 * The season on screen comes first because it is the one somebody is most likely to mean. Every
 * season carries no list, so the server takes whatever the programme holds; picking is left to
 * whoever draws the choice, since only it can draw the list to pick from.
 *
 * @param show - The programme.
 * @param showing - The season on screen, where one is.
 * @returns The ways, in the order to offer them.
 */
const waysToDownloadAProgramme = (
  show: Pick<ShowDetail, 'seasons'>,
  showing: number | null,
): AWayToDownload[] => {
  const every = show.seasons.flatMap((season) => season.episodes);
  const onScreen = show.seasons.find((season) => season.seasonNumber === showing) ?? null;
  const isOneSeason = show.seasons.length === 1;

  return [
    ...(onScreen === null || isOneSeason || onScreen.episodes.length === 0
      ? []
      : [
          {
            kind: 'these' as const,
            label: `${nameSeason(onScreen.seasonNumber)} · ${episodesIn(onScreen.episodes.length)}`,
            mediaIds: onScreen.episodes.map((episode) => episode.id),
          },
        ]),
    {
      kind: 'these',
      label: `${isOneSeason ? 'Every episode' : 'Every season'} · ${episodesIn(every.length)}`,
      mediaIds: undefined,
    },
    { kind: 'choose', label: 'Choose episodes…' },
  ];
};

export { waysToDownloadAProgramme };
