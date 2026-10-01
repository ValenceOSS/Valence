import { useAudiobookRemote } from '@ValenceClient/books/useAudiobookRemote';
import { thePhonesAudiobookPlayer } from '@ValenceMobile/books/thePhonesAudiobookPlayer';

/**
 * Lets an administrator pause, resume or stop the audiobook this phone is playing. It draws
 * nothing; it is its own component so the book changing redraws it alone rather than everything
 * signed in.
 */
const TheAudiobookRemote = () => {
  useAudiobookRemote(thePhonesAudiobookPlayer());

  return null;
};

TheAudiobookRemote.displayName = 'TheAudiobookRemote';

export { TheAudiobookRemote };
