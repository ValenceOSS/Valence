import { useFollowTheTelevision } from '@ValenceClient/video/useFollowTheTelevision';
import type { TheVideoFollowerProps } from './TheVideoFollower.types';

/**
 * Makes this phone the remote for a television of the same profile the moment it starts playing a
 * film, so the strip above the tabs offers to pause it without the film having been sent from here.
 * It draws nothing; it is its own component so the devices changing redraws it alone rather than
 * everything signed in.
 *
 * @param isBusy - Whether this phone is showing a film of its own, while which it follows nothing.
 */
const TheVideoFollower = ({ isBusy }: TheVideoFollowerProps) => {
  useFollowTheTelevision(isBusy);

  return null;
};

TheVideoFollower.displayName = 'TheVideoFollower';

export { TheVideoFollower };
