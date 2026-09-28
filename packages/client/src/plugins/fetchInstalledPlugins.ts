import { z } from 'zod';
import { readFromServer } from '@ValenceClient/query/readFromServer';
import { InstalledPluginSchema } from '@ValenceContracts/schemas/Plugin';
import type { InstalledPlugin } from '@ValenceContracts/schemas/Plugin';

/**
 * Every plugin this server has installed, whether it is on, and how it is getting on.
 *
 * @returns The plugins.
 */
const fetchInstalledPlugins = (): Promise<InstalledPlugin[]> =>
  readFromServer('/api/plugins', z.array(InstalledPluginSchema));

export { fetchInstalledPlugins };
