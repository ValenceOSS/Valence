import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '@ValencePhone/components/Icon/Icon';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import { withAlpha } from '@ValencePhone/theme/withAlpha';
import { FONTS } from '@ValencePhone/theme/FONTS';
import type { ButtonProps } from './Button.types';

const styles = StyleSheet.create({
  bare: {},
  bright: { alignItems: 'center', borderRadius: 12, paddingHorizontal: 18, paddingVertical: 12 },
  brightWord: { fontSize: 16, fontFamily: FONTS.sans.medium },
  fills: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  ghost: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  ghostWide: { borderRadius: 12, paddingVertical: 12 },
  ghostWord: { fontSize: 15, fontFamily: FONTS.sans.medium },
  pressed: { opacity: 0.75 },
  quiet: { alignItems: 'center', paddingVertical: 12 },
  quietWord: { fontSize: 15, fontFamily: FONTS.sans.medium },
  said: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  wide: { alignSelf: 'stretch' },
});

/**
 * The only thing on a phone that owns a press.
 *
 * `Pressable` lives here and nowhere else, which is the same rule the browser client keeps about
 * `<button>` — a control that draws itself is a control that drifts, and a household looking at two
 * clients should not be able to tell which one somebody built first.
 *
 * A bare one draws nothing and says nothing about what it holds, which is how a poster or a pill
 * becomes pressable without a second component learning how to take a press.
 *
 * @param children - What it says.
 * @param onPress - What it does, told where it was pressed for a press area that cares.
 * @param tone - Whether it is the thing to press on a page, drawn in the page's own ink so it is
 *   white on a dark page and dark on a light one, as every client draws it; the thing to press over
 *   artwork, which is white whatever the page is; a soft pill for a thing somebody may want
 *   rather than the thing to press; a thing that can be; or only the press itself.
 * @param icon - What is drawn before what it says, where anything is.
 * @param fills - Whether it takes up the whole of whatever holds it, for a press area with no
 *   shape of its own — the picture a film is playing on, which is pressed to put the controls away.
 * @param isWide - Whether it takes the full width it is given, where it would otherwise keep to
 *   the width of what it says; a soft pill that does takes the shape of the thing to press, which it
 *   sits beside or beneath.
 * @param isBusy - Whether what it started is still going.
 * @param isDisabled - Whether it can be pressed at all.
 * @param isChosen - Whether this is the one currently picked, where it is one of several.
 * @param label - What it is called, where what it says is not enough.
 */
const Button = ({
  children,
  onPress,
  tone = 'bold',
  icon,
  fills = false,
  isWide = false,
  isBusy = false,
  isDisabled = false,
  isChosen,
  label,
}: ButtonProps) => {
  const colours = useTheColours();
  const isBold = tone === 'bold';
  const isBright = tone === 'bright' || isBold;
  const isGhost = tone === 'ghost';
  const isBare = tone === 'bare';
  const filled = isBold ? colours.text : '#ffffff';
  const said = isGhost
    ? colours.text
    : isBold
      ? colours.surface
      : isBright
        ? '#000000'
        : colours.accent;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{
        disabled: isDisabled || isBusy,
        busy: isBusy,
        ...(isChosen === undefined ? {} : { selected: isChosen }),
      }}
      disabled={isDisabled || isBusy}
      onPress={({ nativeEvent }) => {
        onPress({ x: nativeEvent.locationX, y: nativeEvent.locationY });
      }}
      style={({ pressed }) => [
        isBare ? styles.bare : isGhost ? styles.ghost : isBright ? styles.bright : styles.quiet,
        fills && styles.fills,
        isWide && styles.wide,
        isWide && isGhost && styles.ghostWide,
        isBright && { backgroundColor: filled },
        isGhost && { backgroundColor: withAlpha(colours.text, 0.1) },
        pressed && styles.pressed,
        isDisabled && styles.pressed,
      ]}
      {...(label === undefined ? {} : { accessibilityLabel: label })}
    >
      {isBusy ? (
        <ActivityIndicator color={isBright || isGhost ? said : colours.accent} />
      ) : isBare ? (
        children
      ) : (
        <View style={styles.said}>
          {icon === undefined ? null : <Icon of={icon} size={18} colour={said} />}

          <Text
            style={[
              isBright ? styles.brightWord : isGhost ? styles.ghostWord : styles.quietWord,
              { color: said },
            ]}
          >
            {children}
          </Text>
        </View>
      )}
    </Pressable>
  );
};

Button.displayName = 'Button';

export { Button };
