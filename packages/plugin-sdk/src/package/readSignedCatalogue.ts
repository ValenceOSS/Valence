import { CatalogueSchema } from './CatalogueSchema';
import { catalogueSignedBy } from './catalogueSignedBy';
import type { Catalogue } from './CatalogueSchema';

/**
 * Reads a plugin catalogue only once its signature holds against one of the given keys, and only
 * as far as it matches the catalogue's schema; nothing in it is looked at before the signature is.
 *
 * @param bytes - The catalogue, exactly as it was published.
 * @param signatureText - Its signature file, as text.
 * @param keys - The public keys that may have signed it, by key id.
 * @returns The catalogue, or why it was not read.
 */
const readSignedCatalogue = (
  bytes: Uint8Array,
  signatureText: string,
  keys: Readonly<Record<string, string>>,
): { catalogue: Catalogue } | { problem: 'unsigned' | 'unreadable' } => {
  if (catalogueSignedBy(bytes, signatureText, keys) === null) {
    return { problem: 'unsigned' };
  }

  try {
    const read = CatalogueSchema.safeParse(JSON.parse(Buffer.from(bytes).toString('utf8')));

    return read.success ? { catalogue: read.data } : { problem: 'unreadable' };
  } catch {
    return { problem: 'unreadable' };
  }
};

export { readSignedCatalogue };
