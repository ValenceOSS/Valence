import { useEffect, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { albumArtworkUrl } from '@ValenceClient/music/fetchMusic';
import { TheNowPlayingBar } from '@ValencePhone/components/TheNowPlayingBar/TheNowPlayingBar';
import { usePrefersStillness } from '@ValencePhone/hooks/usePrefersStillness';
import { usePictureLights } from '@ValencePhone/hooks/usePictureLights';
import { useTheMusic } from '@ValencePhone/hooks/useTheMusic';
import { onThisServer } from '@ValencePhone/platform/onThisServer';
import { SPRINGS } from '@ValencePhone/theme/SPRINGS';
import type { TheFloatingPlayerProps } from './TheFloatingPlayer.types';

const ABOVE_THE_EDGE = 8;

const BELOW_THE_EDGE = 140;

const MOVES = { ...SPRINGS.rise, overshootClamping: true, useNativeDriver: true } as const;

const styles = StyleSheet.create({
  place: { left: 12, position: 'absolute', right: 12 },
});

/**
 * What music is playing, kept at the foot of a page of the music library the way it sits above the
 * tabs on the library itself, so somebody browsing albums can see and stop what is playing without
 * going back. It rises into place when such a page is on top and sinks off the foot of the screen
 * when one is not — moved, never faded, since the glass it sits on draws wrongly while it fades.
 * It reads the colours of the cover of what is playing ahead of time, so the whole player rises
 * already lit in them rather than changing colour on the way up.
 *
 * @param isShown - Whether a page of the music library is on top.
 * @param onOpen - Told somebody wants the whole player.
 */
const TheFloatingPlayer = ({ isShown, onOpen }: TheFloatingPlayerProps) => {
  const room = useSafeAreaInsets();
  const isStill = usePrefersStillness();
  const { state } = useTheMusic();
  const track = state.current;

  usePictureLights(
    track === null || !track.album.hasArtwork
      ? null
      : onThisServer(albumArtworkUrl(track.album.id)),
  );
  const isUp = isShown && state.current !== null;
  const [shown] = useState(() => new Animated.Value(isUp ? 1 : 0));

  useEffect(() => {
    if (isStill) {
      shown.setValue(isUp ? 1 : 0);

      return;
    }

    Animated.spring(shown, { ...MOVES, toValue: isUp ? 1 : 0 }).start();
  }, [isUp, isStill, shown]);

  return (
    <Animated.View
      pointerEvents={isUp ? 'box-none' : 'none'}
      style={[
        styles.place,
        {
          bottom: room.bottom + ABOVE_THE_EDGE,
          transform: [
            {
              translateY: shown.interpolate({
                inputRange: [0, 1],
                outputRange: [room.bottom + BELOW_THE_EDGE, 0],
              }),
            },
          ],
        },
      ]}
    >
      <TheNowPlayingBar onOpen={onOpen} />
    </Animated.View>
  );
};

TheFloatingPlayer.displayName = 'TheFloatingPlayer';

export { TheFloatingPlayer };
