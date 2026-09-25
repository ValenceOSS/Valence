import { chapterPlaying } from '@ValenceClient/books/chapterPlaying';
import type { AudiobookPlayer } from '@ValenceClient/books/createAudiobookPlayer';

const RESTART_AFTER_SECONDS = 3;

/**
 * Goes to the next chapter, or back — to the start of the one playing where it is a few seconds in,
 * and to the one before only where it has only just begun, the way a track's back button works.
 *
 * @param player - The player.
 * @param step - 1 for the next chapter, -1 for back.
 */
const goToChapterBeside = (player: AudiobookPlayer, step: 1 | -1): void => {
  const state = player.read();
  const at = chapterPlaying(state);
  const chapter = state.chapters[at];

  if (chapter === undefined) {
    return;
  }

  if (step === -1 && state.bookPositionSeconds - chapter.bookStartSeconds > RESTART_AFTER_SECONDS) {
    player.goToChapter(at);

    return;
  }

  player.goToChapter(Math.min(Math.max(at + step, 0), state.chapters.length - 1));
};

export { goToChapterBeside };
