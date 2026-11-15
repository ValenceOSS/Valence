import { useMemo } from 'react';
import { useWhatIsPlaying } from '@ValenceClient/music/useWhatIsPlaying';
import { useTheMusic } from '@ValenceMobile/hooks/useTheMusic';
import { NOW_PLAYING } from '@ValenceMobile/components/ATrackList/NOW_PLAYING';
import type { TheNowPlayingProps } from './TheNowPlaying.types';

/**
 * Follows which song is playing, here or on the device this one controls, and tells the rows of a
 * list beneath it only when that or whether it is playing changes, so the list is not drawn again
 * as a far device's song moves on.
 *
 * @param children - The list.
 */
const TheNowPlaying = ({ children }: TheNowPlayingProps) => {
  const { state } = useTheMusic();
  const isPlaying = useWhatIsPlaying(state)?.isPlaying ?? state.isPlaying;
  const currentId = state.current?.id ?? null;
  const told = useMemo(() => ({ currentId, isPlaying }), [currentId, isPlaying]);

  return <NOW_PLAYING.Provider value={told}>{children}</NOW_PLAYING.Provider>;
};

TheNowPlaying.displayName = 'TheNowPlaying';

export { TheNowPlaying };
