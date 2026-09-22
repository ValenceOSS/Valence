import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Focusable } from '@ValenceTv/components/Focusable/Focusable';
import { Icon } from '@ValenceTv/components/Icon/Icon';
import { tokens } from '@ValenceTv/theme/tokens';
import { withAlpha } from '@ValenceTv/theme/withAlpha';
import type { ButtonProps, ButtonSize, ButtonVariant } from './Button.types';

type Look = { face: string; edge: string; ink: string; focusedFace: string; focusedInk?: string };

const LOOKS: Record<ButtonVariant, Look> = {
  primary: {
    face: tokens.colours.accent,
    edge: 'rgba(255,255,255,0.15)',
    ink: tokens.colours.onAccent,
    focusedFace: tokens.colours.accentHover,
  },
  secondary: {
    face: tokens.colours.hover,
    edge: tokens.colours.line,
    ink: tokens.colours.text,
    focusedFace: tokens.colours.active,
  },
  glossy: {
    face: tokens.colours.hover,
    edge: tokens.colours.line,
    ink: tokens.colours.text,
    focusedFace: tokens.colours.active,
  },
  confirm: {
    face: '#ffffff',
    edge: 'transparent',
    ink: tokens.colours.onWhite,
    focusedFace: '#ffffff',
  },
  overlay: {
    face: 'rgba(0,0,0,0.35)',
    edge: 'transparent',
    ink: '#ffffff',
    focusedFace: '#ffffff',
    focusedInk: tokens.colours.onWhite,
  },
  soft: {
    face: withAlpha(tokens.colours.accent, 0.15),
    edge: 'transparent',
    ink: tokens.colours.accent,
    focusedFace: withAlpha(tokens.colours.accent, 0.25),
  },
  ghost: {
    face: 'transparent',
    edge: 'transparent',
    ink: tokens.colours.text,
    focusedFace: tokens.colours.hover,
  },
  danger: {
    face: tokens.colours.danger,
    edge: 'transparent',
    ink: tokens.colours.onAccent,
    focusedFace: tokens.colours.danger,
  },
};

const HEIGHTS: Record<ButtonSize, number> = { md: 72, lg: 80, xl: 88 };

const TEXT: Record<ButtonSize, number> = { md: 26, lg: 28, xl: 32 };

/**
 * ValenceUI's button, for a television: the same variants, the same shapes and the same colours as
 * the web's, sized for a room rather than a desk.
 *
 * Where the web lights a button when the pointer is over it and rings it when the keyboard is on it,
 * the television does both at once for whichever button the remote is on — the hover face, the ring,
 * and the lift everything on tvOS gives what is focused — since the remote is the pointer and the
 * keyboard both.
 *
 * @param label - What it says.
 * @param detail - A second, quieter line, such as where a server is.
 * @param icon - What is drawn before the words, as the web's buttons lead with an icon.
 * @param onPress - Told when it is pressed.
 * @param onFocus - Told when the remote lands on it.
 * @param onBlur - Told when the remote leaves it.
 * @param variant - Which of ValenceUI's variants it is.
 * @param size - How large.
 * @param isPill - Whether it is rounded fully, rather than at ValenceUI's corner.
 * @param isLoading - Whether it is busy, which also stops it being pressed.
 * @param isDisabled - Whether it can be pressed.
 * @param isWide - Whether it fills its row.
 * @param hasPreferredFocus - Whether the remote starts here.
 */
const Button = ({
  label,
  detail,
  icon,
  onPress,
  onFocus,
  onBlur,
  variant = 'primary',
  size = 'lg',
  isPill = false,
  isLoading = false,
  isDisabled = false,
  isWide = false,
  hasPreferredFocus = false,
}: ButtonProps) => {
  const look = LOOKS[variant];
  const isHeldOff = isDisabled || isLoading;

  return (
    <Focusable
      label={detail === undefined ? label : `${label}, ${detail}`}
      onPress={onPress}
      {...(onFocus === undefined ? {} : { onFocus })}
      {...(onBlur === undefined ? {} : { onBlur })}
      hasPreferredFocus={hasPreferredFocus}
      isDisabled={isHeldOff}
      scale={1.04}
      style={isWide ? styles.wide : undefined}
    >
      {(isFocused) => {
        const ink = isFocused ? (look.focusedInk ?? look.ink) : look.ink;

        return (
          <View
            style={[
              styles.face,
              {
                minHeight: HEIGHTS[size],
                borderRadius: isPill ? tokens.radii.round : tokens.radii.md,
                backgroundColor: isFocused ? look.focusedFace : look.face,
                borderColor: isFocused ? tokens.colours.text : look.edge,
                borderWidth: isFocused ? tokens.FOCUS_RING : 2,
              },
              isHeldOff && styles.heldOff,
            ]}
          >
            {isLoading ? <ActivityIndicator color={ink} /> : null}

            {icon === undefined || isLoading ? null : (
              <Icon of={icon} colour={ink} size={Math.round(TEXT[size] * 1.1)} />
            )}

            <View style={styles.words}>
              <Text style={[styles.label, { color: ink, fontSize: TEXT[size] }]}>{label}</Text>

              {detail === undefined ? null : (
                <Text style={[styles.detail, { color: ink }]}>{detail}</Text>
              )}
            </View>
          </View>
        );
      }}
    </Focusable>
  );
};

Button.displayName = 'Button';

const styles = StyleSheet.create({
  wide: { alignSelf: 'stretch' },
  face: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.space.sm,
    paddingHorizontal: tokens.space.lg,
    paddingVertical: tokens.space.xs,
  },
  heldOff: { opacity: 0.5 },
  words: { alignItems: 'center' },
  label: { fontWeight: '500' },
  detail: { fontSize: tokens.type.small, opacity: 0.7 },
});

export { Button };
