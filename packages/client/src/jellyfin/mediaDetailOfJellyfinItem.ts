/* oxlint-disable valence/no-hard-coded-strings -- Jellyfin's own stream kinds and codec names, which its server sends and no person reads */
import { MediaDetailSchema } from '@ValenceContracts/schemas/Library';
import { mediaSummaryOfJellyfinItem } from '@ValenceClient/jellyfin/mediaSummaryOfJellyfinItem';
import type { MediaDetail } from '@ValenceContracts/schemas/Library';
import type { JellyfinContext } from '@ValenceClient/jellyfin/JellyfinContext';
import type { JellyfinItem } from '@ValenceClient/jellyfin/JellyfinSchemas';

const SUBTITLE_FORMATS: Readonly<Record<string, string>> = {
  subrip: 'srt',
  srt: 'srt',
  webvtt: 'webvtt',
  vtt: 'webvtt',
  ass: 'ass',
  ssa: 'ssa',
  pgssub: 'pgs',
  dvd_subtitle: 'vobsub',
  dvdsub: 'vobsub',
  dvb_subtitle: 'dvbsub',
};

const ATMOS = /atmos/iu;

/**
 * Everything Valence's apps are told about a film or an episode from a Jellyfin server: its summary,
 * its story and cast, and the streams in its file, numbered as Jellyfin numbers them so a track
 * chosen in the app is the one Jellyfin plays.
 *
 * @param item - The item, as Jellyfin describes it with its media sources.
 * @param libraryId - The Valence identifier of its library.
 * @param context - The server, and how identifiers are turned.
 * @returns The detail.
 */
const mediaDetailOfJellyfinItem = (
  item: JellyfinItem,
  libraryId: string,
  context: Pick<JellyfinContext, 'address' | 'book'>,
): MediaDetail => {
  const summary = mediaSummaryOfJellyfinItem(item, libraryId, context);
  const source = item.MediaSources?.[0];
  const streams = source?.MediaStreams ?? [];
  const video = streams.find((stream) => stream.Type === 'Video');

  return MediaDetailSchema.parse({
    ...summary,
    container: source?.Container?.split(',')[0] ?? item.Container ?? 'unknown',
    videoBitDepth: video?.BitDepth ?? 8,
    bitrateKbps: Math.max(1, Math.round((source?.Bitrate ?? video?.BitRate ?? 1000) / 1000)),
    videoLevel:
      video?.Level === null || video?.Level === undefined ? null : Math.round(video.Level) || null,
    videoFrameRate: video?.AverageFrameRate ?? null,
    videoIsInterlaced: video?.IsInterlaced ?? false,
    audioStreams: streams
      .filter((stream) => stream.Type === 'Audio')
      .map((stream) => ({
        index: stream.Index,
        codec: stream.Codec ?? 'unknown',
        channels: Math.max(1, stream.Channels ?? 2),
        sampleRate: stream.SampleRate ?? null,
        profile: stream.Profile ?? null,
        language: stream.Language ?? null,
        title: stream.Title ?? stream.DisplayTitle ?? null,
        isDefault: stream.IsDefault ?? false,
        isAtmos: ATMOS.test(stream.Profile ?? '') || ATMOS.test(stream.DisplayTitle ?? ''),
      })),
    subtitleStreams: streams
      .filter((stream) => stream.Type === 'Subtitle')
      .map((stream) => ({
        index: stream.Index,
        format: SUBTITLE_FORMATS[(stream.Codec ?? '').toLowerCase()] ?? 'unknown',
        language: stream.Language ?? null,
        title: stream.Title ?? stream.DisplayTitle ?? null,
        isForced: stream.IsForced ?? false,
      })),
    metadata: {
      overview: item.Overview ?? null,
      tagline: item.Taglines?.[0] ?? null,
      certification: item.OfficialRating ?? null,
      genres: item.Genres ?? null,
      rating: item.CommunityRating ?? null,
      hasPoster: summary.hasPoster,
      hasBackdrop: summary.hasBackdrop,
      hasLogo: summary.hasLogo,
      seriesTitle: summary.seriesTitle ?? null,
      seasonNumber: summary.seasonNumber ?? null,
      episodeNumber: summary.episodeNumber ?? null,
      episodeNumberEnd: summary.episodeNumberEnd ?? null,
      externalId: summary.externalId ?? null,
      releaseDate: summary.releaseDate ?? null,
      cast: (item.People ?? [])
        .filter((person) => person.Type === 'Actor')
        .map((person) => ({
          personId: null,
          name: person.Name,
          role: person.Role ?? '',
          imageUrl: null,
        })),
    },
  });
};

export { mediaDetailOfJellyfinItem };
