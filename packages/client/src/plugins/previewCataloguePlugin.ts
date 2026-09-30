import { changeOnServer } from '@ValenceClient/query/changeOnServer';
import { pluginPath } from '@ValenceClient/plugins/pluginPath';
import { InstallPreviewSchema } from '@ValenceContracts/schemas/Plugin';
import type { InstallPreview } from '@ValenceContracts/schemas/Plugin';
import { say } from '@ValenceI18n/say';

/**
 * Has the server fetch and check an official plugin, and say what installing it would mean.
 *
 * @param pluginId - The plugin in the catalogue.
 * @returns What it would install and the permissions it would be given.
 * @throws With the server's words where it could not.
 */
const previewCataloguePlugin = async (pluginId: string): Promise<InstallPreview> =>
  InstallPreviewSchema.parse(
    await changeOnServer(
      pluginPath('catalogue', pluginId, 'preview'),
      { method: 'POST' },
      say('client.plugins.previewCataloguePlugin.thatPluginCouldNotBeFetched'),
    ),
  );

export { previewCataloguePlugin };
