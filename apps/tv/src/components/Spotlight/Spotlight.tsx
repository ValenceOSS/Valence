import { StyleSheet, View } from 'react-native';
import { Artwork } from '@ValenceTv/components/Artwork/Artwork';
import { EdgeFade } from '@ValenceTv/components/EdgeFade/EdgeFade';
import { useKeepsStill } from '@ValenceTv/platform/useKeepsStill';
import { useTheScreen } from '@ValenceTv/platform/useTheScreen';
import { tokens } from '@ValenceTv/theme/tokens';
import type { SpotlightProps } from './Spotlight.types';

const HEIGHT_SHARE = 0.48;

const PICTURE_SHARE = 0.62;

const CROSSFADE_MS = 300;

/**
 * The top of a page of shelves, given to whatever the remote rests on below: its picture filling
 * the right of the screen and fading into the page, as a title's own page is laid out, with what is
 * written about it down the left, sat on the shelves. The picture dissolves from one to the next on
 * a television, and simply changes in a television's browser, which keeps still.
 *
 * @param picture - The picture, or nothing to leave the right to the light behind the page.
 * @param children - What is written about it.
 */
const Spotlight = ({ picture, children }: SpotlightProps) => {
  const screen = useTheScreen();
  const isStill = useKeepsStill();
  const height = screen.height * HEIGHT_SHARE;

  return (
    <View style={{ height }}>
      {picture === null ? null : (
        <EdgeFade
          edge="left"
          reach={0.6}
          style={[styles.picture, { width: screen.width * PICTURE_SHARE, height }]}
        >
          <EdgeFade edge="bottom" reach={0.45} style={StyleSheet.absoluteFill}>
            <Artwork
              path={picture}
              style={StyleSheet.absoluteFill}
              isUrgent
              {...(isStill ? {} : { crossfadeMs: CROSSFADE_MS })}
            />
          </EdgeFade>
        </EdgeFade>
      )}

      <View style={styles.column}>{children}</View>
    </View>
  );
};

Spotlight.displayName = 'Spotlight';

const styles = StyleSheet.create({
  picture: { position: 'absolute', top: 0, right: 0 },
  column: {
    flex: 1,
    justifyContent: 'flex-end',
    gap: tokens.space.sm,
    maxWidth: 960,
    paddingLeft: tokens.space.edge,
    paddingBottom: tokens.space.md,
  },
});

export { Spotlight };
