import { useEffect } from 'react';
import { chapterPlaying } from '@ValenceClient/books/chapterPlaying';
import { theAudiobookPlayer } from '@ValenceClient/books/theAudiobookPlayer';
import { useAudiobookPlayer } from '@ValenceClient/books/useAudiobookPlayer';
import { theTvsListeningPlayer } from '@ValenceTv/books/theTvsListeningAudio';
import type { AudiobookPlayerState } from '@ValenceClient/books/createAudiobookPlayer';
import type { AudioMetadata } from 'expo-audio';

/**
 * What the system is told of a book as it plays: the chapter, who wrote it, and the book.
 *
 * @param state - What the player is doing.
 * @returns What to show.
 */
const describeTheBook = (state: AudiobookPlayerState): AudioMetadata => ({
  title: state.chapters[chapterPlaying(state)]?.title ?? state.book?.title ?? '',
  artist: state.book?.authors?.join(', ') ?? '',
  albumTitle: state.book?.title ?? '',
});

/**
 * Tells the television what book this app is playing, so the system shows it as what is playing —
 * in the Control Centre, when the screen dims — and its own play, pause and scrubbing reach the
 * book. It is told again as each chapter begins rather than as it plays, and forgets the book once
 * none is open, while the music is the one being heard, or once the app stops listening for it.
 *
 * @param isHeard - Whether a book, rather than the music, is the one being heard.
 */
const useSystemNowPlayingABook = (isHeard: boolean): void => {
  const { state } = useAudiobookPlayer(theAudiobookPlayer(), { followsPosition: false });
  const { book } = state;

  useEffect(() => {
    const system = theTvsListeningPlayer();

    if (book === null || !isHeard) {
      system.clearLockScreenControls();

      return;
    }

    const player = theAudiobookPlayer();
    let shown = chapterPlaying(player.read());

    system.setActiveForLockScreen(true, describeTheBook(player.read()), {
      showSeekBackward: true,
      showSeekForward: true,
    });

    return player.subscribe(() => {
      const at = chapterPlaying(player.read());

      if (at !== shown) {
        shown = at;
        system.updateLockScreenMetadata(describeTheBook(player.read()));
      }
    });
  }, [book, isHeard]);

  useEffect(
    () => () => {
      theTvsListeningPlayer().clearLockScreenControls();
    },
    [],
  );
};

export { useSystemNowPlayingABook };
