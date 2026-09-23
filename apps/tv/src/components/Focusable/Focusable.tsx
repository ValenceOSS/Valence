import { useState } from 'react';
import { Pressable } from 'react-native';
import { LiftOnFocus } from '@ValenceTv/components/LiftOnFocus/LiftOnFocus';
import { tokens } from '@ValenceTv/theme/tokens';
import type { FocusableProps } from './Focusable.types';

/**
 * Something the remote can land on and press. Every control on the television is one of these, the
 * way every control on the web is a Button: it owns the pressable element, and nothing else draws one.
 *
 * Landing on it lifts it, the way the rest of tvOS does, with a shadow beneath where it asks for
 * one. The lift is driven natively, in the same animation as the television's own move, so it never
 * trails the remote. It also tells whatever is inside whether it is the one landed on, so a poster
 * can light its title and a row can show its outline. The system's focus engine decides where the
 * remote goes next; this only says what focus looks like here. Landing on it draws nothing again
 * unless what is inside is drawn differently for being landed on.
 *
 * It asks to start with the remote only until it has had it once, since tvOS hands focus back to a
 * view that wants it every time that view is laid out again, pulling the remote off wherever it went.
 *
 * @param children - What is drawn, or a function told whether this is focused.
 * @param onPress - Told when it is pressed.
 * @param onFocus - Told when the remote lands on it.
 * @param onBlur - Told when the remote leaves it.
 * @param shadow - The picture that casts a shadow while lifted, as a card's does: how tall it is from
 *   the top, and how rounded.
 * @param label - What it is called, for VoiceOver.
 * @param hasPreferredFocus - Whether the remote should start here when the screen appears.
 * @param isDisabled - Whether it can be landed on at all.
 * @param scale - How far it lifts when focused.
 * @param isAnchoredLeft - Whether it lifts from its left edge, as a row in a list does.
 * @param style - How it is laid out.
 * @param ref - Handed the pressable element, for something that has to send the remote to it.
 */
const Focusable = ({
  children,
  ref,
  onPress,
  onFocus,
  onBlur,
  shadow = null,
  label,
  hasPreferredFocus = false,
  isDisabled = false,
  scale = tokens.FOCUS_SCALE,
  isAnchoredLeft = false,
  style,
}: FocusableProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasHadFocus, setHasHadFocus] = useState(false);
  const isDrawnByFocus = typeof children === 'function';

  return (
    <LiftOnFocus
      scale={scale}
      shadowHeight={shadow?.height ?? 0}
      cornerRadius={shadow?.cornerRadius ?? 0}
      isAnchoredLeft={isAnchoredLeft}
      style={style}
    >
      <Pressable
        ref={ref}
        accessibilityRole="button"
        accessibilityLabel={label}
        hasTVPreferredFocus={hasPreferredFocus && !hasHadFocus}
        disabled={isDisabled}
        focusable={!isDisabled}
        onPress={onPress}
        onFocus={() => {
          if (isDrawnByFocus) {
            setIsFocused(true);
          }

          if (hasPreferredFocus) {
            setHasHadFocus(true);
          }

          onFocus?.();
        }}
        onBlur={() => {
          if (isDrawnByFocus) {
            setIsFocused(false);
          }

          onBlur?.();
        }}
      >
        {typeof children === 'function' ? children(isFocused) : children}
      </Pressable>
    </LiftOnFocus>
  );
};

Focusable.displayName = 'Focusable';

export { Focusable };
