import type { ChapterMark } from '@ValenceContracts/schemas/Book';

/**
 * What the chapter somebody has got to in an audiobook's track is called: the chapter the track
 * marks inside itself where it marks any, and otherwise the track itself.
 *
 * @param trackTitle - What the track is called.
 * @param marks - The chapters it marks inside itself.
 * @param positionSeconds - How far into the track they are.
 * @returns The chapter's name.
 */
const chapterHeardAt = (
  trackTitle: string,
  marks: readonly ChapterMark[],
  positionSeconds: number,
): string =>
  marks.findLast((mark) => mark.startSeconds <= positionSeconds)?.title ??
  marks[0]?.title ??
  trackTitle;

export { chapterHeardAt };
