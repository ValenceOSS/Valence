/* oxlint-disable valence/no-hard-coded-strings -- Jellyfin's own field values and kinds, which its apps match on and no person reads */
import { artworkNameIn } from '@ValenceServer/jellyfin/artworkNameIn';
import { JELLYFIN_ITEM_DEFAULTS } from '@ValenceServer/jellyfin/JELLYFIN_ITEM_DEFAULTS';
import { jellyfinIdOf } from '@ValenceServer/jellyfin/jellyfinIdOf';
import { showJellyfinId } from '@ValenceServer/jellyfin/showJellyfinId';
import type { ShowDetail, ShowSummary } from '@ValenceContracts/schemas/Show';
import type { JellyfinItem } from '@ValenceServer/jellyfin/JellyfinDtos';
import type { JellyfinViewing } from '@ValenceServer/jellyfin/JellyfinViewing';

const POSTER_SHAPE = 2 / 3;

/**
 * A programme as Jellyfin describes a series, from Valence's summary of it and, where the
 * programme itself was asked for, what else Valence knows about it.
 *
 * @param show - Valence's summary of the programme.
 * @param viewing - The profile's favourites and the server's identifier.
 * @param detail - Everything Valence knows about the programme, where it was asked for.
 * @returns The series.
 */
const jellyfinItemOfShow = (
  show: ShowSummary,
  viewing: JellyfinViewing,
  detail: ShowDetail | null = null,
): JellyfinItem => {
  const id = showJellyfinId(show.libraryId, show.id);
  const poster = artworkNameIn(show.artwork?.poster);
  const backdrop = artworkNameIn(show.artwork?.titleBackdrop);
  const logo = artworkNameIn(show.artwork?.logo);
  const unwatched = show.unwatchedCount ?? null;

  return {
    ...JELLYFIN_ITEM_DEFAULTS,
    Name: show.title,
    ServerId: viewing.serverId,
    Id: id,
    Etag: (show.artworkRevision ?? 0).toString(),
    DateCreated: show.latestAddedAt,
    CanDelete: false,
    CanDownload: false,
    SortName: show.title,
    ...(show.year === null || show.year === undefined ? {} : { ProductionYear: show.year }),
    ...(show.rating === null || show.rating === undefined ? {} : { CommunityRating: show.rating }),
    ...(show.genres === null || show.genres === undefined ? {} : { Genres: show.genres }),
    ...(detail?.overview === null || detail?.overview === undefined
      ? {}
      : { Overview: detail.overview }),
    ...(detail?.certification === null || detail?.certification === undefined
      ? {}
      : { OfficialRating: detail.certification }),
    ...(detail?.status === null || detail?.status === undefined ? {} : { Status: detail.status }),
    IsFolder: true,
    Type: 'Series',
    ParentId: jellyfinIdOf(show.libraryId),
    ChildCount: show.seasonCount,
    RecursiveItemCount: show.episodeCount,
    LocationType: 'FileSystem',
    MediaType: 'Unknown',
    ImageTags: {
      ...(poster === undefined ? {} : { Primary: poster }),
      ...(logo === undefined ? {} : { Logo: logo }),
      ...(backdrop === undefined ? {} : { Thumb: backdrop }),
    },
    BackdropImageTags: backdrop === undefined ? [] : [backdrop],
    PrimaryImageAspectRatio: POSTER_SHAPE,
    UserData: {
      PlaybackPositionTicks: 0,
      PlayCount: 0,
      IsFavorite: false,
      Played: unwatched === 0,
      Key: id,
      ItemId: id,
      ...(unwatched === null ? {} : { UnplayedItemCount: unwatched }),
    },
  };
};

export { jellyfinItemOfShow };
