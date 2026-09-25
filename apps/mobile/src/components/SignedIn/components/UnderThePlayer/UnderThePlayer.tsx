import { IS_ON_TOP } from '@ValenceMobile/components/APageStack/IS_ON_TOP';
import { useIsOnTop } from '@ValenceMobile/hooks/useIsOnTop';
import type { UnderThePlayerProps } from './UnderThePlayer.types';

/**
 * A page kept drawn beneath the player, which stops counting as on top while the player covers it,
 * so nothing on it plays or listens behind a film.
 *
 * @param isCovered - Whether the player is over it.
 */
const UnderThePlayer = ({ isCovered, children }: UnderThePlayerProps) => {
  const isOnTop = useIsOnTop();

  return <IS_ON_TOP.Provider value={isOnTop && !isCovered}>{children}</IS_ON_TOP.Provider>;
};

UnderThePlayer.displayName = 'UnderThePlayer';

export { UnderThePlayer };
