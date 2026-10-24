import type { Said } from '@ValenceI18n/SaidSchema';
import type { TrustedKey } from '@ValenceContracts/schemas/Plugin';
import { saying } from '@ValenceI18n/saying';
import { publicKeyPemOf } from './publicKeyPemOf';
import { readTrustedKeysVariable } from './readTrustedKeysVariable';

type Keys = Readonly<Record<string, string>>;

type CreateTrustedKeysOptions = {
  official: Keys;
  variable: string;
  settings: {
    read: () => Promise<{ pluginTrustedKeys: readonly TrustedKey[] }>;
    write: (patch: { pluginTrustedKeys: TrustedKey[] }) => Promise<object>;
  };
  log: (message: string) => void;
};

type ListedKey = TrustedKey & { isFromVariable: boolean };

/**
 * The signing keys an operator trusts beside Valence's own: those `VALENCE_PLUGIN_TRUSTED_KEYS`
 * names, and those an administrator saved in the Plugins panel. A key can never take the id of one
 * of Valence's keys, so what it signs is never mistaken for official.
 *
 * @param options - Valence's own keys, the variable as set, where saved keys are kept, and a log.
 * @returns How to read every trusted key, list them, and save the ones kept in settings.
 */
const createTrustedKeys = ({ official, variable, settings, log }: CreateTrustedKeysOptions) => {
  const read = readTrustedKeysVariable(variable);
  const fromVariable = Object.fromEntries(
    Object.entries(read.keys).filter(([id]) => !Object.hasOwn(official, id)),
  );

  for (const id of read.unreadable) {
    log(`VALENCE_PLUGIN_TRUSTED_KEYS: ${id} was left out, as it isn't an id and an Ed25519 key`);
  }

  for (const id of Object.keys(read.keys).filter((each) => Object.hasOwn(official, each))) {
    log(
      `VALENCE_PLUGIN_TRUSTED_KEYS: ${id} was left out, as it is the id of one of Valence's keys`,
    );
  }

  const list = async (): Promise<ListedKey[]> => [
    ...Object.entries(fromVariable).map(([id, publicKey]) => ({
      id,
      publicKey,
      isFromVariable: true,
    })),
    ...(await settings.read()).pluginTrustedKeys
      .filter((key) => !Object.hasOwn(official, key.id) && !Object.hasOwn(fromVariable, key.id))
      .map((key) => ({ ...key, isFromVariable: false })),
  ];

  const all = async (): Promise<Keys> =>
    Object.fromEntries((await list()).map((key) => [key.id, key.publicKey]));

  const save = async (
    keys: readonly TrustedKey[],
  ): Promise<{ keys: ListedKey[] } | { problem: Said }> => {
    const seen = new Set<string>();
    const saved: TrustedKey[] = [];

    for (const key of keys) {
      if (Object.hasOwn(official, key.id)) {
        return { problem: saying('server.keys.trustedKeys.idIsOneOfValencesOwn', { id: key.id }) };
      }

      if (Object.hasOwn(fromVariable, key.id)) {
        return { problem: saying('server.keys.trustedKeys.idIsAlreadySetBy', { id: key.id }) };
      }

      if (seen.has(key.id)) {
        return { problem: saying('server.keys.trustedKeys.idIsListedTwice', { id: key.id }) };
      }

      const publicKey = publicKeyPemOf(key.publicKey);

      if (publicKey === null) {
        return { problem: saying('server.keys.trustedKeys.idIsNotAnEd25519', { id: key.id }) };
      }

      seen.add(key.id);
      saved.push({ id: key.id, publicKey });
    }

    await settings.write({ pluginTrustedKeys: saved });

    return { keys: await list() };
  };

  return { all, list, save };
};

type TrustedKeys = ReturnType<typeof createTrustedKeys>;

export type { TrustedKeys };

export { createTrustedKeys };
