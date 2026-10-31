import { changeOnServer } from '@ValenceClient/query/changeOnServer';
import { pluginPath } from '@ValenceClient/plugins/pluginPath';
import { say } from '@ValenceI18n/say';

/**
 * Removes an app password, so the app it was given to can no longer reach the plugin.
 *
 * @param pluginId - The plugin.
 * @param passwordId - The password.
 * @throws With the server's words where it refused.
 */
const removeAppPassword = async (pluginId: string, passwordId: string): Promise<void> => {
  await changeOnServer(
    pluginPath(pluginId, 'app-passwords', passwordId),
    { method: 'DELETE' },
    say('client.plugins.removeAppPassword.thatAppPasswordCouldNotBeRemoved'),
  );
};

export { removeAppPassword };
