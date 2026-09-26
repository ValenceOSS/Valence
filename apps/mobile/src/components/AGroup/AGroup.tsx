import { Children, Fragment } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FONTS } from '@ValenceMobile/theme/FONTS';
import { theColours } from '@ValenceMobile/theme/theColours';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { AGroupProps } from './AGroup.types';

const styles = StyleSheet.create({
  face: { borderRadius: 12, overflow: 'hidden' },
  line: { height: StyleSheet.hairlineWidth, marginLeft: 16 },
  shell: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 4 },
  title: {
    fontFamily: FONTS.sans.medium,
    fontSize: 12,
    letterSpacing: 1.9,
    paddingBottom: 10,
    paddingHorizontal: 12,
    paddingTop: 10,
    textTransform: 'uppercase',
  },
});

/**
 * Settings that belong together, drawn as the web draws its panels: a faint shell with the group's
 * name in small capitals across its top, holding one raised face with a line between each setting.
 *
 * @param title - What the group is, said at the top of it.
 */
const AGroup = ({ children, title }: AGroupProps) => {
  const colours = useTheColours();
  const isDark = colours.surface === theColours.dark.surface;
  const rows = Children.toArray(children);

  return (
    <View
      style={[
        styles.shell,
        {
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(48, 60, 81, 0.05)',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : colours.border,
        },
      ]}
    >
      {title === undefined ? null : (
        <Text style={[styles.title, { color: colours.textMuted }]}>{title}</Text>
      )}

      <View style={[styles.face, { backgroundColor: isDark ? '#2b2b2b' : colours.surface }]}>
        {rows.map((row, at) => (
          <Fragment key={at}>
            {at === 0 ? null : <View style={[styles.line, { backgroundColor: colours.border }]} />}
            {row}
          </Fragment>
        ))}
      </View>
    </View>
  );
};

AGroup.displayName = 'AGroup';

export { AGroup };
