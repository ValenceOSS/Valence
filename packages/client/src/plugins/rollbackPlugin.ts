import { InstalledPluginSchema } from '@ValenceContracts/schemas/Plugin';
import { changeOnServer } from '@ValenceClient/query/changeOnServer';
import { pluginPath } from '@ValenceClient/plugins/pluginPath';
import type { InstalledPlugin } from '@ValenceContracts/schemas/Plugin';
import { say } from '@ValenceI18n/say';

/**
 * Puts back the version of a plugin an upgrade replaced, with what it kept as it was then.
 *
 * @param pluginId - The plugin.
 * @returns The plugin as it now is.
 * @throws With the server's words where there was nothing to go back to.
 */
const rollbackPlugin = async (pluginId: string): Promise<InstalledPlugin> =>
  InstalledPluginSchema.parse(
    await changeOnServer(
      `${pluginPath(pluginId)}/rollback`,
      { method: 'POST' },
      say('common.theEarlierVersionCouldNotBe'),
    ),
  );

export { rollbackPlugin };
