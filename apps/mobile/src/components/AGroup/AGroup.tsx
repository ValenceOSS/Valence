import { Children, Fragment, useContext } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FONTS } from '@ValenceMobile/theme/FONTS';
import { GROUND } from '@ValenceMobile/theme/GROUND';
import { fillOn } from '@ValenceMobile/theme/fillOn';
import { theColours } from '@ValenceMobile/theme/theColours';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { AGroupProps } from './AGroup.types';

const styles = StyleSheet.create({
  card: { borderRadius: 16, overflow: 'hidden' },
  group: { gap: 8 },
  line: { height: StyleSheet.hairlineWidth, marginLeft: 16 },
  title: {
    fontFamily: FONTS.sans.medium,
    fontSize: 12,
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    textTransform: 'uppercase',
  },
});

/**
 * Settings that belong together, drawn as the phone's own settings draw them: the group's name in
 * small capitals above, and its rows on one solid rounded card with a hairline between each. On a
 * card that says what colour it is, the group's card takes the same fill a badge there does, so it
 * answers the colour beneath it.
 *
 * @param title - What the group is, said above it.
 */
const AGroup = ({ children, title }: AGroupProps) => {
  const colours = useTheColours();
  const isDark = colours.surface === theColours.dark.surface;
  const rows = Children.toArray(children);
  const ground = useContext(GROUND);

  return (
    <View style={styles.group}>
      {title === undefined ? null : (
        <Text style={[styles.title, { color: colours.textMuted }]}>{title}</Text>
      )}

      <View
        style={[
          styles.card,
          { backgroundColor: ground === null ? (isDark ? '#1c1c1e' : '#ffffff') : fillOn(ground) },
        ]}
      >
        {rows.map((row, at) => (
          <Fragment key={at}>
            {at === 0 ? null : (
              <View
                style={[
                  styles.line,
                  { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : colours.border },
                ]}
              />
            )}
            {row}
          </Fragment>
        ))}
      </View>
    </View>
  );
};

AGroup.displayName = 'AGroup';

export { AGroup };
