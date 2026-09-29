import { useQuery } from '@tanstack/react-query';
import { OptionMenu } from '@ValenceUI/OptionMenu';
import { SettingRow } from '@ValenceUI/SettingRow';
import { usePluginThemeChoice } from '@ValenceClient/plugins/usePluginThemeChoice';
import { pluginQueries } from '@ValenceClient/query/pluginQueries';

const OWN = 'valence';

/**
 * A choice of the colour themes plugins on this server offer, beside Valence's own, kept on this
 * device like the light and dark choice above it. Not drawn at all where no plugin offers one.
 */
const PluginThemeRow = () => {
  const asked = useQuery(pluginQueries.contributions());
  const { choice, choose } = usePluginThemeChoice();
  const themes = asked.data?.themes ?? [];

  if (themes.length === 0) {
    return null;
  }

  const options = [
    { id: OWN, label: 'Valence', detail: 'The colours Valence comes with' },
    ...themes.map((theme) => ({
      id: `${theme.pluginId}/${theme.id}`,
      label: theme.name,
      detail: `From ${theme.pluginName}`,
    })),
  ];
  const selected = options.some((option) => option.id === choice) ? (choice ?? OWN) : OWN;

  return (
    <SettingRow
      title="Colours"
      description="A theme from a plugin replaces Valence’s colours and corners on this device. It follows the light or dark choice above where it offers both."
    >
      <OptionMenu
        label="Colours"
        triggerShape="field"
        align="end"
        trigger={options.find((option) => option.id === selected)?.label ?? 'Valence'}
        groups={[
          {
            name: 'Colours',
            options,
            selectedId: selected,
            onSelect: (id) => {
              choose(id === OWN ? null : id);
            },
          },
        ]}
      />
    </SettingRow>
  );
};

PluginThemeRow.displayName = 'PluginThemeRow';

export { PluginThemeRow };
