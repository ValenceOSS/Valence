import { aTrack } from '@ValenceClient/testing/aTrack';
import type { KeptListening } from '@ValenceContracts/schemas/KeptListening';

/**
 * An album of two songs a device keeps, with its cover, kept at the file's own quality.
 *
 * @param overrides - Anything about it that matters to the test.
 * @returns What is kept.
 */
const aKeptListening = (overrides: Partial<KeptListening> = {}): KeptListening => ({
  kind: 'album',
  id: '00000000-0000-4000-8000-00000000a1b1',
  title: 'Even In Arcadia',
  byline: 'Sleep Token',
  artworkFrom: '/api/music/albums/00000000-0000-4000-8000-00000000a1b1/artwork',
  quality: 'lossless',
  tracks: [aTrack(1), aTrack(2)],
  book: null,
  chapters: [],
  server: null,
  profileId: null,
  keptAt: '2026-10-01T00:00:00.000Z',
  ...overrides,
});

export { aKeptListening };
