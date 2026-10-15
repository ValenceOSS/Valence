import { StyleSheet, Text, View } from 'react-native';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { FONTS } from '@ValenceMobile/theme/FONTS';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { withAlpha } from '@ValenceCore/functions/withAlpha';
import type { ABadgeProps } from './ABadge.types';

const SUCCESS = '#3f9a4f';

const BUSY = '#d07a32';

const SOLID = '#303030';

const ON_SOLID = '#fdfdfd';

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
  words: { fontFamily: FONTS.sans.medium, fontSize: 12 },
});

/**
 * A short word about something, drawn as the web's badges are: a small rounded square, a genre on
 * solid grey, a programme's state in its own colour with a mark of its own, something somebody has
 * done in the accent, and the plain kind outlined.
 *
 * @param children - What it says.
 * @param tone - How it is coloured.
 * @param icon - A mark after the words, such as the one for a programme's state.
 */
const ABadge = ({ children, tone = 'plain', icon }: ABadgeProps) => {
  const colours = useTheColours();
  const tinted = (colour: string) => ({
    background: withAlpha(colour, 0.15),
    border: 'transparent',
    ink: colour,
  });
  const look =
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

  return (
    <View style={[styles.badge, { backgroundColor: look.background, borderColor: look.border }]}>
      <Text style={[styles.words, { color: look.ink }]}>{children}</Text>
      {icon === undefined ? null : <Icon of={icon} size={13} colour={look.ink} />}
    </View>
  );
};

ABadge.displayName = 'ABadge';

export { ABadge };
