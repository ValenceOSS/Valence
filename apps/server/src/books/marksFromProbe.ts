import { chapterTitleOf } from './chapterTitleOf';
import type { ChapterMark } from '@ValenceContracts/schemas/Book';

type ProbedChapter = { title: string | null; startSeconds: number; endSeconds: number };

/**
 * The chapters an audiobook marks inside itself, as FFmpeg reads them — which finds every chapter a
 * QuickTime chapter track holds, where reading the tags finds only the first. In order, each cut
 * short at the end of the book.
 *
 * @param chapters - The chapters FFmpeg found.
 * @param durationSeconds - How long the file lasts.
 * @returns The marks.
 */
const marksFromProbe = (
  chapters: readonly ProbedChapter[],
  durationSeconds: number,
): ChapterMark[] =>
  chapters
    .toSorted((one, other) => one.startSeconds - other.startSeconds)
    .map((chapter, at) => ({
      title: chapterTitleOf(chapter.title, at),
      startSeconds: Math.min(Math.max(chapter.startSeconds, 0), durationSeconds),
      endSeconds: Math.min(Math.max(chapter.endSeconds, 0), durationSeconds),
    }));

export { marksFromProbe };
