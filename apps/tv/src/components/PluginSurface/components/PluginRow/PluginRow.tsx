import { StyleSheet, Text, View } from 'react-native';
import { pluginImageUrl } from '@ValenceClient/plugins/pluginImageUrl';
import { Artwork } from '@ValenceTv/components/Artwork/Artwork';
import { Focusable } from '@ValenceTv/components/Focusable/Focusable';
import { Icon } from '@ValenceTv/components/Icon/Icon';
import { PLUGIN_ICONS } from '@ValenceTv/plugins/PLUGIN_ICONS';
import { tokens } from '@ValenceTv/theme/tokens';
import type { PluginRowProps } from './PluginRow.types';

const PICTURE = 72;

const styles = StyleSheet.create({
  badge: {
    borderRadius: tokens.radii.round,
    paddingHorizontal: tokens.space.sm,
    paddingVertical: 4,
  },
  detail: { fontSize: tokens.type.small },
  focused: { backgroundColor: tokens.colours.text },
  label: { fontSize: tokens.type.body },
  picture: { borderRadius: tokens.radii.sm, height: PICTURE, width: PICTURE },
  row: {
    alignItems: 'center',
    borderRadius: tokens.radii.lg,
    flexDirection: 'row',
    gap: tokens.space.sm,
    paddingHorizontal: tokens.space.sm,
    paddingVertical: tokens.space.xs,
  },
  words: { flex: 1, gap: 4 },
});

/**
 * One row of a plugin page on the television: a picture or an icon, a line and a quieter one
 * beneath, a badge at the end, and, where the row does something, a row the remote can land on.
 *
 * @param row - The row the plugin sent.
 * @param pluginId - The plugin, whose pictures it may show.
 * @param onAct - Told the row was pressed.
 */
const PluginRow = ({ row, pluginId, onAct }: PluginRowProps) => {
  const draw = (isFocused: boolean) => {
    const ink = isFocused ? tokens.colours.onWhite : tokens.colours.text;

    return (
      <View style={[styles.row, isFocused && styles.focused]}>
        {row.image === undefined ? (
          row.icon === undefined ? null : (
            <Icon of={PLUGIN_ICONS[row.icon]} size={32} colour={ink} />
          )
        ) : (
          <Artwork path={pluginImageUrl(pluginId, row.image)} style={styles.picture} />
        )}

        <View style={styles.words}>
          <Text numberOfLines={1} style={[styles.label, { color: ink }]}>
            {row.label}
          </Text>
          {row.detail === undefined ? null : (
            <Text
              numberOfLines={2}
              style={[styles.detail, { color: isFocused ? ink : tokens.colours.muted }]}
            >
              {row.detail}
            </Text>
          )}
        </View>

        {row.badge === undefined ? null : (
          <View style={[styles.badge, { backgroundColor: tokens.colours.hover }]}>
            <Text style={[styles.detail, { color: ink }]}>{row.badge}</Text>
          </View>
        )}
      </View>
    );
  };
  const action = row.action;

  return action === undefined ? (
    draw(false)
  ) : (
    <Focusable
      label={row.label}
      onPress={() => {
        onAct(action);
      }}
    >
      {(isFocused) => draw(isFocused)}
    </Focusable>
  );
};

PluginRow.displayName = 'PluginRow';

export { PluginRow };
