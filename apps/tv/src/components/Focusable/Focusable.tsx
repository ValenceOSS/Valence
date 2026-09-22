import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import { tokens } from '@ValenceTv/theme/tokens';
import type { FocusableProps } from './Focusable.types';

const SPRING = { friction: 7, tension: 90 } as const;

/**
 * Something the remote can land on and press. Every control on the television is one of these, the
 * way every control on the web is a Button: it owns the pressable element, and nothing else draws one.
 *
 * Landing on it lifts it on a spring, the way the rest of tvOS does, with a shadow beneath where it
 * asks for one, and tells whatever is inside whether it is
 * the one landed on, so a poster can light its title and a row can show its outline. The system's
 * focus engine decides where the remote goes next; this only says what focus looks like here.
 *
 * It asks to start with the remote only until it has had it once, since tvOS hands focus back to a
 * view that wants it every time that view is laid out again, pulling the remote off wherever it went.
 *
 * @param children - What is drawn, or a function told whether this is focused.
 * @param onPress - Told when it is pressed.
 * @param onFocus - Told when the remote lands on it.
 * @param onBlur - Told when the remote leaves it.
 * @param hasShadow - Whether it casts a shadow while lifted, as a card does.
 * @param label - What it is called, for VoiceOver.
 * @param hasPreferredFocus - Whether the remote should start here when the screen appears.
 * @param isDisabled - Whether it can be landed on at all.
 * @param scale - How far it lifts when focused.
 * @param style - How it is laid out.
 */
const Focusable = ({
  children,
  onPress,
  onFocus,
  onBlur,
  hasShadow = false,
  label,
  hasPreferredFocus = false,
  isDisabled = false,
  scale = tokens.FOCUS_SCALE,
  style,
}: FocusableProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasHadFocus, setHasHadFocus] = useState(false);
  const lift = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(lift, {
      toValue: isFocused ? scale : 1,
      ...SPRING,
      useNativeDriver: true,
    }).start();
  }, [isFocused, lift, scale]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hasTVPreferredFocus={hasPreferredFocus && !hasHadFocus}
      disabled={isDisabled}
      style={style}
      focusable={!isDisabled}
      onPress={onPress}
      onFocus={() => {
        setIsFocused(true);
        setHasHadFocus(true);
        onFocus?.();
      }}
      onBlur={() => {
        setIsFocused(false);
        onBlur?.();
      }}
    >
      <Animated.View
        style={[{ transform: [{ scale: lift }] }, hasShadow && isFocused && styles.shadow]}
      >
        {typeof children === 'function' ? children(isFocused) : children}
      </Animated.View>
    </Pressable>
  );
};

Focusable.displayName = 'Focusable';

const styles = StyleSheet.create({
  shadow: {
    shadowColor: '#000000',
    shadowOpacity: 0.55,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 18 },
  },
});

export { Focusable };
