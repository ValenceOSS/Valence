import { changeOnServer } from '@ValenceClient/query/changeOnServer';
import { pluginPath } from '@ValenceClient/plugins/pluginPath';
import { MadeAppPasswordSchema } from '@ValenceContracts/schemas/Plugin';
import type { MadeAppPassword } from '@ValenceContracts/schemas/Plugin';
import { say } from '@ValenceI18n/say';

/**
 * Makes an app password for a plugin and answers with its secret, which the server shows only this
 * once.
 *
 * @param pluginId - The plugin.
 * @param label - What the password is for, such as the app it goes into.
 * @returns The password, its secret and where the app reaches the plugin.
 * @throws With the server's words where it refused.
 */
const makeAppPassword = async (pluginId: string, label: string): Promise<MadeAppPassword> =>
  MadeAppPasswordSchema.parse(
    await changeOnServer(
      pluginPath(pluginId, 'app-passwords'),
      { method: 'POST', json: { label } },
      say('client.plugins.makeAppPassword.thatAppPasswordCouldNotBeMade'),
    ),
  );

export { makeAppPassword };
