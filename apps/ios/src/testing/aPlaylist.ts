import { PlaylistSummarySchema } from '@ValenceContracts/schemas/Playlist';
import type { PlaylistSummary } from '@ValenceContracts/schemas/Playlist';

/**
 * A playlist to draw a screen against.
 *
 * @param overrides - Anything about it that matters to the test.
 * @returns The playlist.
 */
const aPlaylist = (overrides: Partial<PlaylistSummary> = {}): PlaylistSummary =>
  PlaylistSummarySchema.parse({
    id: '00000000-0000-4000-8000-0000000000aa',
    name: 'Road trip',
    description: null,
    isShared: false,
    isOrdered: false,
    isMine: true,
    owner: null,
    entryCount: 3,
    lostCount: 0,
    durationSeconds: 600,
    artworkAlbumIds: [],
    updatedAt: '2026-09-01T00:00:00.000Z',
    ...overrides,
  });

export { aPlaylist };
