import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Focusable } from '@ValenceTv/components/Focusable/Focusable';
import { Icon } from '@ValenceTv/components/Icon/Icon';
import { tokens } from '@ValenceTv/theme/tokens';
import type { ButtonProps, ButtonSize, ButtonVariant } from './Button.types';

type Look = { face: string; edge: string; ink: string };

const LOOKS: Record<ButtonVariant, Look> = {
  primary: { face: '#ffffff', edge: 'transparent', ink: tokens.colours.onWhite },
  secondary: {
    face: tokens.colours.hover,
    edge: tokens.colours.line,
    ink: tokens.colours.text,
  },
  glossy: {
    face: tokens.colours.hover,
    edge: tokens.colours.line,
    ink: tokens.colours.text,
  },
  confirm: { face: '#ffffff', edge: 'transparent', ink: tokens.colours.onWhite },
  overlay: { face: 'rgba(128,128,128,0.5)', edge: 'transparent', ink: '#ffffff' },
  soft: { face: tokens.colours.hover, edge: 'transparent', ink: tokens.colours.text },
  ghost: { face: 'transparent', edge: 'transparent', ink: tokens.colours.text },
  danger: {
    face: tokens.colours.danger,
    edge: 'transparent',
    ink: tokens.colours.onAccent,
  },
};

const RING_GAP = 4;

const HEIGHTS: Record<ButtonSize, number> = { md: 72, lg: 80, xl: 88 };

const TEXT: Record<ButtonSize, number> = { md: 26, lg: 28, xl: 32 };

/**
 * ValenceUI's button, for a television: the same variants and shapes as the web's, sized for a room
 * rather than a desk, and coloured as the television's own buttons are rather than the web's — none
 * of them blue. The main action is white, the rest grey or see-through, and whichever the remote is
 * on is ringed in white a little way outside its edge, so a white button shows it as well as a grey
 * one. Every button keeps a clear ring of the same size, so moving the remote shifts nothing.
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
 * @param isIconOnly - Whether it shows its icon alone, as a round button, its words still read out.
 * @param iconSize - How large its icon is, where it should not follow the size of its words.
 * @param hasPreferredFocus - Whether the remote starts here.
 * @param ref - Handed the pressable element, for something that has to send the remote to it.
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
  isIconOnly = false,
  iconSize,
  hasPreferredFocus = false,
  ref,
}: ButtonProps) => {
  const look = LOOKS[variant];
  const isHeldOff = isDisabled || isLoading;

  return (
    <Focusable
      ref={ref}
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
        const corner = isPill || isIconOnly ? tokens.radii.round : tokens.radii.lg;

        return (
          <View
            style={[
              styles.ring,
              {
                borderRadius: corner + RING_GAP + tokens.FOCUS_RING,
                borderColor: isFocused ? '#ffffff' : 'transparent',
              },
            ]}
          >
            <View
              style={[
                styles.face,
                {
                  minHeight: HEIGHTS[size],
                  ...(isIconOnly ? { width: HEIGHTS[size], paddingHorizontal: 0 } : {}),
                  borderRadius: corner,
                  backgroundColor: look.face,
                  borderColor: look.edge,
                },
                isHeldOff && styles.heldOff,
              ]}
            >
              {isLoading ? <ActivityIndicator color={look.ink} /> : null}

              {icon === undefined || isLoading ? null : (
                <Icon of={icon} colour={look.ink} size={iconSize ?? Math.round(TEXT[size] * 1.1)} />
              )}

              {isIconOnly ? null : (
                <View style={styles.words}>
                  <Text style={[styles.label, { color: look.ink, fontSize: TEXT[size] }]}>
                    {label}
                  </Text>

                  {detail === undefined ? null : (
                    <Text style={[styles.detail, { color: look.ink }]}>{detail}</Text>
                  )}
                </View>
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
  ring: {
    borderWidth: tokens.FOCUS_RING,
    padding: RING_GAP,
    margin: -(RING_GAP + tokens.FOCUS_RING),
  },
  face: {
    borderWidth: 2,
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
