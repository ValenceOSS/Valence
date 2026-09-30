import { changeOnServer } from '@ValenceClient/query/changeOnServer';
import { pluginPath } from '@ValenceClient/plugins/pluginPath';
import { say } from '@ValenceI18n/say';

/**
 * Turns a plugin on or off, or changes its settings. A secret setting left out keeps what it had;
 * one sent empty is cleared.
 *
 * @param pluginId - The plugin.
 * @param change - What to change.
 * @throws With the server's words where it refused.
 */
const changePlugin = async (
  pluginId: string,
  change: { isEnabled?: boolean; settings?: Record<string, string | boolean> },
): Promise<void> => {
  await changeOnServer(
    pluginPath(pluginId),
    { method: 'PATCH', json: change },
    say('client.plugins.changePlugin.thatPluginCouldNotBeChanged'),
  );
};

export { changePlugin };
