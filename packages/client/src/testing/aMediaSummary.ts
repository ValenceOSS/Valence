import type { MediaSummary } from '@ValenceContracts/schemas/Library';

/**
 * A film in a library, as a list of the library answers with it, with whatever a test cares about
 * changed.
 *
 * @param change - What differs.
 * @returns The film.
 */
const aMediaSummary = (change: Partial<MediaSummary> = {}): MediaSummary => ({
  id: '00000000-0000-4000-8000-0000000000f1',
  libraryId: '00000000-0000-4000-8000-0000000000a1',
  title: 'Arrival',
  year: 2016,
  durationSeconds: 6960,
  width: 1920,
  height: 1080,
  videoCodec: 'h264',
  videoRange: 'SDR',
  addedAt: '2026-01-01T00:00:00.000Z',
  hasPoster: false,
  hasBackdrop: false,
  hasLogo: false,
  seriesId: null,
  ...change,
});

export { aMediaSummary };
