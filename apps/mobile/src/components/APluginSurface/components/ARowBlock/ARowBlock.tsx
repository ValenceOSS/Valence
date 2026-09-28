import { Image, StyleSheet, View } from 'react-native';
import { ChevronRight } from '@keyline-icons/react-native';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { Words } from '@ValenceMobile/components/Words/Words';
import { PLUGIN_ICONS } from '@ValenceMobile/plugins/PLUGIN_ICONS';
import { pluginImageUrl } from '@ValenceClient/plugins/pluginImageUrl';
import { onThisServer } from '@ValenceMobile/platform/onThisServer';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { withAlpha } from '@ValenceMobile/theme/withAlpha';
import type { ARowBlockProps } from './ARowBlock.types';

const styles = StyleSheet.create({
  badge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  picture: { borderRadius: 8, height: 44, width: 44 },
  row: { alignItems: 'center', flexDirection: 'row', gap: 12, minHeight: 48, paddingVertical: 6 },
  words: { flex: 1, gap: 2 },
});

/**
 * One row of a plugin page: a picture or an icon, a line and a quieter line beneath it, a badge at
 * the end, and, where the row does something, the whole row to press.
 *
 * @param row - The row the plugin sent.
 * @param pluginId - The plugin, whose pictures it may show.
 * @param onAct - Told the row was pressed.
 * @param isActing - Whether a press is still being carried out.
 */
const ARowBlock = ({ row, pluginId, onAct, isActing }: ARowBlockProps) => {
  const colours = useTheColours();
  const inner = (
    <View style={styles.row}>
      {row.image === undefined ? (
        row.icon === undefined ? null : (
          <Icon of={PLUGIN_ICONS[row.icon]} size={22} colour={colours.text} />
        )
      ) : (
        <Image
          source={{ uri: onThisServer(pluginImageUrl(pluginId, row.image)) }}
          style={[styles.picture, { backgroundColor: colours.surfaceRaised }]}
          accessibilityIgnoresInvertColors
        />
      )}

      <View style={styles.words}>
        <Words lines={2}>{row.label}</Words>
        {row.detail === undefined ? null : (
          <Words size="small" tone="muted" lines={2}>
            {row.detail}
          </Words>
        )}
      </View>

      {row.badge === undefined ? null : (
        <View style={[styles.badge, { backgroundColor: withAlpha(colours.text, 0.1) }]}>
          <Words size="small" tone="muted">
            {row.badge}
          </Words>
        </View>
      )}

      {row.action === undefined ? null : (
        <Icon of={ChevronRight} size={18} colour={colours.textMuted} />
      )}
    </View>
  );
  const action = row.action;

  return action === undefined ? (
    inner
  ) : (
    <Button
      tone="bare"
      label={row.label}
      isDisabled={isActing}
      onPress={() => {
        onAct(action);
      }}
    >
      {inner}
    </Button>
  );
};

ARowBlock.displayName = 'ARowBlock';

export { ARowBlock };
