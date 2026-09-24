import { useMemo } from 'react';
import { SafeAreaInsetsContext, useSafeAreaInsets } from 'react-native-safe-area-context';
import { PLAYER_ROOM } from '@ValencePhone/components/TheFloatingPlayer/PLAYER_ROOM';
import { useTheMusic } from '@ValencePhone/hooks/useTheMusic';
import type { AMusicPageProps } from './AMusicPage.types';

/**
 * A page of the music library, given room at its foot for the player that floats over it while
 * something is playing, so its last song scrolls clear rather than sitting under the player.
 *
 * @param children - The page.
 */
const AMusicPage = ({ children }: AMusicPageProps) => {
  const room = useSafeAreaInsets();
  const isPlayerUp = useTheMusic().state.current !== null;
  const roomLeft = useMemo(
    () => ({ ...room, bottom: room.bottom + (isPlayerUp ? PLAYER_ROOM : 0) }),
    [room, isPlayerUp],
  );

  return (
    <SafeAreaInsetsContext.Provider value={roomLeft}>{children}</SafeAreaInsetsContext.Provider>
  );
};

AMusicPage.displayName = 'AMusicPage';

export { AMusicPage };
