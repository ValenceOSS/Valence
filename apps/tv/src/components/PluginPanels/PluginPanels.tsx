import { StyleSheet, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { pluginQueries } from '@ValenceClient/query/pluginQueries';
import { PluginPanel } from '@ValenceTv/components/PluginPanels/components/PluginPanel/PluginPanel';
import { tokens } from '@ValenceTv/theme/tokens';
import type { PluginPanelsProps } from './PluginPanels.types';

const styles = StyleSheet.create({
  panels: {
    gap: tokens.space.md,
    paddingHorizontal: tokens.space.edge,
    paddingVertical: tokens.space.lg,
  },
});

/**
 * Every panel the plugins on this server add about the film or programme on the television, below
 * its page. Where no plugin adds one, nothing is drawn.
 *
 * @param on - Whether the page is a film's or a programme's.
 * @param subjectId - Which one.
 */
const PluginPanels = ({ on, subjectId }: PluginPanelsProps) => {
  const contributions = useQuery(pluginQueries.contributions());
  const panels = (contributions.data?.panels ?? []).filter((panel) => panel.on === on);

  if (panels.length === 0) {
    return null;
  }

  return (
    <View style={styles.panels}>
      {panels.map((panel) => (
        <PluginPanel
          key={`${panel.pluginId}:${panel.panelId}`}
          pluginId={panel.pluginId}
          pluginName={panel.pluginName}
          panelId={panel.panelId}
          title={panel.title}
          on={on}
          subjectId={subjectId}
        />
      ))}
    </View>
  );
};

PluginPanels.displayName = 'PluginPanels';

export { PluginPanels };
