import type { MusicTrack } from '@ValenceContracts/schemas/Music';

/**
 * A song to draw a screen against, numbered so several can be told apart.
 *
 * @param n - Which song.
 * @param overrides - Anything about it that matters to the test.
 * @returns The song.
 */
const aTrack = (n: number, overrides: Partial<MusicTrack> = {}): MusicTrack => ({
  id: `00000000-0000-4000-8000-${n.toString().padStart(12, '0')}`,
  libraryId: '00000000-0000-4000-8000-00000000f1f1',
  title: `Track ${n.toString()}`,
  artists: [{ id: '00000000-0000-4000-8000-00000000a7a7', name: 'Sleep Token' }],
  album: { id: '00000000-0000-4000-8000-00000000a1b1', title: 'Even In Arcadia', hasArtwork: true },
  discNumber: null,
  trackNumber: n,
  durationSeconds: 200 + n,
  codec: 'flac',
  isLossless: true,
  isExplicit: false,
  bitDepth: 24,
  sampleRate: 44_100,
  bitrateKbps: 1400,
  hasLyrics: false,
  videoKey: null,
  isFavourite: false,
  ...overrides,
});

export { aTrack };
