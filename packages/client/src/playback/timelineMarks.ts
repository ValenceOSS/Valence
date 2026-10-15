import type { MediaSegment } from '@ValenceContracts/schemas/MediaSegment';
import type { VideoChapter } from '@ValenceContracts/schemas/VideoChapter';

type TimelineMarks = {
  stretches: { from: number; to: number; kind: MediaSegment['kind'] }[];
  notches: number[];
};

/**
 * Lays an item's marked stretches and chapter breaks along its timeline, each as a fraction of the
 * whole, so every player draws them in the same places whatever its bar is made of.
 *
 * @param segments - Its intro, recap, credits and preview.
 * @param chapters - Its chapters, in order.
 * @param durationSeconds - How long it runs.
 * @returns The stretches to shade and where each chapter after the first begins.
 */
const timelineMarks = (
  segments: readonly MediaSegment[],
  chapters: readonly VideoChapter[],
  durationSeconds: number,
): TimelineMarks => {
  if (durationSeconds <= 0) {
    return { stretches: [], notches: [] };
  }

  const along = (seconds: number): number => Math.min(Math.max(seconds / durationSeconds, 0), 1);

  return {
    stretches: segments
      .map((segment) => ({
        from: along(segment.startSeconds),
        to: along(segment.endSeconds),
        kind: segment.kind,
      }))
      .filter((stretch) => stretch.to > stretch.from),
    notches:
      chapters.length < 2
        ? []
        : chapters
            .map((chapter) => along(chapter.startSeconds))
            .filter((notch) => notch > 0 && notch < 1),
  };
};

export type { TimelineMarks };

export { timelineMarks };
