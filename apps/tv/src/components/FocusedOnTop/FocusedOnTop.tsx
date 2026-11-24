import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { FocusedOnTopProps } from './FocusedOnTop.types';

/**
 * Holds a card in a row or a grid, and draws it above its neighbours while the remote is on it, so a
 * card that lifts or grows past the gap beside it covers its neighbours rather than slipping under
 * the next one along. It stands in for a list's own holder of each card, laid out where the list
 * says and telling it where it went.
 *
 * @param style - How the list lays it out.
 * @param onLayout - Told where the list put it.
 * @param children - The card.
 */
const FocusedOnTop = ({ style, onLayout, children }: FocusedOnTopProps) => {
  const [isOnTop, setIsOnTop] = useState(false);

  return (
    <View
      style={[style, isOnTop && styles.onTop]}
      {...(onLayout === undefined ? {} : { onLayout })}
      onFocus={() => {
        setIsOnTop(true);
      }}
      onBlur={() => {
        setIsOnTop(false);
      }}
    >
      {children}
    </View>
  );
};

FocusedOnTop.displayName = 'FocusedOnTop';

const styles = StyleSheet.create({
  onTop: { zIndex: 1 },
});

export { FocusedOnTop };
