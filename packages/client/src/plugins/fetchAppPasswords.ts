import { readFromServer } from '@ValenceClient/query/readFromServer';
import { pluginPath } from '@ValenceClient/plugins/pluginPath';
import { AppPasswordsSchema } from '@ValenceContracts/schemas/Plugin';
import type { AppPasswords } from '@ValenceContracts/schemas/Plugin';

/**
 * The app passwords the signed-in profile made for a plugin, and where apps reach that plugin.
 *
 * @param pluginId - The plugin.
 * @returns The address, the plugin's routes and the passwords, never their secrets.
 */
const fetchAppPasswords = (pluginId: string): Promise<AppPasswords> =>
  readFromServer(pluginPath(pluginId, 'app-passwords'), AppPasswordsSchema);

export { fetchAppPasswords };
