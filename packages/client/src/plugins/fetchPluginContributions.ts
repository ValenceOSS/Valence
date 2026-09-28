import { readFromServer } from '@ValenceClient/query/readFromServer';
import { profileHeaders } from '@ValenceClient/profiles/currentProfile';
import { PluginContributionsSchema } from '@ValenceContracts/schemas/Plugin';
import type { PluginContributions } from '@ValenceContracts/schemas/Plugin';

/**
 * What the plugins that are on add for whoever is asking: pages, panels and themes.
 *
 * @returns The contributions.
 */
const fetchPluginContributions = (): Promise<PluginContributions> =>
  readFromServer('/api/plugins/contributions', PluginContributionsSchema, profileHeaders());

export { fetchPluginContributions };
