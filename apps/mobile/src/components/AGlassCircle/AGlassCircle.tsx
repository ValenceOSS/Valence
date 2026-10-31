import { StyleSheet, View } from 'react-native';
import { AGlass } from '@ValenceMobile/components/AGlass/AGlass';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { ASpinner } from '@ValenceMobile/components/ASpinner/ASpinner';
import { hasLiquidGlass } from '@ValenceMobile/platform/hasLiquidGlass';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { AGlassCircleProps } from './AGlassCircle.types';

const ROUND = 40;

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: ROUND / 2,
    height: ROUND,
    justifyContent: 'center',
    width: ROUND,
  },
  glass: { alignItems: 'center', height: ROUND, justifyContent: 'center', width: ROUND },
});

/**
 * A round button holding one icon, as the controls floating over a page are drawn: on liquid glass
 * where the phone has it, and on a dark disc where it does not, so it reads over artwork and over a
 * plain page alike. Given nothing to do, it only says something, such as that a page is still
 * finding what it plays, with a spinner in place of the icon while it is busy.
 *
 * @param of - The icon.
 * @param label - What pressing it does, or what it says, for somebody who cannot see it.
 * @param onPress - Told it was pressed, or nothing where it only says something.
 * @param ink - The colour of the icon on the glass, where what is behind the glass calls for one
 *   other than the theme's.
 * @param isBusy - Whether what it stands for is still going, which a spinner says.
 */
const AGlassCircle = ({ of, label, onPress, ink, isBusy = false }: AGlassCircleProps) => {
  const colours = useTheColours();
  const glassInk = ink ?? colours.text;
  const inside = hasLiquidGlass() ? (
    <View style={styles.glass}>
      <AGlass roundness={ROUND / 2} />
      {isBusy ? <ASpinner colour={glassInk} /> : <Icon of={of} size={24} colour={glassInk} />}
    </View>
  ) : (
    <View style={styles.circle}>
      {isBusy ? <ASpinner colour="#ffffff" /> : <Icon of={of} size={24} colour="#ffffff" />}
    </View>
  );

  return onPress === undefined ? (
    <View
      accessible
      accessibilityRole={isBusy ? 'progressbar' : 'image'}
      accessibilityLabel={label}
    >
      {inside}
    </View>
  ) : (
    <Button tone="bare" label={label} onPress={onPress}>
      {inside}
    </Button>
  );
};

AGlassCircle.displayName = 'AGlassCircle';

export { AGlassCircle };
