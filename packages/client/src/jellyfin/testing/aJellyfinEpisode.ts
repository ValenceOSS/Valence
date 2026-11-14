/* oxlint-disable valence/no-hard-coded-strings -- an episode as a real Jellyfin 10.10 server described it, for tests */
import { JellyfinItemSchema } from '@ValenceClient/jellyfin/JellyfinSchemas';
import type { JellyfinItem } from '@ValenceClient/jellyfin/JellyfinSchemas';

/**
 * An episode as a Jellyfin 10.10 server describes it with its media source, taken from a real one,
 * with whatever a test cares about changed.
 *
 * @param change - What differs.
 * @returns The episode.
 */
const aJellyfinEpisode = (change: Partial<JellyfinItem> = {}): JellyfinItem =>
  JellyfinItemSchema.parse({
    Id: 'a4cbf06e10347cf76f804f2eee4c01d6',
    Name: 'Pilot',
    Type: 'Episode',
    SortName: '001 - 0001 - Pilot',
    SeriesId: '8fda75b958575a5b48cb9ffb2a2fbff6',
    SeriesName: 'Twin Peaks',
    SeasonId: 'de6e0b2409e3056d4077994071bcc6fd',
    IndexNumber: 1,
    ParentIndexNumber: 1,
    ProductionYear: 1990,
    PremiereDate: '1990-04-08T00:00:00.0000000Z',
    DateCreated: '2026-11-14T00:15:20.4921517Z',
    RunTimeTicks: 600_210_000,
    CommunityRating: 8.2,
    Overview: 'The body of Laura Palmer is found on a riverbank.',
    Genres: ['Crime', 'Drama', 'Mystery'],
    Width: 320,
    Height: 180,
    ImageTags: { Primary: '46c34dc8f7f8525f5a84cac4e74c2f43' },
    BackdropImageTags: [],
    ParentBackdropItemId: '8fda75b958575a5b48cb9ffb2a2fbff6',
    ParentBackdropImageTags: ['178f6be5c72ab9be5a579ed67d09d266'],
    SeriesPrimaryImageTag: '6ab1420089ea60ced44e3362006921c4',
    ParentLogoItemId: '8fda75b958575a5b48cb9ffb2a2fbff6',
    ParentLogoImageTag: '8fd4842543c48aabb8d178f4080d5cf0',
    ProviderIds: { Tvdb: '11673' },
    UserData: { PlaybackPositionTicks: 0, Played: false, IsFavorite: false },
    MediaSources: [
      {
        Id: 'a4cbf06e10347cf76f804f2eee4c01d6',
        Container: 'mkv',
        Size: 70_490,
        Bitrate: 201_395,
        RunTimeTicks: 600_210_000,
        SupportsDirectPlay: true,
        MediaStreams: [
          {
            Type: 'Video',
            Index: 0,
            Codec: 'h264',
            Width: 320,
            Height: 180,
            BitDepth: 8,
            VideoRangeType: 'SDR',
          },
          {
            Type: 'Audio',
            Index: 1,
            Codec: 'aac',
            Language: 'eng',
            Channels: 2,
            DisplayTitle: 'English - AAC - Stereo',
          },
          { Type: 'Subtitle', Index: 2, Codec: 'subrip', Language: 'eng', IsForced: false },
        ],
      },
    ],
    ...change,
  });

export { aJellyfinEpisode };
