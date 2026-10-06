import { useEffect, useMemo, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWhatIsHeard } from '@ValenceClient/books/useWhatIsHeard';
import { albumArtworkUrl } from '@ValenceClient/music/fetchMusic';
import { thePhonesAudiobookPlayer } from '@ValenceMobile/books/thePhonesAudiobookPlayer';
import { thePhonesMusicPlayer } from '@ValenceMobile/music/thePhonesMusicPlayer';
import { TheNowPlayingBar } from '@ValenceMobile/components/TheNowPlayingBar/TheNowPlayingBar';
import { usePrefersStillness } from '@ValenceNative/motion/usePrefersStillness';
import { usePictureLights } from '@ValenceMobile/hooks/usePictureLights';
import { useTheMusic } from '@ValenceMobile/hooks/useTheMusic';
import { onThisServer } from '@ValenceMobile/platform/onThisServer';
import { SPRINGS } from '@ValenceMobile/theme/SPRINGS';
import type { TheFloatingPlayerProps } from './TheFloatingPlayer.types';

const ABOVE_THE_EDGE = 8;

const BELOW_THE_EDGE = 140;

const MOVES = { ...SPRINGS.rise, overshootClamping: true, useNativeDriver: true } as const;

const styles = StyleSheet.create({
  place: { left: 12, position: 'absolute', right: 12 },
});

/**
 * What music or book is playing: above the tabs on the library itself, and at the foot of a page of
 * the music library, so somebody browsing albums can see and stop what is playing without going
 * back. It is the one player for both, so moving between the tabs and an album slides it between
 * the two places rather than putting it away and drawing it again. It rises into place when either
 * is on top and sinks off the foot of the screen when neither is — moved, never faded, since the
 * glass it sits on draws wrongly while it fades.
 * It reads the colours of the cover of what is playing ahead of time, so the whole player rises
 * already lit in them rather than changing colour on the way up.
 *
 * @param isShown - Whether the tabs or a page of the music library is on top.
 * @param liftedBy - How much of the foot of the screen the tabs take up, where they are on top, to
 *   sit above them; nothing where a page of the music library is.
 * @param onOpen - Told which is being heard when somebody wants the whole player.
 */
const TheFloatingPlayer = ({ isShown, liftedBy, onOpen }: TheFloatingPlayerProps) => {
  const room = useSafeAreaInsets();
  const isStill = usePrefersStillness();
  const { state } = useTheMusic();
  const heard = useWhatIsHeard(thePhonesAudiobookPlayer(), thePhonesMusicPlayer());
  const track = state.current;

  usePictureLights(
    track === null || !track.album.hasArtwork
      ? null
      : onThisServer(albumArtworkUrl(track.album.id)),
  );
  const isUp = isShown && heard !== null;
  const [shown] = useState(() => new Animated.Value(isUp ? 1 : 0));
  const raise = liftedBy > 0 ? liftedBy - room.bottom : 0;
  const [lift] = useState(() => new Animated.Value(raise));
  const rising = useMemo(
    () =>
      shown.interpolate({
        inputRange: [0, 1],
        outputRange: [room.bottom + BELOW_THE_EDGE, 0],
      }),
    [shown, room.bottom],
  );

  useEffect(() => {
    if (isStill) {
      shown.setValue(isUp ? 1 : 0);

      return;
    }

    Animated.spring(shown, { ...MOVES, toValue: isUp ? 1 : 0 }).start();
  }, [isUp, isStill, shown]);

  useEffect(() => {
    if (isStill) {
      lift.setValue(raise);

      return;
    }

    Animated.spring(lift, { ...MOVES, toValue: raise }).start();
  }, [raise, isStill, lift]);

  return (
    <Animated.View
      pointerEvents={isUp ? 'box-none' : 'none'}
      style={[
        styles.place,
        {
          bottom: room.bottom + ABOVE_THE_EDGE,
          transform: [{ translateY: Animated.subtract(rising, lift) }],
        },
      ]}
    >
      <TheNowPlayingBar onOpen={onOpen} />
    </Animated.View>
  );
};

TheFloatingPlayer.displayName = 'TheFloatingPlayer';

export { TheFloatingPlayer };
