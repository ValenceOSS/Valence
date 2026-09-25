import { useMusicRemote } from '@ValenceClient/music/useMusicRemote';
import { thePhonesMusicPlayer } from '@ValenceMobile/music/thePhonesMusicPlayer';

/**
 * Lets this person's other devices play music on this phone and drive it — "Play on Dan's iPhone"
 * from the web plays here — and, while this phone is driving another device, keeps what that device
 * says it is playing mirrored here. It draws nothing; it is its own component so the music changing
 * redraws it alone rather than everything signed in.
 */
const TheMusicRemote = () => {
  const player = thePhonesMusicPlayer();

  useMusicRemote(player);

  return null;
};

TheMusicRemote.displayName = 'TheMusicRemote';

export { TheMusicRemote };
