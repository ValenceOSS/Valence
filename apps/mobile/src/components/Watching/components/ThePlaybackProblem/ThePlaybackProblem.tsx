import { useEffect, useState } from 'react';
import { Animated, Share, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CloudAlert,
  FileAlert,
  ShieldAlert,
  SquarePlayOff,
  TriangleAlert,
  X,
} from '@keyline-icons/react-native';
import { ABlur } from '@ValenceMobile/components/ABlur/ABlur';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import type { AGlyph } from '@ValenceMobile/components/Icon/Icon.types';
import { Words } from '@ValenceMobile/components/Words/Words';
import { usePrefersStillness } from '@ValenceNative/motion/usePrefersStillness';
import type { PlaybackProblemGroup } from '@ValenceContracts/schemas/PlaybackProblem';
import type { ThePlaybackProblemProps } from './ThePlaybackProblem.types';
import { say } from '@ValenceI18n/say';

const OVER_THE_PICTURE = '#ffffff';

const COMES_IN_OVER = 600;

const BADGE = 60;

const EDGE = 16;

const ICONS: Readonly<Record<PlaybackProblemGroup, AGlyph>> = {
  file: FileAlert,
  format: SquarePlayOff,
  connection: CloudAlert,
  account: ShieldAlert,
  player: TriangleAlert,
  download: FileAlert,
};

const styles = StyleSheet.create({
  actions: { alignItems: 'center', gap: 10, marginTop: 24 },
  badge: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderColor: 'rgba(255, 255, 255, 0.22)',
    borderRadius: BADGE / 2,
    borderWidth: StyleSheet.hairlineWidth,
    height: BADGE,
    justifyContent: 'center',
    marginBottom: 20,
    width: BADGE,
  },
  close: { position: 'absolute' },
  closeIcon: { alignItems: 'center', height: 44, justifyContent: 'center', width: 44 },
  code: { marginTop: 20, opacity: 0.55 },
  dim: { backgroundColor: 'rgba(0, 0, 0, 0.45)' },
  fills: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  middle: { alignItems: 'center', flex: 1, justifyContent: 'center', paddingHorizontal: 32 },
  words: { alignItems: 'center', gap: 8, maxWidth: 520 },
});

/**
 * What fills the player when something stops it for good: the picture held behind a blur, and over
 * it what is wrong in a few words, what to do about it, a way to send the details to the server's
 * admin, and the error's code, which the documentation lists. Trying again is offered where it can
 * help, and signing in where the sign-in lapsed. The way out sits where the controls keep it.
 *
 * With reduced motion it appears rather than fading in.
 *
 * @param problem - What went wrong, described.
 * @param details - What sharing the details sends.
 * @param onClose - Told they have stopped watching.
 * @param onRetry - What trying again does, where it is offered.
 * @param onSignIn - What signing in does, where it is offered.
 */
const ThePlaybackProblem = ({
  problem,
  details,
  onClose,
  onRetry,
  onSignIn,
}: ThePlaybackProblemProps) => {
  const room = useSafeAreaInsets();
  const isStill = usePrefersStillness();
  const [arriving] = useState(() => new Animated.Value(isStill ? 1 : 0));

  useEffect(() => {
    if (isStill) {
      arriving.setValue(1);

      return;
    }

    Animated.timing(arriving, {
      toValue: 1,
      duration: COMES_IN_OVER,
      useNativeDriver: true,
    }).start();
  }, [arriving, isStill]);

  return (
    <View style={styles.fills} accessibilityRole="alert">
      <ABlur isDark changesOver={isStill ? 0 : COMES_IN_OVER} />
      <View style={[styles.fills, styles.dim]} pointerEvents="none" />

      <Animated.View style={[styles.middle, { opacity: arriving }]}>
        <View style={styles.badge}>
          <Icon of={ICONS[problem.group]} size={28} colour={OVER_THE_PICTURE} />
        </View>

        <View style={styles.words}>
          <Words size="title" colour={OVER_THE_PICTURE} isCentred>
            {problem.heading}
          </Words>
          <Words colour="rgba(255, 255, 255, 0.72)" isCentred>
            {problem.line}
          </Words>
        </View>

        <View style={styles.actions}>
          {problem.action === 'retry' && onRetry !== undefined ? (
            <Button tone="bright" onPress={onRetry}>
              {say('common.tryAgain')}
            </Button>
          ) : null}

          {problem.action === 'signIn' && onSignIn !== undefined ? (
            <Button tone="bright" onPress={onSignIn}>
              {say('screens.profileGate.signIn')}
            </Button>
          ) : null}

          <Button
            tone="ghost"
            onPress={() => {
              void Share.share({ message: details }).catch(() => undefined);
            }}
          >
            {say('client.playback.playbackProblems.shareDetails')}
          </Button>
        </View>

        <View style={styles.code}>
          <Words size="small" colour={OVER_THE_PICTURE} isStrong>
            {say('client.playback.playbackProblems.errorCode', { code: problem.code.toString() })}
          </Words>
        </View>
      </Animated.View>

      <View
        style={[styles.close, { top: Math.max(room.top, EDGE), right: Math.max(room.right, EDGE) }]}
      >
        <Button
          tone="bare"
          label={say('phone.watching.theControls.stopWatching')}
          onPress={onClose}
        >
          <View style={styles.closeIcon}>
            <Icon of={X} size={24} colour={OVER_THE_PICTURE} />
          </View>
        </Button>
      </View>
    </View>
  );
};

ThePlaybackProblem.displayName = 'ThePlaybackProblem';

export { ThePlaybackProblem };
