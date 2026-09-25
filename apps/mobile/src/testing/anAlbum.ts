import { MusicAlbumSchema } from '@ValenceContracts/schemas/Music';
import type { MusicAlbum } from '@ValenceContracts/schemas/Music';

/**
 * An album to draw a screen against.
 *
 * @param overrides - Anything about it that matters to the test.
 * @returns The album.
 */
const anAlbum = (overrides: Partial<MusicAlbum> = {}): MusicAlbum =>
  MusicAlbumSchema.parse({
    id: '00000000-0000-4000-8000-00000000a1b1',
    libraryId: '00000000-0000-4000-8000-00000000f1f1',
    title: 'Even In Arcadia',
    artist: { id: '00000000-0000-4000-8000-00000000a7a7', name: 'Sleep Token' },
    year: 2025,
    genres: [],
    hasArtwork: false,
    isCompilation: false,
    trackCount: 10,
    durationSeconds: 3000,
    addedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  });

export { anAlbum };
