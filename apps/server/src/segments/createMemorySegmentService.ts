import type { SegmentService } from './SegmentService';
import type { MediaSegment } from '@ValenceContracts/schemas/MediaSegment';
import type { VideoChapter } from '@ValenceContracts/schemas/VideoChapter';

type MemoryState = Record<string, MediaSegment[]>;

/**
 * Segments held in memory, so the routes can be exercised without Postgres.
 *
 * @param state - Any segments already marked.
 * @param chapters - The chapters each item's file carries.
 * @returns The segment service.
 */
const createMemorySegmentService = (
  state: MemoryState = {},
  chapters: Record<string, VideoChapter[]> = {},
): SegmentService & {
  state: MemoryState;
} => ({
  state,

  list: (mediaId) => Promise.resolve(state[mediaId] ?? []),

  replace: (mediaId, segments) => {
    state[mediaId] = segments;

    return Promise.resolve();
  },

  chapters: (mediaId) => Promise.resolve(chapters[mediaId] ?? []),
});

export type { MemoryState };

export { createMemorySegmentService };
