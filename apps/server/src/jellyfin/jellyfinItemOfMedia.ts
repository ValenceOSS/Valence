/* oxlint-disable valence/no-hard-coded-strings -- Jellyfin's own field values and kinds, which its apps match on and no person reads */
import { artworkNameIn } from '@ValenceServer/jellyfin/artworkNameIn';
import { JELLYFIN_ITEM_DEFAULTS } from '@ValenceServer/jellyfin/JELLYFIN_ITEM_DEFAULTS';
import { nameOfSeason } from '@ValenceServer/jellyfin/nameOfSeason';
import { jellyfinIdOf } from '@ValenceServer/jellyfin/jellyfinIdOf';
import { jellyfinMediaSourceOf } from '@ValenceServer/jellyfin/jellyfinMediaSourceOf';
import { jellyfinUserDataOf } from '@ValenceServer/jellyfin/jellyfinUserDataOf';
import { personJellyfinId } from '@ValenceServer/jellyfin/personJellyfinId';
import { seasonJellyfinId } from '@ValenceServer/jellyfin/seasonJellyfinId';
import { showIdOfEpisode } from '@ValenceServer/jellyfin/showIdOfEpisode';
import { showJellyfinId } from '@ValenceServer/jellyfin/showJellyfinId';
import { showKeyOf } from '@ValenceServer/jellyfin/showKeyOf';
import { syntheticJellyfinId } from '@ValenceServer/jellyfin/syntheticJellyfinId';
import { ticksOf } from '@ValenceServer/jellyfin/ticksOf';
import type { MediaDetail, MediaSummary } from '@ValenceContracts/schemas/Library';
import type { JellyfinItem } from '@ValenceServer/jellyfin/JellyfinDtos';
import type { JellyfinViewing } from '@ValenceServer/jellyfin/JellyfinViewing';

const POSTER_SHAPE = 2 / 3;

const STILL_SHAPE = 16 / 9;

/**
 * Leaves out a field Valence has nothing for, since Jellyfin's apps read a missing field and an
 * empty one differently.
 *
 * @param name - The field.
 * @param value - What Valence has for it.
 * @returns The field, or nothing.
 */
const field = <Name extends string, Value>(
  name: Name,
  value: Value | null | undefined,
): Partial<Record<Name, Value>> => {
  if (value === null || value === undefined) {
    return {};
  }

  const kept: Partial<Record<Name, Value>> = {};

  kept[name] = value;

  return kept;
};

/**
 * A film or an episode as Jellyfin describes it, from Valence's summary of it and, where the item
 * itself was asked for, everything else Valence knows about it: its story, its cast and the ways
 * it can be played.
 *
 * @param media - Valence's summary of the item.
 * @param viewing - The profile's progress and favourites, and the server's identifier.
 * @param detail - Everything Valence knows about the item, where it was asked for.
 * @returns The item.
 */
const jellyfinItemOfMedia = (
  media: MediaSummary,
  viewing: JellyfinViewing,
  detail: MediaDetail | null = null,
): JellyfinItem => {
  const showId = showIdOfEpisode(media);
  const isEpisode = showId !== null;
  const showKey = showId === null ? null : showKeyOf(media.libraryId, showId);
  const poster = artworkNameIn(media.artwork?.poster);
  const backdrop = artworkNameIn(media.artwork?.backdrop);
  const titleBackdrop = artworkNameIn(media.artwork?.titleBackdrop);
  const logo = artworkNameIn(media.artwork?.logo);
  const primary = isEpisode ? (backdrop ?? poster) : poster;
  const metadata = detail?.metadata;
  const seasonName =
    isEpisode && media.seasonNumber !== null && media.seasonNumber !== undefined
      ? nameOfSeason(media.seasonNumber)
      : undefined;

  return {
    ...JELLYFIN_ITEM_DEFAULTS,
    Name: media.title,
    ServerId: viewing.serverId,
    Id: jellyfinIdOf(media.id),
    Etag: (media.artworkRevision ?? 0).toString(),
    DateCreated: media.addedAt,
    CanDelete: false,
    CanDownload: true,
    SortName: media.sortTitle ?? media.title,
    ...field('PremiereDate', media.releaseDate),
    ...field('ProductionYear', media.year),
    ...field('CommunityRating', media.rating),
    Genres: media.genres ?? [],
    ...field('Overview', metadata?.overview),
    ...field('OfficialRating', metadata?.certification),
    ...(metadata?.tagline === null || metadata?.tagline === undefined
      ? {}
      : { Taglines: [metadata.tagline] }),
    ...(metadata?.cast === null || metadata?.cast === undefined
      ? { People: [] }
      : {
          People: metadata.cast.map((member) => ({
            Name: member.name,
            Id:
              member.personId === null
                ? syntheticJellyfinId('person', member.name)
                : personJellyfinId(member.personId),
            Role: member.role,
            Type: 'Actor' as const,
          })),
        }),
    RunTimeTicks: ticksOf(media.durationSeconds),
    IsFolder: false,
    Type: isEpisode ? 'Episode' : 'Movie',
    ParentId:
      showKey === null
        ? jellyfinIdOf(media.libraryId)
        : seasonJellyfinId(showKey, media.seasonNumber ?? null),
    ...(showKey === null || showId === null
      ? {}
      : {
          SeriesName: media.seriesTitle ?? media.title,
          SeriesId: showJellyfinId(media.libraryId, showId),
          SeasonId: seasonJellyfinId(showKey, media.seasonNumber ?? null),
          ...field('SeasonName', seasonName),
          ...field('IndexNumber', media.episodeNumber),
          ...field('IndexNumberEnd', media.episodeNumberEnd),
          ...field('ParentIndexNumber', media.seasonNumber),
          ...field('SeriesPrimaryImageTag', poster),
          ...(titleBackdrop === undefined
            ? {}
            : {
                ParentBackdropItemId: showJellyfinId(media.libraryId, showId),
                ParentBackdropImageTags: [titleBackdrop],
              }),
          ...(logo === undefined
            ? {}
            : {
                ParentLogoItemId: showJellyfinId(media.libraryId, showId),
                ParentLogoImageTag: logo,
              }),
        }),
    ...(media.externalId === null || media.externalId === undefined
      ? {}
      : { ProviderIds: { Tmdb: media.externalId } }),
    LocationType: 'FileSystem',
    MediaType: 'Video',
    VideoType: 'VideoFile',
    Width: media.width,
    Height: media.height,
    ImageTags: {
      ...field('Primary', primary),
      ...field('Logo', isEpisode ? undefined : logo),
      ...field('Thumb', isEpisode ? undefined : backdrop),
    },
    BackdropImageTags: isEpisode
      ? titleBackdrop === undefined
        ? []
        : [titleBackdrop]
      : backdrop === undefined
        ? []
        : [backdrop],
    PrimaryImageAspectRatio: isEpisode ? STILL_SHAPE : POSTER_SHAPE,
    UserData: jellyfinUserDataOf(media.id, viewing),
    LocalTrailerCount: 0,
    SpecialFeatureCount: detail?.extras?.length ?? 0,
    Chapters: [],
    ...(detail === null
      ? {}
      : {
          Container: detail.container,
          HasSubtitles: detail.subtitleStreams.length > 0,
          MediaSources: [jellyfinMediaSourceOf(detail)],
          MediaStreams: jellyfinMediaSourceOf(detail).MediaStreams,
        }),
  };
};

export { jellyfinItemOfMedia };
