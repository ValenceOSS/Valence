/* oxlint-disable valence/no-hard-coded-strings -- product names, which are never translated */
const PRODUCT = 'Valence';

/**
 * The headers every call to Plex or plex.tv carries: the token, which client is asking and what it
 * is called.
 *
 * @param token - The token to read with.
 * @param clientId - The identifier Plex knows this importer by.
 * @returns The headers.
 */
const plexHeadersOf = (token: string, clientId: string): Record<string, string> => ({
  'X-Plex-Token': token,
  'X-Plex-Client-Identifier': clientId,
  'X-Plex-Product': PRODUCT,
});

export { plexHeadersOf };
