import { chaptersOf } from '@ValenceClient/books/createAudiobookPlayer';
import type { AudiobookPlayer, AudiobookTrack } from '@ValenceClient/books/createAudiobookPlayer';
import type { Book } from '@ValenceContracts/schemas/Book';

/**
 * Starts listening to a book from the start of one of its chapters: straight there where the book
 * is the one already open, and otherwise by opening it there.
 *
 * @param player - The player to play it on.
 * @param book - The book.
 * @param tracks - The tracks it is heard by.
 * @param at - Which of its chapters.
 */
const startAtChapter = (
  player: AudiobookPlayer,
  book: Book,
  tracks: readonly AudiobookTrack[],
  at: number,
): void => {
  if (player.read().book?.id === book.id) {
    player.goToChapter(at);
    player.play();

    return;
  }

  const chapter = chaptersOf(tracks)[at];
  const track = chapter === undefined ? undefined : tracks[chapter.trackAt];

  if (chapter === undefined || track === undefined) {
    return;
  }

  const trackStarts = tracks
    .slice(0, chapter.trackAt)
    .reduce((all, one) => all + one.durationSeconds, 0);

  player.open(book, tracks, {
    chapterId: track.id,
    positionSeconds: chapter.bookStartSeconds - trackStarts,
  });
};

export { startAtChapter };
