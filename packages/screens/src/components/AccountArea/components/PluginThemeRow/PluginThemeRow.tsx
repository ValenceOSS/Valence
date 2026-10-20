import { useQuery } from '@tanstack/react-query';
import { OptionMenu } from '@ValenceUI/OptionMenu';
import { SettingRow } from '@ValenceUI/SettingRow';
import { pluginQueries } from '@ValenceClient/query/pluginQueries';
import { say } from '@ValenceI18n/say';
import type { PluginThemeRowProps } from './PluginThemeRow.types';

const OWN = 'valence';

/**
 * A choice of the colour themes plugins on this server offer, beside Valence's own, kept on this
 * device like the light and dark choice above it once the editor it sits in is saved. Not drawn at
 * all where no plugin offers one.
 *
 * @param choice - The plugin theme chosen so far, written as `plugin/theme`, or nothing.
 * @param onChoose - Told which was chosen, or nothing for Valence's own.
 */
const PluginThemeRow = ({ choice, onChoose }: PluginThemeRowProps) => {
  const asked = useQuery(pluginQueries.contributions());
  const themes = asked.data?.themes ?? [];

  if (themes.length === 0) {
    return null;
  }

  const options = [
    {
      id: OWN,
      label: say('common.valence'),
      detail: say('screens.accountArea.pluginThemeRow.theColoursValenceComesWith'),
    },
    ...themes.map((theme) => ({
      id: `${theme.pluginId}/${theme.id}`,
      label: theme.name,
      detail: say('common.fromPluginName', { pluginName: theme.pluginName }),
    })),
  ];
  const selected = options.some((option) => option.id === choice) ? (choice ?? OWN) : OWN;

  return (
    <SettingRow
      title={say('common.colours')}
      description={say('screens.accountArea.pluginThemeRow.aThemeFromAPluginReplaces')}
    >
      <OptionMenu
        label={say('common.colours')}
        triggerShape="field"
        align="end"
        trigger={options.find((option) => option.id === selected)?.label ?? say('common.valence')}
        groups={[
          {
            name: say('common.colours'),
            options,
            selectedId: selected,
            onSelect: (id) => {
              onChoose(id === OWN ? null : id);
            },
          },
        ]}
      />
    </SettingRow>
  );
};

PluginThemeRow.displayName = 'PluginThemeRow';

export { PluginThemeRow };
