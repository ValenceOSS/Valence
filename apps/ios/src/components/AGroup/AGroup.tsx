import { Children, Fragment } from 'react';
import { StyleSheet, View } from 'react-native';
import { Words } from '@ValencePhone/components/Words/Words';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import type { AGroupProps } from './AGroup.types';

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  line: { height: StyleSheet.hairlineWidth, marginLeft: 16 },
  title: { paddingHorizontal: 4 },
  whole: { gap: 8 },
});

/**
 * Settings that belong together, drawn as one rounded card with a line between each, as the phone's
 * own settings are.
 *
 * @param title - What the group is, said above it.
 */
const AGroup = ({ children, title }: AGroupProps) => {
  const colours = useTheColours();
  const rows = Children.toArray(children);

  return (
    <View style={styles.whole}>
      {title === undefined ? null : (
        <View style={styles.title}>
          <Words size="small" tone="muted">
            {title}
          </Words>
        </View>
      )}

      <View
        style={[
          styles.card,
          { backgroundColor: colours.surfaceRaised, borderColor: colours.border },
        ]}
      >
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
