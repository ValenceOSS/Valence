import { RotateCcw, RotateCw } from '@keyline-icons/react-native';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { APlayerCircle } from '@ValenceMobile/components/Watching/components/APlayerCircle/APlayerCircle';
import { PLAYER_LOOK } from '@ValenceMobile/components/Watching/PLAYER_LOOK';
import { FONTS } from '@ValenceMobile/theme/FONTS';
import type { ASkipStepProps } from './ASkipStep.types';
import { say } from '@ValenceI18n/say';

const styles = StyleSheet.create({
  howFar: {
    color: PLAYER_LOOK.colours.text,
    fontFamily: FONTS.sans.bold,
    fontSize: 13,
    position: 'absolute',
  },
  howFarOnChip: { fontSize: 11 },
  step: { alignItems: 'center', justifyContent: 'center', padding: 16 },
});

/**
 * The player's jump back or on by a few seconds, drawn as a turning arrow with how far inside it.
 *
 * @param by - How far it jumps, in seconds: back where it is below nothing, on where above.
 * @param isOnChip - Whether it sits on the player's soft round disc, as over a playing film,
 *   rather than bare.
 * @param onSkip - Told to jump by that much.
 */
const ASkipStep = ({ by, isOnChip = false, onSkip }: ASkipStepProps) => {
  const howFar = Math.abs(by).toString();

  return (
    <Button
      tone="bare"
      label={
        by < 0
          ? say('phone.watching.theControls.backASTEPSeconds', { A_STEP: howFar })
          : say('phone.watching.theControls.forwardASTEPSeconds', { A_STEP: howFar })
      }
      onPress={() => {
        onSkip(by);
      }}
    >
      {isOnChip ? (
        <APlayerCircle size="small">
          <Icon of={by < 0 ? RotateCcw : RotateCw} size={34} colour={PLAYER_LOOK.colours.text} />
          <Text style={[styles.howFar, styles.howFarOnChip]}>{howFar}</Text>
        </APlayerCircle>
      ) : (
        <View style={styles.step}>
          <Icon
            of={by < 0 ? RotateCcw : RotateCw}
            size={PLAYER_LOOK.middle}
            colour={PLAYER_LOOK.colours.text}
          />
          <Text style={styles.howFar}>{howFar}</Text>
        </View>
      )}
    </Button>
  );
};

ASkipStep.displayName = 'ASkipStep';

export { ASkipStep };
