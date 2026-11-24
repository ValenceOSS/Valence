import { and, asc, eq, inArray, isNull } from 'drizzle-orm';
import { mediaItem, viewerProfile } from '#dialect/Schema';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import type { Season } from '@ValenceContracts/constants/SEASONS';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import { nullsLast } from '@ValenceDatabase/nullsLast';
import type { ArtworkAddressOf } from '@ValenceServer/images/ArtworkAddressOf';
import { SUMMARY_COLUMNS } from '@ValenceServer/library/SUMMARY_COLUMNS';
import { summaryOfRow } from '@ValenceServer/library/summaryOfRow';
import { isNotATrack } from '@ValenceServer/music/isNotATrack';
import { visibleToViewer } from '@ValenceServer/visibility/visibleToViewer';
import type { Viewer } from '@ValenceServer/visibility/Viewer';
import type { LikenessIndex } from './indexLikeness';
import { SEASON_KEYWORDS } from './SEASON_KEYWORDS';

type ReadSeasonalFilmsOptions = {
  db: AnyValenceDatabase;
  viewer: Viewer;
  index: LikenessIndex;
  season: Season;
  limit: number;
  artworkAddressOf?: ArtworkAddressOf;
};

/**
 * Reads whether a viewer's profile turned the seasonal rows off.
 *
 * @param db - The database.
 * @param viewer - Who is asking.
 * @returns Whether they are off.
 */
const isTurnedOff = async (db: AnyValenceDatabase, viewer: Viewer): Promise<boolean> => {
  if (viewer.kind !== 'account' || viewer.profileId === null) {
    return false;
  }

  const [profile] = await db
    .select({ showsSeasonalRows: viewerProfile.showsSeasonalRows })
    .from(viewerProfile)
    .where(eq(viewerProfile.id, viewer.profileId))
    .limit(1);

  return profile?.showsSeasonalRows === false;
};

/**
 * Reads the films a viewer may see that the catalogue ties to a season, such as Christmas, best
 * rated first, each film once however many copies of it there are, and none for a profile that
 * turned the seasonal rows off.
 *
 * @param options - The database, who is asking, what the catalogue says each title is like, the
 *   season, how many to take, and where pictures are served by name.
 * @returns The films, best rated first.
 */
const readSeasonalFilms = async ({
  db,
  viewer,
  index,
  season,
  limit,
  artworkAddressOf,
}: ReadSeasonalFilmsOptions): Promise<MediaSummary[]> => {
  const keywords = new Set<number>(Object.values(SEASON_KEYWORDS[season]));
  const filmIds = [...index.titles.values()].flatMap((title) =>
    title.kind === 'film' && [...title.keywords].some((keyword) => keywords.has(keyword))
      ? [title.catalogueId]
      : [],
  );

  if (filmIds.length === 0 || (await isTurnedOff(db, viewer))) {
    return [];
  }

  const rows = await db
    .select(SUMMARY_COLUMNS)
    .from(mediaItem)
    .where(
      and(
        inArray(mediaItem.externalId, filmIds),
        isNull(mediaItem.seriesTitle),
        isNull(mediaItem.extraKind),
        isNull(mediaItem.parentId),
        isNotATrack(db),
        visibleToViewer(db, viewer),
      ),
    )
    .orderBy(nullsLast(mediaItem.rating, 'desc'), asc(mediaItem.addedAt), asc(mediaItem.id));
  const taken = new Set<string>();

  return rows
    .filter((row) => {
      const key = row.externalId ?? row.id;

      if (taken.has(key)) {
        return false;
      }

      taken.add(key);

      return true;
    })
    .slice(0, limit)
    .map((row) => summaryOfRow(row, artworkAddressOf));
};

export { readSeasonalFilms };
