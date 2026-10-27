import { StyleSheet, Text, View } from 'react-native';
import {
  CloudAlert,
  FileAlert,
  ShieldAlert,
  SquarePlayOff,
  TriangleAlert,
} from '@keyline-icons/react-native';
import { Button } from '@ValenceTv/components/Button/Button';
import { FadeIn } from '@ValenceTv/components/FadeIn/FadeIn';
import { Glass } from '@ValenceTv/components/Glass/Glass';
import { Icon } from '@ValenceTv/components/Icon/Icon';
import type { KeylineIcon } from '@ValenceTv/components/Icon/Icon.types';
import { Shade } from '@ValenceTv/components/Shade/Shade';
import { tokens } from '@ValenceTv/theme/tokens';
import type { PlaybackProblemGroup } from '@ValenceContracts/schemas/PlaybackProblem';
import type { PlaybackProblemProps } from './PlaybackProblem.types';
import { say } from '@ValenceI18n/say';

const BADGE = 120;

const OVER_THE_PICTURE = '#ffffff';

const ICONS: Readonly<Record<PlaybackProblemGroup, KeylineIcon>> = {
  file: FileAlert,
  format: SquarePlayOff,
  connection: CloudAlert,
  account: ShieldAlert,
  player: TriangleAlert,
  download: FileAlert,
  source: CloudAlert,
};

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: tokens.space.md, marginTop: tokens.space.lg },
  badge: {
    alignItems: 'center',
    height: BADGE,
    justifyContent: 'center',
    marginBottom: tokens.space.md,
    width: BADGE,
  },
  code: {
    color: OVER_THE_PICTURE,
    fontSize: tokens.type.small,
    fontWeight: '600',
    marginTop: tokens.space.lg,
    opacity: 0.6,
  },
  fills: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  heading: {
    color: OVER_THE_PICTURE,
    fontSize: tokens.type.title,
    fontWeight: '700',
    textAlign: 'center',
  },
  line: {
    color: OVER_THE_PICTURE,
    fontSize: tokens.type.body,
    marginTop: tokens.space.sm,
    maxWidth: 1200,
    opacity: 0.72,
    textAlign: 'center',
  },
  middle: { alignItems: 'center', flex: 1, justifyContent: 'center' },
});

/**
 * What fills the player when something stops it for good: the picture held behind a dark veil, and
 * over it what is wrong in a few words, what to do about it, and the error's code to read out or
 * look up, since a television has nowhere to copy the details to. Trying again is offered where it
 * can help and signing in where the sign-in lapsed, each taking the focus, with going back beside
 * them. With reduced motion it appears rather than fading in.
 *
 * @param problem - What went wrong, described.
 * @param onLeave - Told to leave the player.
 * @param onRetry - What trying again does, where it is offered.
 * @param onSignIn - What signing in does, where it is offered.
 */
const PlaybackProblem = ({ problem, onLeave, onRetry, onSignIn }: PlaybackProblemProps) => {
  const hasRetry = problem.action === 'retry' && onRetry !== undefined;
  const hasSignIn = problem.action === 'signIn' && onSignIn !== undefined;

  return (
    <View style={styles.fills}>
      <Shade
        colors={['rgba(0,0,0,0.72)', 'rgba(0,0,0,0.86)']}
        flat="rgba(0,0,0,0.8)"
        style={styles.fills}
      />

      <FadeIn>
        <View style={styles.middle} accessibilityRole="alert">
          <Glass cornerRadius={BADGE / 2} style={styles.badge}>
            <Icon of={ICONS[problem.group]} size={52} colour={OVER_THE_PICTURE} />
          </Glass>

          <Text style={styles.heading}>{problem.heading}</Text>
          <Text style={styles.line}>{problem.line}</Text>

          <View style={styles.actions}>
            {hasRetry ? (
              <Button
                label={say('common.tryAgain')}
                variant="primary"
                hasPreferredFocus
                onPress={onRetry}
              />
            ) : null}

            {hasSignIn ? (
              <Button
                label={say('screens.profileGate.signIn')}
                variant="primary"
                hasPreferredFocus
                onPress={onSignIn}
              />
            ) : null}

            <Button
              label={say('common.goBack')}
              variant="secondary"
              hasPreferredFocus={!hasRetry && !hasSignIn}
              onPress={onLeave}
            />
          </View>

          <Text style={styles.code}>
            {say('client.playback.playbackProblems.errorCode', { code: problem.code.toString() })}
          </Text>
        </View>
      </FadeIn>
    </View>
  );
};

PlaybackProblem.displayName = 'PlaybackProblem';

export { PlaybackProblem };
