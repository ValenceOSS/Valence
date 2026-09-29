import { readFromServer } from '@ValenceClient/query/readFromServer';
import { PluginRemovalSchema } from '@ValenceContracts/schemas/Plugin';
import type { PluginRemoval } from '@ValenceContracts/schemas/Plugin';

/**
 * What removing a plugin would take with it: what it kept, who connected accounts to it, and what it
 * added to Valence.
 *
 * @param id - The plugin.
 * @returns What goes with it.
 */
const fetchPluginRemoval = (id: string): Promise<PluginRemoval> =>
  readFromServer(`/api/plugins/${encodeURIComponent(id)}/removal`, PluginRemovalSchema);

export { fetchPluginRemoval };
