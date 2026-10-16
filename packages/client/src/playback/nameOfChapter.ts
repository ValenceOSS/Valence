import type { VideoChapter } from '@ValenceContracts/schemas/VideoChapter';
import { say } from '@ValenceI18n/say';

/**
 * Names a chapter by the title its file gives it, or by its number where it gives none.
 *
 * @param chapter - The chapter.
 * @param number - Which chapter it is, counting from one.
 * @returns What to call it.
 */
const nameOfChapter = (chapter: VideoChapter, number: number): string => {
  const title = chapter.title?.trim() ?? '';

  return title === '' ? say('server.books.chapterNumbered', { number: number.toString() }) : title;
};

export { nameOfChapter };
