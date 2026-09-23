import type { AudiobookPlayerState } from '@ValenceClient/books/createAudiobookPlayer';

/**
 * Which of a book's chapters is playing: the last one to have started by where the book has got to.
 *
 * @param state - What the player is doing.
 * @returns Where the chapter is in the book's chapters, or -1 where there are none.
 */
const chapterPlaying = ({ chapters, bookPositionSeconds }: AudiobookPlayerState): number =>
  chapters.length === 0
    ? -1
    : Math.max(
        chapters.findLastIndex((chapter) => chapter.bookStartSeconds <= bookPositionSeconds),
        0,
      );

export { chapterPlaying };
