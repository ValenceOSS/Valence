import { StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { pluginQueries } from '@ValenceClient/query/pluginQueries';
import { Button } from '@ValenceTv/components/Button/Button';
import * as Keyline from '@keyline-icons/react-native/fill';
import { glyphFor } from '@ValenceSDK/surface/glyphFor';
import { tokens } from '@ValenceTv/theme/tokens';
import type { PluginPagesProps } from './PluginPages.types';

const styles = StyleSheet.create({
  heading: { color: tokens.colours.text, fontSize: tokens.type.body, fontWeight: '600' },
  pages: { gap: tokens.space.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.space.sm },
});

/**
 * The pages plugins on this server add to somebody's account, each named with the plugin it comes
 * from, so nobody mistakes it for Valence's own. Where no plugin adds one, nothing is drawn.
 *
 * @param onOpen - Told which page was chosen.
 * @param onFocus - Told when the remote lands on one of them.
 */
const PluginPages = ({ onOpen, onFocus }: PluginPagesProps) => {
  const contributions = useQuery(pluginQueries.contributions());
  const pages = (contributions.data?.pages ?? []).filter((page) => page.placement === 'account');

  if (pages.length === 0) {
    return null;
  }

  return (
    <View style={styles.pages}>
      <Text style={styles.heading}>From your plugins</Text>

      <View style={styles.row}>
        {pages.map((page) => (
          <Button
            key={`${page.pluginId}:${page.pageId}`}
            label={page.title}
            detail={page.pluginName}
            variant="secondary"
            {...(page.icon === null ? {} : { icon: glyphFor(Keyline, page.icon) })}
            {...(onFocus === undefined ? {} : { onFocus })}
            onPress={() => {
              onOpen({ pluginId: page.pluginId, pageId: page.pageId });
            }}
          />
        ))}
      </View>
    </View>
  );
};

PluginPages.displayName = 'PluginPages';

export { PluginPages };
