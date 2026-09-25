import { useAudiobookPlayer } from '@ValenceClient/books/useAudiobookPlayer';
import { thePhonesAudiobookPlayer } from '@ValenceMobile/books/thePhonesAudiobookPlayer';
import type {
  AudiobookPlayer,
  AudiobookPlayerState,
} from '@ValenceClient/books/createAudiobookPlayer';

/**
 * The phone's audiobook player, and what it is doing now, kept current as it changes — but for how
 * far through the book it is, which only what shows it asks to follow.
 *
 * @param following - Whether to draw again as the book's position moves.
 * @returns The player, to tell it what to do, and its state, to draw.
 */
const useTheBook = ({ followsPosition = false }: { followsPosition?: boolean } = {}): {
  player: AudiobookPlayer;
  state: AudiobookPlayerState;
} => useAudiobookPlayer(thePhonesAudiobookPlayer(), { followsPosition });

export { useTheBook };
