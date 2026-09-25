import { platformInUse } from '@ValenceClient/platform/installPlatform';

const KEY = 'valence.tv.session';

/**
 * The session this television signs every request with, where it has one.
 *
 * A browser carries its session in a cookie the server set. This client keeps no cookie jar the
 * player and the socket both read, so the token a phone's approval handed back is kept on the device
 * instead and sent as a bearer with every request, every video segment and the realtime socket.
 *
 * @returns The token, or nothing where this television has not been signed in.
 */
const theSessionToken = (): string | null => {
  const held = platformInUse().store.read(KEY);

  return held === null || held === '' ? null : held;
};

/**
 * Keeps the token a sign-in handed back, or forgets it on the way out.
 *
 * @param token - The session's token, or nothing to forget it.
 */
const keepTheSessionToken = (token: string | null): void => {
  if (token === null) {
    platformInUse().store.forget(KEY);

    return;
  }

  platformInUse().store.write(KEY, token);
};

/**
 * The headers that sign a request as this television, for the requests the application does not
 * make through `fetch` itself — the player's and the socket's.
 *
 * @returns The header, or none where nobody is signed in.
 */
const signedHeaders = (): Record<string, string> => {
  const token = theSessionToken();

  // eslint-disable-next-line valence/no-hard-coded-strings -- an HTTP authorization scheme
  return token === null ? {} : { authorization: `Bearer ${token}` };
};

/**
 * The headers to fetch a picture or a file with: signed as whoever is signed in where it is served
 * by this Valence, and bare where it comes from anywhere else, so the session never reaches a third
 * party such as the film database a poster is served from.
 *
 * @param path - Where it is fetched from, a path on this Valence or a full address elsewhere.
 * @returns The headers to send.
 */
const signedHeadersFor = (path: string): Record<string, string> =>
  path.startsWith('/') ? signedHeaders() : {};

export { keepTheSessionToken, signedHeaders, signedHeadersFor, theSessionToken };
