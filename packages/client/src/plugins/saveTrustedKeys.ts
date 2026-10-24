import { z } from 'zod';
import { TrustedKeySchema } from '@ValenceContracts/schemas/Plugin';
import { changeOnServer } from '@ValenceClient/query/changeOnServer';
import type { InstalledPlugins, TrustedKey } from '@ValenceContracts/schemas/Plugin';
import { say } from '@ValenceI18n/say';

const SavedKeysSchema = z.object({
  keys: z.array(TrustedKeySchema.extend({ isFromVariable: z.boolean() })),
});

/**
 * Sets the signing keys the server trusts beside Valence's own, replacing the ones saved before.
 * Keys the server's environment sets stay whatever is sent.
 *
 * @param keys - Every key to keep, each pasted as its public key file or the line inside it.
 * @returns Every key the server now trusts.
 * @throws With the server's words where a key could not be kept.
 */
const saveTrustedKeys = async (
  keys: readonly TrustedKey[],
): Promise<InstalledPlugins['trustedKeys']> =>
  SavedKeysSchema.parse(
    await changeOnServer(
      '/api/plugins/trusted-keys',
      {
        method: 'PUT',
        json: { keys: keys.map((key) => ({ id: key.id, publicKey: key.publicKey })) },
      },
      say('client.plugins.saveTrustedKeys.theKeysCouldNotBeSaved'),
    ),
  ).keys;

export { saveTrustedKeys };
