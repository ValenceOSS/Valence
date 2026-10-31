import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PanelCard } from '@ValenceUI/PanelCard';
import { SettingList } from '@ValenceUI/SettingList';
import { SettingRow } from '@ValenceUI/SettingRow';
import { Switch } from '@ValenceUI/Switch';
import { pluginQueries } from '@ValenceClient/query/pluginQueries';
import { chooseHomeRow } from '@ValenceClient/plugins/chooseHomeRow';
import { say } from '@ValenceI18n/say';

/**
 * The rows the plugins on this server offer for the home page, each shown there only once this
 * profile turns it on, and named for the plugin it comes from. Not drawn at all where no plugin
 * offers one.
 */
const PluginHomeRowsPanel = () => {
  const queryClient = useQueryClient();
  const offered = useQuery(pluginQueries.homeRowChoices());
  const [busy, setBusy] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const rows = offered.data?.rows ?? [];

  if (rows.length === 0) {
    return null;
  }

  return (
    <PanelCard title={say('screens.accountArea.pluginHomeRowsPanel.homeRowsFromPlugins')} isFlush>
      <SettingList isInset>
        {rows.map((row) => {
          const key = `${row.pluginId}/${row.rowId}`;

          return (
            <SettingRow
              key={key}
              title={row.title}
              description={say('common.fromPluginName', { pluginName: row.pluginName })}
            >
              <Switch
                label={say('screens.accountArea.pluginHomeRowsPanel.showTitleOnHome', {
                  title: row.title,
                })}
                isLabelHidden
                isOn={row.isChosen}
                disabled={busy !== null}
                onToggle={() => {
                  setBusy(key);
                  setProblem(null);
                  void chooseHomeRow(row.pluginId, row.rowId, !row.isChosen)
                    .then(() =>
                      Promise.all([
                        queryClient.invalidateQueries({
                          queryKey: pluginQueries.homeRowChoices().queryKey,
                        }),
                        queryClient.invalidateQueries({
                          queryKey: pluginQueries.homeRows().queryKey,
                        }),
                      ]),
                    )
                    .catch((error: Error) => {
                      setProblem(error.message);
                    })
                    .finally(() => {
                      setBusy(null);
                    });
                }}
              />
            </SettingRow>
          );
        })}
      </SettingList>

      {problem === null ? null : (
        <p role="alert" className="px-5 pb-4 text-sm text-danger">
          {problem}
        </p>
      )}
    </PanelCard>
  );
};

PluginHomeRowsPanel.displayName = 'PluginHomeRowsPanel';

export { PluginHomeRowsPanel };
