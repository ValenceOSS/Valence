/**
 * The client data a passkey signs, written as a browser on the server's own page would write it.
 *
 * The origin is the server's, because that is where this client's requests arrive from as far as the
 * server is concerned — the window's own `valence://app` is an address the server has never heard of,
 * and the proxy already says the server's origin on every request it carries.
 *
 * @param type - Whether this signs in or makes a passkey.
 * @param challenge - The challenge the server sent, as it sent it.
 * @param server - Where the server is.
 * @returns The client data, as the JSON the authenticator hashes.
 */
const aClientData = (
  type: 'webauthn.get' | 'webauthn.create',
  challenge: string,
  server: string,
): string =>
  JSON.stringify({ type, challenge, origin: new URL(server).origin, crossOrigin: false });

export { aClientData };
