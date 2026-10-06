import { MusicNote } from '@keyline-icons/react-native';
import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { usePrefersStillness } from '@ValenceNative/motion/usePrefersStillness';
import { ARemotePicture } from '@ValenceMobile/components/ARemotePicture/ARemotePicture';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { AFadingCoverProps } from './AFadingCover.types';

const FADES_MS = 260;

const styles = StyleSheet.create({
  middle: { alignItems: 'center', justifyContent: 'center' },
});

/**
 * The cover of what is playing, which fades from one song's into the next's as the song changes
 * rather than blinking from one to the other: the new cover is laid over the old and brought in.
 *
 * @param uri - The cover, or nothing where the song has none.
 */
const AFadingCover = ({ uri }: AFadingCoverProps) => {
  const colours = useTheColours();
  const isStill = usePrefersStillness();
  const [shown, setShown] = useState({ under: null as string | null, over: uri });
  const [over] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (uri === shown.over) {
      return;
    }

    setShown((was) => ({ under: was.over, over: uri }));

    if (isStill) {
      over.setValue(1);

      return;
    }

    over.setValue(0);
    Animated.timing(over, { toValue: 1, duration: FADES_MS, useNativeDriver: true }).start();
  }, [uri, shown.over, isStill, over]);

  const layer = (picture: string | null) =>
    picture === null ? (
      <View style={[StyleSheet.absoluteFill, styles.middle]}>
        <Icon of={MusicNote} size={20} colour={colours.textMuted} />
      </View>
    ) : (
      <ARemotePicture style={StyleSheet.absoluteFill} uri={picture} />
    );

  return (
    <>
      {shown.under === null && shown.over !== null ? null : layer(shown.under)}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: over }]}>
        {layer(shown.over)}
      </Animated.View>
    </>
  );
};

AFadingCover.displayName = 'AFadingCover';

export { AFadingCover };
