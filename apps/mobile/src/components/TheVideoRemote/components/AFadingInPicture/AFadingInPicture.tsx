import { StyleSheet, View } from 'react-native';
import { ARemotePicture } from '@ValenceMobile/components/ARemotePicture/ARemotePicture';
import type { AFadingInPictureProps } from './AFadingInPicture.types';

const STEPS = 24;

/**
 * Eases a share of the way through the fade, so it starts and ends softly rather than in a line.
 *
 * @param share - How far through the fade, from 0 to 1.
 * @returns How opaque the picture is there.
 */
const easedAt = (share: number): number => share * share * (3 - 2 * share);

/**
 * A picture whose top edge fades in from nothing over what is behind it, kept to its top as a
 * poster is, for a remote's poster sat over a blurred copy of itself.
 *
 * React Native has no mask, so the fade is the picture drawn again in thin strips down its top
 * edge, each a little more opaque than the one above it; the strips are a few points tall, too fine
 * to see apart, and every copy is the same picture, which the phone holds once.
 *
 * @param uri - Where the picture is.
 * @param top - How far down the screen it starts.
 * @param height - How tall it is.
 * @param fade - How far down from its top edge it takes to fade in.
 * @param onMissing - Told where the picture cannot be had.
 */
const AFadingInPicture = ({ uri, top, height, fade, onMissing }: AFadingInPictureProps) => {
  const step = fade / STEPS;
  const drawn = (from: number) => (
    <ARemotePicture
      style={[styles.picture, { height, top: -from }]}
      uri={uri}
      isTopKept
      onMissing={onMissing}
    />
  );

  return (
    <View style={[styles.frame, { height, top }]} pointerEvents="none">
      {Array.from({ length: STEPS }, (_, at) => (
        <View
          key={at}
          style={[
            styles.strip,
            { height: step, opacity: easedAt((at + 0.5) / STEPS), top: at * step },
          ]}
        >
          {drawn(at * step)}
        </View>
      ))}
      <View style={[styles.strip, { bottom: 0, top: fade }]}>{drawn(fade)}</View>
    </View>
  );
};

AFadingInPicture.displayName = 'AFadingInPicture';

const styles = StyleSheet.create({
  frame: { left: 0, position: 'absolute', right: 0 },
  strip: { left: 0, overflow: 'hidden', position: 'absolute', right: 0 },
  picture: { left: 0, position: 'absolute', right: 0 },
});

export { AFadingInPicture };
