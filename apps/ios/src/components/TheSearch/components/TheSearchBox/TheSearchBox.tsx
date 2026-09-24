import { Search } from '@keyline-icons/react-native';
import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { useSettled } from '@ValenceClient/timing/useSettled';
import { AGlass } from '@ValencePhone/components/AGlass/AGlass';
import { Icon } from '@ValencePhone/components/Icon/Icon';
import { TextField } from '@ValencePhone/components/TextField/TextField';
import { hasLiquidGlass } from '@ValencePhone/platform/hasLiquidGlass';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import type { TheSearchBoxProps } from './TheSearchBox.types';

const HOLD_STILL_FOR = 250;

const SHOWS_OVER = 260;

const styles = StyleSheet.create({
  inside: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: 10 },
  capsule: {
    alignItems: 'center',
    flexGrow: 1,
    borderRadius: 999,
    flexDirection: 'row',
    gap: 10,
    overflow: 'hidden',
    paddingHorizontal: 18,
  },
});

/**
 * Where somebody types what they are looking for.
 *
 * It keeps what is being typed to itself and says only what it has settled on, once they pause, so
 * the results under it are not drawn again at every letter.
 *
 * @param placeholder - What it says before anything is typed.
 * @param isCapsule - Whether it is drawn as the bar's capsule of glass, with a glass behind it and a
 *   magnifier before it, in place of the row of parts it stands in for.
 * @param isShown - Whether it is showing, its glass and its words easing in and out when that
 *   changes, as the glass cannot be faded from outside.
 * @param onSettle - Told what to look for, trimmed, once the typing has stopped for a moment.
 */
const TheSearchBox = ({
  placeholder,
  onSettle,
  isCapsule = false,
  isShown = true,
}: TheSearchBoxProps) => {
  const colours = useTheColours();
  const [seen] = useState(() => new Animated.Value(isShown ? 1 : 0));

  useEffect(() => {
    Animated.timing(seen, {
      toValue: isShown ? 1 : 0,
      duration: SHOWS_OVER,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [isShown, seen]);
  const [typed, setTyped] = useState('');
  const searchingFor = useSettled(typed.trim(), HOLD_STILL_FOR);

  useEffect(() => {
    onSettle(searchingFor);
  }, [searchingFor, onSettle]);

  const field = (
    <TextField
      label="Search"
      value={typed}
      onValueChange={setTyped}
      placeholder={placeholder}
      keyboard="search"
      isBare={isCapsule}
    />
  );

  if (!isCapsule) {
    return field;
  }

  const isGlass = hasLiquidGlass();

  return (
    <View style={styles.capsule}>
      {isGlass ? (
        <AGlass roundness={999} isShown={isShown} />
      ) : (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: colours.surfaceRaised, opacity: seen },
          ]}
        />
      )}
      <Animated.View style={[styles.inside, { opacity: seen }]}>
        <Icon of={Search} size={18} colour={colours.textMuted} />
        {field}
      </Animated.View>
    </View>
  );
};

TheSearchBox.displayName = 'TheSearchBox';

export { TheSearchBox };
