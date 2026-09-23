import { useEffect, useRef } from 'react';
import { bookCoverUrl } from '@ValenceClient/books/fetchBooks';
import { artworkTheSystemAccepts } from '@ValenceScreens/playback/artworkTheSystemAccepts';
import { claimTheSystemsControls } from '@ValenceScreens/playback/claimTheSystemsControls';
import { goToChapterBeside } from './goToChapterBeside';
import type { Claim } from '@ValenceScreens/playback/claimTheSystemsControls';
import type {
  AudiobookPlayer,
  AudiobookPlayerState,
} from '@ValenceClient/books/createAudiobookPlayer';

const BACK_SECONDS = 15;

const FORWARD_SECONDS = 30;

const COVER_SIZES = ['256x384', '512x768'] as const;

/**
 * Puts the book playing on the lock screen, the keyboard's media keys and the system's own
 * controls: play and pause, back fifteen seconds and on thirty, and the chapter before and after.
 *
 * @param state - What the player is doing.
 * @param player - The player the keys drive.
 */
const useAudiobookSession = (state: AudiobookPlayerState, player: AudiobookPlayer): void => {
  const { book } = state;
  const bookId = book?.id ?? null;
  const title = book?.title ?? '';
  const authors = book?.authors?.join(', ') ?? '';
  const hasCover = book?.hasCover === true;
  const claimRef = useRef<Claim | null>(null);

  useEffect(() => {
    if (bookId === null) {
      return;
    }

    const cover = hasCover ? artworkTheSystemAccepts(bookCoverUrl(bookId)) : null;
    const claim = claimTheSystemsControls({
      metadata: {
        title,
        artist: authors,
        album: title,
        artwork: cover === null ? [] : COVER_SIZES.map((sizes) => ({ src: cover, sizes })),
      },
      handlers: [
        ['play', () => player.play()],
        ['pause', () => player.pause()],
        [
          'seekbackward',
          (details) => {
            player.skip(-(details.seekOffset ?? BACK_SECONDS));
          },
        ],
        [
          'seekforward',
          (details) => {
            player.skip(details.seekOffset ?? FORWARD_SECONDS);
          },
        ],
        [
          'previoustrack',
          () => {
            goToChapterBeside(player, -1);
          },
        ],
        [
          'nexttrack',
          () => {
            goToChapterBeside(player, 1);
          },
        ],
      ],
    });

    claimRef.current = claim;

    return () => {
      claim.release();
      claimRef.current = null;
    };
  }, [bookId, title, authors, hasCover, player]);

  useEffect(() => {
    claimRef.current?.setPlaying(state.isPlaying);
  }, [state.isPlaying, bookId]);
};

export { BACK_SECONDS, FORWARD_SECONDS, useAudiobookSession };
