import { useRemote } from '@ValenceTv/remote/useRemote';
import type { HearsTheRemoteProps } from './HearsTheRemote.types';

/**
 * Listens to the remote for as long as it is drawn, drawing nothing itself, so only the one card the
 * remote is on listens rather than every card on the screen.
 *
 * @param onHeard - Told of anything the remote does.
 */
const HearsTheRemote = ({ onHeard }: HearsTheRemoteProps) => {
  useRemote(onHeard);

  return null;
};

HearsTheRemote.displayName = 'HearsTheRemote';

export { HearsTheRemote };
