/* oxlint-disable valence/no-hard-coded-strings -- Jellyfin's own field values and kinds, which its apps match on and no person reads */
import { nameOfSeason } from '@ValenceServer/jellyfin/nameOfSeason';
import { JELLYFIN_ITEM_DEFAULTS } from '@ValenceServer/jellyfin/JELLYFIN_ITEM_DEFAULTS';
import { artworkNameIn } from '@ValenceServer/jellyfin/artworkNameIn';
import { seasonJellyfinId } from '@ValenceServer/jellyfin/seasonJellyfinId';
import { showJellyfinId } from '@ValenceServer/jellyfin/showJellyfinId';
import { showKeyOf } from '@ValenceServer/jellyfin/showKeyOf';
import type { ShowDetail } from '@ValenceContracts/schemas/Show';
import type { JellyfinItem } from '@ValenceServer/jellyfin/JellyfinDtos';
import type { JellyfinViewing } from '@ValenceServer/jellyfin/JellyfinViewing';

const POSTER_SHAPE = 2 / 3;

/**
 * One season of a programme as Jellyfin describes it. Valence holds no season of its own, so it is
 * made from the episodes the library holds in it and the name the catalogue gives it.
 *
 * @param show - The programme.
 * @param season - The season and its episodes.
 * @param viewing - The profile's progress and the server's identifier.
 * @returns The season.
 */
const jellyfinItemOfSeason = (
  show: ShowDetail,
  season: ShowDetail['seasons'][number],
  viewing: JellyfinViewing,
): JellyfinItem => {
  const showKey = showKeyOf(show.libraryId, show.id);
  const id = seasonJellyfinId(showKey, season.seasonNumber);
  const seriesId = showJellyfinId(show.libraryId, show.id);
  const poster = artworkNameIn(show.artwork?.poster);
  const named = show.shape?.find((one) => one.seasonNumber === season.seasonNumber)?.name;
  const unwatched = season.episodes.filter(
    (episode) => viewing.progress.get(episode.id)?.isFinished !== true,
  ).length;

  return {
    ...JELLYFIN_ITEM_DEFAULTS,
    Name: named ?? nameOfSeason(season.seasonNumber),
    ServerId: viewing.serverId,
    Id: id,
    CanDelete: false,
    CanDownload: false,
    SortName: (season.seasonNumber ?? 0).toString().padStart(4, '0'),
    ...(season.seasonNumber === null ? {} : { IndexNumber: season.seasonNumber }),
    IsFolder: true,
    Type: 'Season',
    ParentId: seriesId,
    SeriesId: seriesId,
    SeriesName: show.title,
    ...(poster === undefined ? {} : { SeriesPrimaryImageTag: poster }),
    ChildCount: season.episodes.length,
    LocationType: 'FileSystem',
    MediaType: 'Unknown',
    ImageTags: poster === undefined ? {} : { Primary: poster },
    BackdropImageTags: [],
    PrimaryImageAspectRatio: POSTER_SHAPE,
    UserData: {
      PlaybackPositionTicks: 0,
      PlayCount: 0,
      IsFavorite: false,
      Played: unwatched === 0,
      Key: id,
      ItemId: id,
      UnplayedItemCount: unwatched,
    },
  };
};

export { jellyfinItemOfSeason };
