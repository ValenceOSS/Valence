import { verifySignature } from '@ValenceSDK/package/verifySignature';

/**
 * Which of the trusted keys, if any, signed some bytes — the key named where one was named, and
 * otherwise any of them.
 *
 * @param bytes - What was signed.
 * @param signature - The signature, and the key it names.
 * @param keys - The trusted public keys, by id.
 * @returns The id of the key that signed them, or nothing.
 */
const isSignedBy = (
  bytes: Uint8Array,
  signature: { keyId: string | null; signature: string },
  keys: Readonly<Record<string, string>>,
): string | null => {
  const candidates =
    signature.keyId === null
      ? Object.entries(keys)
      : Object.entries(keys).filter(([id]) => id === signature.keyId);

  return (
    candidates.find(([, pem]) => verifySignature(bytes, signature.signature, pem))?.[0] ?? null
  );
};

export { isSignedBy };
