import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { onTheServer } from '@ValenceTv/platform/theServersOrigin';
import { signedHeadersFor } from '@ValenceTv/platform/theSessionToken';
import { tokens } from '@ValenceTv/theme/tokens';
import { withAlpha } from '@ValenceTv/theme/withAlpha';
import type { MoodBackdropProps } from './MoodBackdrop.types';

const BLUR = 90;

const CROSSFADES_MS = 900;

/**
 * The light behind every page: whatever is showing, blurred past recognition and dimmed, so the whole
 * screen takes on its colours — the television's answer to the web's mood lighting, which reads the
 * colours off the picture and lights the page with them.
 *
 * Changing what is shown crossfades the light rather than cutting it. It is drawn again only when
 * the picture changes, since blurring it is the costliest thing on the screen.
 *
 * @param path - The picture whose colours light the page, or nothing for the plain surface.
 */
const MoodLight = ({ path }: MoodBackdropProps) => (
  <View style={[StyleSheet.absoluteFill, styles.surface]} pointerEvents="none">
    {path === null ? null : (
      <Image
        source={{ uri: onTheServer(path), headers: signedHeadersFor(path) }}
        style={[StyleSheet.absoluteFill, styles.light]}
        contentFit="cover"
        blurRadius={BLUR}
        transition={{ duration: CROSSFADES_MS, effect: 'cross-dissolve' }}
      />
    )}

    <LinearGradient
      colors={[withAlpha(tokens.colours.canvas, 0.35), tokens.colours.canvas]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 0.95 }}
      style={StyleSheet.absoluteFill}
    />
  </View>
);

const MoodBackdrop = memo(MoodLight);

MoodBackdrop.displayName = 'MoodBackdrop';

const styles = StyleSheet.create({
  surface: { backgroundColor: tokens.colours.canvas },
  light: { opacity: 0.6 },
});

export { MoodBackdrop };
