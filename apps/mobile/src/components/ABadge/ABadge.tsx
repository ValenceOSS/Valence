import { useContext } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { FONTS } from '@ValenceMobile/theme/FONTS';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { withAlpha } from '@ValenceCore/functions/withAlpha';
import { fillOn } from '@ValenceMobile/theme/fillOn';
import { GROUND } from '@ValenceMobile/theme/GROUND';
import { theColours } from '@ValenceMobile/theme/theColours';
import type { ABadgeProps } from './ABadge.types';

const SUCCESS = '#3f9a4f';

const BUSY = '#d07a32';

const SOLID = '#100f13';

const ON_SOLID = '#fdfdfd';

const BRIGHT_SUCCESS = '#5fd27a';

const BRIGHT_BUSY = '#f2a25c';

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    height: 24,
    paddingHorizontal: 8,
  },
  large: { borderRadius: 8, height: 32, paddingHorizontal: 12 },
  largeWords: { fontFamily: FONTS.sans.bold, fontSize: 15 },
  words: { fontFamily: FONTS.sans.medium, fontSize: 12 },
});

/**
 * A short word about something, drawn as the web's badges are: a small rounded square, a genre in
 * white, a programme's state in its own colour with a mark of its own, something somebody has done
 * in the accent, and the plain kind outlined.
 *
 * On a dark page, or on a card that says what colour it is, the coloured kinds sit on a fill that
 * answers what is beneath them — a faint light one on near black, a see-through dark one on a colour
 * of its own — so the word reads on anything, as the web's badges over artwork do. On a plain light
 * page they keep their soft tints.
 *
 * @param children - What it says.
 * @param tone - How it is coloured.
 * @param icon - A mark after the words, such as the one for a programme's state.
 * @param isLarge - Whether it is drawn larger, as it is on a card about one title.
 */
const ABadge = ({ children, tone = 'plain', icon, isLarge = false }: ABadgeProps) => {
  const colours = useTheColours();
  const ground = useContext(GROUND);
  const isDarkTheme = colours.surface === theColours.dark.surface;
  const reacts = ground !== null || isDarkTheme;
  const fill = fillOn(ground ?? colours.surface);
  const onFill = (colour: string) => ({ background: fill, border: 'transparent', ink: colour });
  const tinted = (colour: string) => ({
    background: withAlpha(colour, 0.15),
    border: 'transparent',
    ink: colour,
  });
  const look = reacts
    ? tone === 'solid'
      ? onFill(ON_SOLID)
      : tone === 'accent'
        ? onFill(colours.accent)
        : tone === 'success'
          ? onFill(BRIGHT_SUCCESS)
          : tone === 'busy'
            ? onFill(BRIGHT_BUSY)
            : tone === 'danger'
              ? onFill(colours.danger)
              : null
    : null;
  const pastel =
    tone === 'solid'
      ? { background: SOLID, border: SOLID, ink: ON_SOLID }
      : tone === 'accent'
        ? tinted(colours.accent)
        : tone === 'success'
          ? tinted(SUCCESS)
          : tone === 'busy'
            ? tinted(BUSY)
            : tone === 'danger'
              ? tinted(colours.danger)
              : tone === 'quiet'
                ? {
                    background: withAlpha(colours.text, 0.08),
                    border: 'transparent',
                    ink: colours.textMuted,
                  }
                : { background: 'transparent', border: colours.border, ink: colours.text };
  const drawn = look ?? pastel;

  return (
    <View
      style={[
        styles.badge,
        isLarge && styles.large,
        { backgroundColor: drawn.background, borderColor: drawn.border },
      ]}
    >
      <Text style={[styles.words, isLarge && styles.largeWords, { color: drawn.ink }]}>
        {children}
      </Text>
      {icon === undefined ? null : <Icon of={icon} size={13} colour={drawn.ink} />}
    </View>
  );
};

ABadge.displayName = 'ABadge';

export { ABadge };
