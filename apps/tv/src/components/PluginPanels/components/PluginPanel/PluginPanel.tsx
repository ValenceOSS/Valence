import { StyleSheet, Text, View } from 'react-native';
import { usePluginSurface } from '@ValenceClient/plugins/usePluginSurface';
import { PluginSurface } from '@ValenceTv/components/PluginSurface/PluginSurface';
import { PluginNotice } from '@ValenceTv/components/PluginSurface/components/PluginNotice/PluginNotice';
import { TV_SURFACE_HOST } from '@ValenceTv/plugins/TV_SURFACE_HOST';
import { tokens } from '@ValenceTv/theme/tokens';
import type { PluginPanelProps } from './PluginPanel.types';

const styles = StyleSheet.create({
  from: { color: tokens.colours.muted, fontSize: tokens.type.small },
  panel: {
    borderColor: tokens.colours.line,
    borderRadius: tokens.radii.xl,
    borderWidth: 2,
    gap: tokens.space.sm,
    padding: tokens.space.md,
    width: tokens.ACTION_WIDTH * 1.5,
  },
  title: { color: tokens.colours.text, fontSize: tokens.type.body, fontWeight: '600' },
});

/**
 * One plugin's panel about the film or programme on the television, boxed and named for the plugin
 * that drew it, so nobody mistakes it for Valence's own. A panel that cannot be read is left out.
 *
 * @param pluginId - The plugin.
 * @param pluginName - What the plugin is called.
 * @param panelId - Which of its panels.
 * @param title - What the panel is called.
 * @param on - Whether it is about a film or a programme.
 * @param subjectId - Which one.
 */
const PluginPanel = ({ pluginId, pluginName, panelId, title, on, subjectId }: PluginPanelProps) => {
  const panel = usePluginSurface(
    { kind: 'panel', pluginId, panelId, on, subjectId },
    TV_SURFACE_HOST,
  );

  if (panel.surface === undefined) {
    return null;
  }

  return (
    <View style={styles.panel}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.from}>{`From ${pluginName}`}</Text>
      {panel.problem === null ? null : <PluginNotice tone="danger" text={panel.problem} />}
      <PluginSurface
        pluginId={pluginId}
        surface={panel.surface}
        onAct={panel.act}
        isActing={panel.isActing}
      />
    </View>
  );
};

PluginPanel.displayName = 'PluginPanel';

export { PluginPanel };
