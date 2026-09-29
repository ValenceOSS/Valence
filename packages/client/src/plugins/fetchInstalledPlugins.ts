import { readFromServer } from '@ValenceClient/query/readFromServer';
import { InstalledPluginsSchema } from '@ValenceContracts/schemas/Plugin';
import type { InstalledPlugins } from '@ValenceContracts/schemas/Plugin';

/**
 * Every plugin this server has installed, whether it is on, and how it is getting on, with the
 * address outside services send somebody back to after they connect an account.
 *
 * @returns The plugins, and the redirect address, where the server has one.
 */
const fetchInstalledPlugins = (): Promise<InstalledPlugins> =>
  readFromServer('/api/plugins', InstalledPluginsSchema);

export { fetchInstalledPlugins };
