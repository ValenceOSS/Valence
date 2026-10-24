import { publicKeyPemOf } from './publicKeyPemOf';

/**
 * Reads the keys an operator trusts from `VALENCE_PLUGIN_TRUSTED_KEYS`: pairs of a key id and its
 * public key, `id=key`, separated by commas or new lines.
 *
 * @param text - The variable as set.
 * @returns The keys it names, as SPKI PEM by id, and the ids or pairs that could not be read.
 */
const readTrustedKeysVariable = (
  text: string,
): { keys: Readonly<Record<string, string>>; unreadable: readonly string[] } => {
  const keys: Record<string, string> = {};
  const unreadable: string[] = [];

  for (const pair of text.split(/[,\n]/).map((each) => each.trim())) {
    if (pair === '') {
      continue;
    }

    const at = pair.indexOf('=');
    const id = at === -1 ? pair : pair.slice(0, at).trim();
    const pem = at === -1 ? null : publicKeyPemOf(pair.slice(at + 1));

    if (pem === null || !/^[a-z0-9-]{1,40}$/.test(id)) {
      unreadable.push(id);
      continue;
    }

    keys[id] = pem;
  }

  return { keys, unreadable };
};

export { readTrustedKeysVariable };
