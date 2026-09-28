import { changeOnServer } from '@ValenceClient/query/changeOnServer';
import { pluginPath } from '@ValenceClient/plugins/pluginPath';

/**
 * Uninstalls a plugin, and with it everything it kept and every account connected to it.
 *
 * @param pluginId - The plugin.
 * @throws With the server's words where it refused.
 */
const removePlugin = async (pluginId: string): Promise<void> => {
  await changeOnServer(
    pluginPath(pluginId),
    { method: 'DELETE' },
    'That plugin could not be removed.',
  );
};

export { removePlugin };
