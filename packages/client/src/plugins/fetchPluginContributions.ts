import { readFromServer } from '@ValenceClient/query/readFromServer';
import { PluginContributionsSchema } from '@ValenceContracts/schemas/Plugin';
import type { PluginContributions } from '@ValenceContracts/schemas/Plugin';
import { PANEL_PLACES } from '@ValenceSDK/manifest/PANEL_PLACES';

/**
 * What the plugins that are on add for whoever is asking: pages, panels and themes, with panels
 * for every place this build of Valence can draw one, so a server never sends an app a place it
 * was built before.
 *
 * @returns The contributions.
 */
const fetchPluginContributions = (): Promise<PluginContributions> =>
  readFromServer(
    `/api/plugins/contributions?places=${PANEL_PLACES.join(',')}`,
    PluginContributionsSchema,
  );

export { fetchPluginContributions };
