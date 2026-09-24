import { MediaSummarySchema } from '@ValenceContracts/schemas/Library';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';

/**
 * A film to draw a screen against.
 *
 * @param overrides - Anything about it that matters to the test.
 * @returns The film.
 */
const aTitle = (overrides: Partial<MediaSummary> = {}): MediaSummary =>
  MediaSummarySchema.parse({
    id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    libraryId: '3fa85f64-5717-4562-b3fc-2c963f66afa7',
    title: 'Arrival',
    year: 2016,
    durationSeconds: 6960,
    width: 3840,
    height: 2160,
    videoCodec: 'hevc',
    videoRange: 'SDR',
    addedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  });

export { aTitle };
