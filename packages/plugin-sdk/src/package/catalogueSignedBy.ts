import { isSignedBy } from './isSignedBy';
import { readSignatureFile } from './readSignatureFile';

/**
 * Which trusted key signed a plugin catalogue, reading its signature file first; nothing in the
 * catalogue itself is looked at.
 *
 * @param bytes - The catalogue, exactly as it was published.
 * @param signatureText - Its signature file, as text.
 * @param keys - The public keys that may have signed it, by key id.
 * @returns The id of the key that signed it, or nothing where none did.
 */
const catalogueSignedBy = (
  bytes: Uint8Array,
  signatureText: string,
  keys: Readonly<Record<string, string>>,
): string | null => {
  const signature = readSignatureFile(signatureText);

  return signature === null ? null : isSignedBy(bytes, signature, keys);
};

export { catalogueSignedBy };
