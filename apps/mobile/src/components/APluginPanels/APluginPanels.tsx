import { StyleSheet, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { APluginPanel } from '@ValenceMobile/components/APluginPanels/components/APluginPanel/APluginPanel';
import { pluginQueries } from '@ValenceClient/query/pluginQueries';
import type { APluginPanelsProps } from './APluginPanels.types';

const styles = StyleSheet.create({
  panels: { gap: 16 },
});

/**
 * Every panel the plugins on this server add about one title, programme, album, artist or
 * playlist, in the order the server lists them. Where no plugin adds one, nothing is drawn.
 *
 * @param on - What kind of thing the panels are about.
 * @param subjectId - Which one.
 * @param onLookAt - Told to open a title's page, where the page they sit on can.
 */
const APluginPanels = ({ on, subjectId, onLookAt }: APluginPanelsProps) => {
  const contributions = useQuery(pluginQueries.contributions());
  const panels = (contributions.data?.panels ?? []).filter((panel) => panel.on === on);

  if (panels.length === 0) {
    return null;
  }

  return (
    <View style={styles.panels}>
      {panels.map((panel) => (
        <APluginPanel
          key={`${panel.pluginId}:${panel.panelId}`}
          pluginId={panel.pluginId}
          pluginName={panel.pluginName}
          panelId={panel.panelId}
          title={panel.title}
          on={on}
          subjectId={subjectId}
          onLookAt={onLookAt}
        />
      ))}
    </View>
  );
};

APluginPanels.displayName = 'APluginPanels';

export { APluginPanels };
