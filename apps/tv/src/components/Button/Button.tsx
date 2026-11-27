import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Focusable } from '@ValenceTv/components/Focusable/Focusable';
import { Icon } from '@ValenceTv/components/Icon/Icon';
import { tokens } from '@ValenceTv/theme/tokens';
import type { ButtonProps, ButtonSize, ButtonVariant } from './Button.types';

type Look = {
  face: string;
  edge: string;
  ink: string;
  focusedInk?: string;
  isUnderlined?: boolean;
};

const LOOKS: Record<ButtonVariant, Look> = {
  primary: { face: '#ffffff', edge: 'transparent', ink: tokens.colours.onWhite },
  confirm: { face: '#ffffff', edge: 'transparent', ink: tokens.colours.onWhite },
  secondary: { face: tokens.colours.hover, edge: tokens.colours.line, ink: tokens.colours.text },
  glossy: { face: tokens.colours.hover, edge: tokens.colours.line, ink: tokens.colours.text },
  raised: { face: tokens.colours.raised, edge: tokens.colours.line, ink: tokens.colours.text },
  soft: { face: tokens.colours.hover, edge: 'transparent', ink: tokens.colours.text },
  ghost: { face: 'transparent', edge: 'transparent', ink: tokens.colours.text },
  danger: { face: tokens.colours.danger, edge: 'transparent', ink: tokens.colours.onDanger },
  overlay: {
    face: 'rgba(128,128,128,0.5)',
    edge: 'rgba(255,255,255,0.1)',
    ink: tokens.colours.onScrim,
  },
  glass: { face: 'rgba(85,85,85,0.7)', edge: 'transparent', ink: tokens.colours.text },
  subtle: {
    face: 'transparent',
    edge: 'transparent',
    ink: tokens.colours.muted,
    focusedInk: tokens.colours.text,
  },
  link: { face: 'transparent', edge: 'transparent', ink: tokens.colours.text, isUnderlined: true },
};

const RING_GAP = 4;

const HEIGHTS: Record<ButtonSize, number> = { md: 64, lg: 72, xl: 88, play: 84 };

const TEXT: Record<ButtonSize, number> = { md: 26, lg: 28, xl: 32, play: 28 };

const ACROSS: Record<ButtonSize, number> = { md: 24, lg: 28, xl: 40, play: 40 };

const GAPS: Record<ButtonSize, number> = { md: 16, lg: 16, xl: 20, play: 20 };

const WEIGHTS: Record<ButtonSize, '500' | '600' | '700'> = {
  md: '500',
  lg: '500',
  xl: '600',
  play: '700',
};

const ICON_TO_TEXT = 1.15;

const PLAY_ROUND = 23;

/**
 * ValenceUI's button, for a television: the web's variants, heights, padding, type and corners, each
 * doubled to be read across a room, and painted as the web paints them in the dark — the main action
 * white, the rest grey or see-through, none of them blue. Where the web rings the button the keyboard
 * is on, the television rings the one the remote is on, in white a little way outside its edge, so a
 * white button shows it as well as a grey one. Every button keeps a clear ring of the same size, so
 * moving the remote shifts nothing.
 *
 * @param label - What it says.
 * @param detail - A second, quieter line, such as where a server is.
 * @param icon - What is drawn before the words, as the web's buttons lead with an icon.
 * @param onPress - Told when it is pressed.
 * @param onFocus - Told when the remote lands on it.
 * @param onBlur - Told when the remote leaves it.
 * @param variant - Which of ValenceUI's variants it is.
 * @param size - How large; `play` is the web's play button, bolder and rounder.
 * @param isPill - Whether it is rounded fully, rather than at ValenceUI's corner.
 * @param isLoading - Whether it is busy, which also stops it being pressed.
 * @param isDisabled - Whether it can be pressed.
 * @param isWide - Whether it fills its row.
 * @param minWidth - The narrowest it may be, for a play button that leads its row.
 * @param isIconOnly - Whether it shows its icon alone, as a round button, its words still read out.
 * @param iconSize - How large its icon is, where it should not follow the size of its words.
 * @param hasPreferredFocus - Whether the remote starts here.
 * @param isRingHidden - Whether to leave off the ring while the remote is on it, for a button that
 *   stays on screen while the controls around it have faded away.
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
  minWidth,
  isIconOnly = false,
  iconSize,
  hasPreferredFocus = false,
  isRingHidden = false,
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
        const ink = isFocused ? (look.focusedInk ?? look.ink) : look.ink;
        const corner =
          isPill || isIconOnly
            ? tokens.radii.round
            : size === 'play'
              ? PLAY_ROUND
              : tokens.radii.lg;

        return (
          <View
            style={[
              styles.ring,
              {
                borderRadius: corner + RING_GAP + tokens.FOCUS_RING,
                borderColor: isFocused && !isRingHidden ? tokens.colours.text : 'transparent',
              },
            ]}
          >
            <View
              style={[
                styles.face,
                {
                  minHeight: HEIGHTS[size],
                  gap: GAPS[size],
                  paddingHorizontal: ACROSS[size],
                  ...(minWidth === undefined ? {} : { minWidth }),
                  ...(isIconOnly ? { width: HEIGHTS[size], paddingHorizontal: 0 } : {}),
                  borderRadius: corner,
                  backgroundColor: look.face,
                  borderColor: look.edge,
                },
                isHeldOff && styles.heldOff,
              ]}
            >
              {isLoading ? <ActivityIndicator color={ink} /> : null}

              {icon === undefined || isLoading ? null : (
                <Icon
                  of={icon}
                  colour={ink}
                  size={iconSize ?? Math.round(TEXT[size] * ICON_TO_TEXT)}
                />
              )}

              {isIconOnly ? null : (
                <View style={styles.words}>
                  <Text
                    style={[
                      { color: ink, fontSize: TEXT[size], fontWeight: WEIGHTS[size] },
                      look.isUnderlined === true && isFocused && styles.underlined,
                    ]}
                  >
                    {label}
                  </Text>

                  {detail === undefined ? null : (
                    <Text style={[styles.detail, { color: ink }]}>{detail}</Text>
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
    paddingVertical: tokens.space.xs,
  },
  heldOff: { opacity: 0.5 },
  words: { alignItems: 'center' },
  underlined: { textDecorationLine: 'underline' },
  detail: { fontSize: tokens.type.small, opacity: 0.7 },
});

export { Button };
