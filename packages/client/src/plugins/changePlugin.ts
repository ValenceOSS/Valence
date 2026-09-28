import { changeOnServer } from '@ValenceClient/query/changeOnServer';
import { pluginPath } from '@ValenceClient/plugins/pluginPath';

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
    'That plugin could not be changed.',
  );
};

export { changePlugin };
