import type { TrackRow } from '@ValenceServer/music/scanMusicLibrary';

/**
 * A song as a music scan hands it to its store, with whatever a test cares about changed.
 *
 * @param changes - What differs from a plain four-minute song with no words.
 * @returns The song.
 */
const aTrackRow = (
  changes: Partial<TrackRow> & Pick<TrackRow, 'albumId' | 'artistIds' | 'path'>,
): TrackRow => ({
  libraryId: 'music',
  sizeBytes: 4_000_000,
  modifiedAtMs: 0,
  title: 'A Song',
  year: null,
  genres: [],
  durationSeconds: 240,
  container: 'flac',
  codec: 'flac',
  isLossless: true,
  isExplicit: false,
  bitDepth: 16,
  sampleRate: 44_100,
  bitrateKbps: null,
  discNumber: 1,
  trackNumber: 1,
  lyrics: null,
  lyricsModifiedAtMs: null,
  ...changes,
});

export { aTrackRow };
