import { readFromServer } from '@ValenceClient/query/readFromServer';
import { PluginHomeRowChoicesSchema } from '@ValenceContracts/schemas/Plugin';
import type { PluginHomeRowChoices } from '@ValenceContracts/schemas/Plugin';

/**
 * Every row the plugins that are turned on offer for the home page, and whether this profile
 * chose it.
 *
 * @returns The rows on offer.
 */
const fetchPluginHomeRowChoices = (): Promise<PluginHomeRowChoices> =>
  readFromServer('/api/plugins/home-row-choices', PluginHomeRowChoicesSchema);

export { fetchPluginHomeRowChoices };
