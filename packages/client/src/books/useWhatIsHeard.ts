import { useSyncExternalStore } from 'react';
import { heardLast } from '@ValenceClient/books/heardLast';
import { theAudiobookPlayer } from '@ValenceClient/books/theAudiobookPlayer';
import { useAudiobookPlayer } from '@ValenceClient/books/useAudiobookPlayer';
import { theMusicPlayer } from '@ValenceClient/music/theMusicPlayer';
import { useMusicPlayer } from '@ValenceClient/music/useMusicPlayer';
import type { Heard } from '@ValenceClient/books/heardLast';
import type { AudiobookPlayer } from '@ValenceClient/books/createAudiobookPlayer';
import type { MusicPlayer } from '@ValenceClient/music/createMusicPlayer';

/**
 * Which of the book and the music is the one to show and to answer the remote's play button: the
 * one playing, or where both are paused the one heard last, or whichever alone has something
 * loaded.
 *
 * @param book - The audiobook player, which is the client's own unless a test says otherwise.
 * @param music - The music player, which is the client's own unless a test says otherwise.
 * @returns Which, or nothing where neither has anything to play.
 */
const useWhatIsHeard = (
  book: AudiobookPlayer = theAudiobookPlayer(),
  music: MusicPlayer = theMusicPlayer(),
): Heard | null => {
  const reading = useAudiobookPlayer(book, { followsPosition: false }).state;
  const listening = useMusicPlayer(music).state;
  const last = useSyncExternalStore(heardLast.subscribe, heardLast.read, heardLast.read);
  const hasBook = reading.book !== null;
  const hasMusic = listening.current !== null || listening.remote !== null;

  if (reading.isPlaying) {
    return 'book';
  }

  if (listening.isPlaying) {
    return 'music';
  }

  if (hasBook && hasMusic) {
    return last ?? 'music';
  }

  return hasBook ? 'book' : hasMusic ? 'music' : null;
};

export { useWhatIsHeard };
