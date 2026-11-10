/* oxlint-disable valence/no-hard-coded-strings -- stands in for a song in tests */
import type { MusicTrack } from '@ValenceContracts/schemas/Music';

const A_MUSIC_TRACK_FOR_TEST: MusicTrack = {
  id: '6f1c2a3e-4b5d-4e6f-8a7b-9c0d1e2f3a4b',
  libraryId: '1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d',
  title: 'First Light',
  artists: [{ id: '2b3c4d5e-6f7a-4b8c-9d0e-1f2a3b4c5d6e', name: 'Mara Quill' }],
  album: { id: '3c4d5e6f-7a8b-4c9d-8e1f-2a3b4c5d6e7f', title: 'Harbour', hasArtwork: true },
  discNumber: 1,
  trackNumber: 1,
  durationSeconds: 240,
  codec: 'flac',
  isLossless: true,
  isExplicit: false,
  bitDepth: 16,
  sampleRate: 44_100,
  bitrateKbps: 900,
  hasLyrics: false,
  videoKey: null,
  isFavourite: false,
  loudness: null,
};

export { A_MUSIC_TRACK_FOR_TEST };
