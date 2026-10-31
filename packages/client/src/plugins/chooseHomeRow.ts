import { changeOnServer } from '@ValenceClient/query/changeOnServer';
import { pluginPath } from '@ValenceClient/plugins/pluginPath';
import { say } from '@ValenceI18n/say';

/**
 * Shows one of a plugin's rows on this profile's home page, or stops showing it.
 *
 * @param pluginId - The plugin.
 * @param rowId - Its row.
 * @param isChosen - Whether to show it.
 * @throws With the server's words where it refused.
 */
const chooseHomeRow = async (pluginId: string, rowId: string, isChosen: boolean): Promise<void> => {
  await changeOnServer(
    pluginPath(pluginId, 'home-rows', rowId),
    { method: 'PUT', json: { isChosen } },
    say('client.plugins.chooseHomeRow.thatRowCouldNotBeChanged'),
  );
};

export { chooseHomeRow };
