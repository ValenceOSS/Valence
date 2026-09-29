import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TVFocusGuideView,
  View,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { usePluginSurface } from '@ValenceClient/plugins/usePluginSurface';
import { pluginQueries } from '@ValenceClient/query/pluginQueries';
import { Button } from '@ValenceTv/components/Button/Button';
import { PluginSurface } from '@ValenceTv/components/PluginSurface/PluginSurface';
import { PluginNotice } from '@ValenceTv/components/PluginSurface/components/PluginNotice/PluginNotice';
import { ScanToConnect } from '@ValenceTv/components/ScanToConnect/ScanToConnect';
import { useScanToOpen } from '@ValenceTv/plugins/useScanToOpen';
import { tokens } from '@ValenceTv/theme/tokens';
import type { PluginPageProps } from './PluginPage.types';

const styles = StyleSheet.create({
  page: { flex: 1 },
  inside: {
    paddingHorizontal: tokens.space.edge,
    paddingTop: tokens.space.xl + tokens.space.lg,
    paddingBottom: tokens.space.xl,
    gap: tokens.space.sm,
  },
  heading: { color: tokens.colours.text, fontSize: tokens.type.title, fontWeight: '700' },
  from: {
    color: tokens.colours.muted,
    fontSize: tokens.type.small,
    marginBottom: tokens.space.md,
  },
  away: { gap: tokens.space.sm, alignItems: 'flex-start' },
  nothing: { color: tokens.colours.text, fontSize: tokens.type.body },
});

/**
 * A page a plugin adds to somebody's account, opened from their account on the television and
 * drawn from the plugin's building blocks, named with the plugin it comes from. The remote lands
 * on the page as it opens. Where the page cannot be read, it says so and offers to try again.
 * Connecting an account is finished on a phone, from a code the page shows in its place.
 *
 * @param pluginId - The plugin.
 * @param pageId - Which of its pages.
 */
const PluginPage = ({ pluginId, pageId }: PluginPageProps) => {
  const contributions = useQuery(pluginQueries.contributions());
  const scanning = useScanToOpen();
  const page = usePluginSurface({ kind: 'page', pluginId, pageId }, scanning.host);
  const about = contributions.data?.pages.find(
    (each) => each.pluginId === pluginId && each.pageId === pageId,
  );

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.inside}>
      <Text style={styles.heading}>{about?.title ?? 'Plugin'}</Text>
      {about === undefined ? null : <Text style={styles.from}>{`From ${about.pluginName}`}</Text>}

      {page.problem === null ? null : <PluginNotice tone="danger" text={page.problem} />}

      <TVFocusGuideView autoFocus>
        {scanning.address !== null ? (
          <ScanToConnect address={scanning.address} onDone={scanning.done} />
        ) : page.surface !== undefined ? (
          <PluginSurface
            pluginId={pluginId}
            surface={page.surface}
            onAct={page.act}
            isActing={page.isActing}
          />
        ) : page.isError ? (
          <View style={styles.away}>
            <Text style={styles.nothing}>This page could not be read.</Text>
            <Button label="Try again" variant="secondary" hasPreferredFocus onPress={page.retry} />
          </View>
        ) : (
          <ActivityIndicator size="large" color={tokens.colours.text} />
        )}
      </TVFocusGuideView>
    </ScrollView>
  );
};

PluginPage.displayName = 'PluginPage';

export { PluginPage };
