import type { VideoChapter } from '@ValenceContracts/schemas/VideoChapter';

/**
 * Finds the chapter a moment falls in, and which one it is counting from one. A file that marks a
 * single chapter has divided nothing, so it has none worth naming.
 *
 * @param chapters - The item's chapters, in order.
 * @param seconds - The moment.
 * @returns The chapter and its number, or null where there is none to name.
 */
const chapterAt = (
  chapters: readonly VideoChapter[],
  seconds: number,
): { chapter: VideoChapter; number: number } | null => {
  if (chapters.length < 2) {
    return null;
  }

  const index = chapters.findLastIndex((chapter) => chapter.startSeconds <= seconds);
  const chapter = chapters[index];

  return chapter === undefined ? null : { chapter, number: index + 1 };
};

export { chapterAt };
