import { cataloguePicturePath } from '@ValenceServer/images/cataloguePicturePath';
import type { CalendarEntry } from '@ValenceContracts/schemas/ReleaseCalendar';

/**
 * Points an entry's pictures from the catalogue at this server, which keeps them, so a client never
 * draws from the catalogue and a title filed in later finds its pictures already fetched.
 *
 * @param entry - The entry.
 * @returns The entry with its pictures on this server.
 */
const drawnFromThisServer = (entry: CalendarEntry): CalendarEntry => ({
  ...entry,
  posterUrl: cataloguePicturePath(entry.posterUrl),
  backdropUrl: cataloguePicturePath(entry.backdropUrl),
  logoUrl: cataloguePicturePath(entry.logoUrl),
  episode:
    entry.episode === null
      ? null
      : { ...entry.episode, stillUrl: cataloguePicturePath(entry.episode.stillUrl) },
});

export { drawnFromThisServer };
