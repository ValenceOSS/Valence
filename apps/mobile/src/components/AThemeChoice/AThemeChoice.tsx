import { StyleSheet, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Check } from '@keyline-icons/react-native';
import { readTheme } from '@ValenceClient/shell/theme';
import { useTheme } from '@ValenceClient/shell/useTheme';
import { AGroup } from '@ValenceMobile/components/AGroup/AGroup';
import { Button } from '@ValenceMobile/components/Button/Button';
import { SegmentedRow } from '@ValenceMobile/components/SegmentedRow/SegmentedRow';
import { Words } from '@ValenceMobile/components/Words/Words';
import { keepPluginTheme } from '@ValenceClient/plugins/keepPluginTheme';
import { usePluginThemeChoice } from '@ValenceClient/plugins/usePluginThemeChoice';
import { pluginQueries } from '@ValenceClient/query/pluginQueries';

const SCHEMES = [
  { id: 'system', label: 'System' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
] as const;

const styles = StyleSheet.create({
  themes: { gap: 8 },
});

/**
 * How the app looks on this phone: light, dark or following the phone, and, where plugins on this
 * server offer themes, whose colours to draw in. A theme's colours were checked for legibility
 * before the server accepted it, and are only ever colours: a theme cannot change what the app
 * does, only how it looks.
 */
const AThemeChoice = () => {
  const { theme, choose } = useTheme();
  const plugin = usePluginThemeChoice();
  const contributions = useQuery(pluginQueries.contributions());
  const themes = contributions.data?.themes ?? [];

  return (
    <AGroup title="Look">
      <SegmentedRow
        label="Light or dark"
        items={SCHEMES}
        value={theme}
        onSelect={(said) => {
          choose(readTheme(said));
        }}
      />

      {themes.length === 0 ? null : (
        <View style={styles.themes}>
          <Words size="small" tone="muted">
            Themes from plugins
          </Words>

          <Button
            tone={plugin.choice === null ? 'bold' : 'ghost'}
            isWide
            isChosen={plugin.choice === null}
            {...(plugin.choice === null ? { icon: Check } : {})}
            onPress={() => {
              keepPluginTheme('', null);
              plugin.choose(null);
            }}
          >
            Valence
          </Button>

          {themes.map((each) => {
            const id = `${each.pluginId}/${each.id}`;
            const isChosen = plugin.choice === id;

            return (
              <Button
                key={id}
                tone={isChosen ? 'bold' : 'ghost'}
                isWide
                isChosen={isChosen}
                label={`${each.name}, from ${each.pluginName}`}
                {...(isChosen ? { icon: Check } : {})}
                onPress={() => {
                  keepPluginTheme(each.pluginId, each);
                  plugin.choose(id);
                }}
              >
                {each.name}
              </Button>
            );
          })}
        </View>
      )}
    </AGroup>
  );
};

AThemeChoice.displayName = 'AThemeChoice';

export { AThemeChoice };
