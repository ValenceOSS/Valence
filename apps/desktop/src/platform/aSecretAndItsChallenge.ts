/**
 * Writes bytes out as hex.
 *
 * @param bytes - What to write.
 * @returns The hex.
 */
const inHex = (bytes: Uint8Array): string =>
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');

/**
 * Makes a secret for a sign-in handed back from a page, and the challenge that may be said out loud
 * in its place: the SHA-256 of the secret, in hex, as the server works it out.
 *
 * The page is sent the challenge and this window keeps the secret, so the code the page hands back is
 * no use to anything that catches it on the way.
 *
 * @returns The secret and its challenge.
 */
const aSecretAndItsChallenge = async (): Promise<{ secret: string; challenge: string }> => {
  const secret = inHex(crypto.getRandomValues(new Uint8Array(32)));
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret));

  return { secret, challenge: inHex(new Uint8Array(digest)) };
};

export { aSecretAndItsChallenge };
