import { requireOptionalNativeModule } from 'expo';
import { chapterPlaying } from '@ValenceClient/books/chapterPlaying';
import { bookCoverUrl } from '@ValenceClient/books/fetchBooks';
import { goToChapterBeside } from '@ValenceClient/books/goToChapterBeside';
import { LISTENING_CHOICES } from '@ValenceClient/books/LISTENING_CHOICES';
import { theAudiobookPlayer } from '@ValenceClient/books/theAudiobookPlayer';
import { RemoteCommandSchema } from '@ValenceMobile/audio/RemoteCommandSchema';
import { onThisServer } from '@ValenceMobile/platform/onThisServer';
import type { AudiobookPlayer } from '@ValenceClient/books/createAudiobookPlayer';
import type { NativeMusic } from '@ValenceMobile/music/NativeMusic.types';

let made: AudiobookPlayer | null = null;

let unwire: (() => void) | null = null;

/**
 * The one audiobook player this phone has, made the first time it is asked for and kept for as
 * long as the app runs, so a book carries on from screen to screen and with the app closed.
 *
 * It is the client's player, which plays through the phone's speaker for books. The chapter playing
 * is put on the lock screen and in Control Centre with the book's cover, as though the chapter were
 * the whole of what plays, so their bar scrubs through the chapter. Their buttons — and a pair of
 * headphones' — go fifteen seconds back and thirty on, to the chapter before and after, and change
 * the speed, as the same buttons in the app do.
 *
 * The client's player is let go on signing out, and a new one made for whoever signs in next, so
 * this follows it: the old one's buttons are let go and the new one is wired in its place.
 *
 * @returns The player.
 */
const thePhonesAudiobookPlayer = (): AudiobookPlayer => {
  const player = theAudiobookPlayer();

  if (player === made) {
    return player;
  }

  unwire?.();

  const speaker = requireOptionalNativeModule<NativeMusic>('ValenceMusic');

  if (speaker === null) {
    throw new Error('This build of Valence cannot play audiobooks.');
  }

  let described: string | null = null;

  const unsubscribe = player.subscribe(() => {
    const state = player.read();
    const { book } = state;
    const at = chapterPlaying(state);
    const chapter = state.chapters[at];

    if (book === null || chapter === undefined || chapter.trackAt !== state.trackAt) {
      described = book === null ? null : described;

      return;
    }

    const key = `${book.id}:${at.toString()}`;

    if (key === described) {
      return;
    }

    const trackStarts = state.tracks
      .slice(0, chapter.trackAt)
      .reduce((all, track) => all + track.durationSeconds, 0);

    described = key;
    speaker.describe('book', {
      title: chapter.title,
      artist: book.authors?.join(', ') ?? '',
      album: book.title,
      artwork: book.hasCover ? onThisServer(bookCoverUrl(book.id)) : null,
      from: chapter.bookStartSeconds - trackStarts,
      lasts: chapter.bookEndSeconds - chapter.bookStartSeconds,
    });
  });

  const listening = speaker.addListener('onRemote', (said) => {
    const read = RemoteCommandSchema.safeParse(said);

    if (!read.success || read.data.channel !== 'book') {
      return;
    }

    const { seconds } = read.data;

    switch (read.data.command) {
      case 'play':
        player.play();
        break;
      case 'pause':
        player.pause();
        break;
      case 'toggle':
        player.toggle();
        break;
      case 'back':
        player.skip(-(seconds ?? LISTENING_CHOICES.backSeconds));
        break;
      case 'forward':
        player.skip(seconds ?? LISTENING_CHOICES.forwardSeconds);
        break;
      case 'next':
        goToChapterBeside(player, 1);
        break;
      case 'previous':
        goToChapterBeside(player, -1);
        break;
      case 'seek': {
        const state = player.read();

        player.seek(
          (state.chapters[chapterPlaying(state)]?.bookStartSeconds ?? 0) + (seconds ?? 0),
        );
        break;
      }
      case 'rate':
        player.setSpeed(seconds ?? 1);
        break;
    }
  });

  unwire = () => {
    unsubscribe();
    listening.remove();
  };
  made = player;

  return player;
};

export { thePhonesAudiobookPlayer };
