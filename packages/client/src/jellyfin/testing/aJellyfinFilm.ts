/* oxlint-disable valence/no-hard-coded-strings -- a film as a real Jellyfin 10.10 server described it, for tests */
import { JellyfinItemSchema } from '@ValenceClient/jellyfin/JellyfinSchemas';
import type { JellyfinItem } from '@ValenceClient/jellyfin/JellyfinSchemas';

/**
 * A film as a Jellyfin 10.10 server lists it, with whatever a test cares about changed.
 *
 * @param change - What differs.
 * @returns The film.
 */
const aJellyfinFilm = (change: Partial<JellyfinItem> = {}): JellyfinItem =>
  JellyfinItemSchema.parse({
    Id: '87d216619130f7261a2f6c054af5ff81',
    Name: 'Sneakers',
    Type: 'Movie',
    SortName: 'Sneakers',
    ProductionYear: 1992,
    DateCreated: '2026-11-14T00:15:20.0000000Z',
    RunTimeTicks: 600_000_000,
    Width: 1920,
    Height: 1080,
    ImageTags: {
      Primary: '2d8db055a657759ef97c2132c9cb4edf',
      Logo: '53fba8e4b089d61c14792b34eb3d7ca2',
    },
    BackdropImageTags: ['bf54faa08fbb776b3097a04b66809681'],
    ProviderIds: { Tmdb: '2322' },
    UserData: {
      PlaybackPositionTicks: 300_000_000,
      Played: false,
      LastPlayedDate: '2026-11-13T00:00:00Z',
    },
    ...change,
  });

export { aJellyfinFilm };
