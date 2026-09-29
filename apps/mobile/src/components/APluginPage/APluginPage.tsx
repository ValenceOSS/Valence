import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Words } from '@ValenceMobile/components/Words/Words';
import { APluginSurface } from '@ValenceMobile/components/APluginSurface/APluginSurface';
import { ANoticeBlock } from '@ValenceMobile/components/APluginSurface/components/ANoticeBlock/ANoticeBlock';
import { usePluginSurface } from '@ValenceClient/plugins/usePluginSurface';
import { PHONE_SURFACE_HOST } from '@ValenceMobile/plugins/PHONE_SURFACE_HOST';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { APluginPageProps } from './APluginPage.types';

const styles = StyleSheet.create({
  page: { gap: 14 },
  waiting: { alignItems: 'center', gap: 12, paddingVertical: 32 },
});

/**
 * A page a plugin adds to somebody's account, read from the server and drawn from its building
 * blocks. Where the plugin cannot be reached, the page says so in the app's own words, never the
 * plugin's error, with a way to try again.
 *
 * @param pluginId - The plugin.
 * @param pageId - Which of its pages.
 * @param onLookAt - Told to open a title's page, where the page it sits on can.
 */
const APluginPage = ({ pluginId, pageId, onLookAt }: APluginPageProps) => {
  const colours = useTheColours();
  const page = usePluginSurface({ kind: 'page', pluginId, pageId }, PHONE_SURFACE_HOST);

  if (page.surface === undefined) {
    return (
      <View style={styles.waiting}>
        {page.isError ? (
          <>
            <Words tone="muted" isCentred>
              This page could not be read from the plugin.
            </Words>
            <Button tone="ghost" onPress={page.retry}>
              Try again
            </Button>
          </>
        ) : (
          <ActivityIndicator color={colours.textMuted} accessibilityLabel="Reading the page" />
        )}
      </View>
    );
  }

  return (
    <View style={styles.page}>
      {page.problem === null ? null : <ANoticeBlock tone="danger" text={page.problem} />}
      <APluginSurface
        pluginId={pluginId}
        surface={page.surface}
        onAct={page.act}
        isActing={page.isActing}
        {...(onLookAt === undefined ? {} : { onLookAt })}
      />
    </View>
  );
};

APluginPage.displayName = 'APluginPage';

export { APluginPage };
