import { StyleSheet, View } from 'react-native';
import { Words } from '@ValenceMobile/components/Words/Words';
import { APluginSurface } from '@ValenceMobile/components/APluginSurface/APluginSurface';
import { ANoticeBlock } from '@ValenceMobile/components/APluginSurface/components/ANoticeBlock/ANoticeBlock';
import { usePluginSurface } from '@ValenceClient/plugins/usePluginSurface';
import { PHONE_SURFACE_HOST } from '@ValenceMobile/plugins/PHONE_SURFACE_HOST';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { withAlpha } from '@ValenceMobile/theme/withAlpha';
import type { APluginPanelProps } from './APluginPanel.types';
import { say } from '@ValenceI18n/say';

const styles = StyleSheet.create({
  panel: { borderRadius: 16, borderWidth: 1, gap: 12, padding: 16 },
  title: { gap: 2 },
});

/**
 * One plugin's panel about the title, programme, album, artist or playlist on screen, boxed and
 * named for the plugin that drew it, so nobody mistakes it for Valence's own. A panel that cannot be
 * read is left out rather than drawn broken.
 *
 * @param pluginId - The plugin.
 * @param pluginName - What the plugin is called.
 * @param panelId - Which of its panels.
 * @param title - What the panel is called.
 * @param on - What kind of thing it is about.
 * @param subjectId - Which one.
 * @param onLookAt - Told to open a title's page, where the page it sits on can.
 */
const APluginPanel = ({
  pluginId,
  pluginName,
  panelId,
  title,
  on,
  subjectId,
  onLookAt,
}: APluginPanelProps) => {
  const colours = useTheColours();
  const panel = usePluginSurface(
    { kind: 'panel', pluginId, panelId, on, subjectId },
    PHONE_SURFACE_HOST,
  );

  if (panel.surface === undefined) {
    return null;
  }

  return (
    <View style={[styles.panel, { borderColor: withAlpha(colours.text, 0.12) }]}>
      <View style={styles.title}>
        <Words isStrong>{title}</Words>
        <Words size="small" tone="muted">
          {say('common.fromPluginName', { pluginName })}
        </Words>
      </View>

      {panel.problem === null ? null : <ANoticeBlock tone="danger" text={panel.problem} />}

      <APluginSurface
        pluginId={pluginId}
        surface={panel.surface}
        onAct={panel.act}
        isActing={panel.isActing}
        {...(onLookAt === undefined ? {} : { onLookAt })}
      />
    </View>
  );
};

APluginPanel.displayName = 'APluginPanel';

export { APluginPanel };
