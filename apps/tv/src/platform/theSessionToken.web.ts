import type {
  keepTheSessionToken as keepOnTheTelevision,
  signedHeaders as signedOnTheTelevision,
  signedHeadersFor as signedForOnTheTelevision,
  theSessionToken as onTheTelevision,
} from '@ValenceTv/platform/theSessionToken';

/**
 * The session a television's browser signs requests with, which is none of the page's business: the
 * server set it in a cookie the page cannot read, as it does for the web app, and the browser sends
 * that cookie with every request to this Valence, the video and the socket included.
 *
 * @returns Nothing, always.
 */
const theSessionToken: typeof onTheTelevision = () => null;

/**
 * Keeps nothing, so a token a sign-in hands back is never left where any script on the page could
 * read it.
 */
const keepTheSessionToken: typeof keepOnTheTelevision = () => undefined;

/**
 * No headers, since the browser's cookie already signs every request.
 *
 * @returns None.
 */
const signedHeaders: typeof signedOnTheTelevision = () => ({});

/**
 * No headers, since the browser's cookie already signs every request to this Valence and is never
 * sent anywhere else.
 *
 * @returns None.
 */
const signedHeadersFor: typeof signedForOnTheTelevision = () => ({});

export { keepTheSessionToken, signedHeaders, signedHeadersFor, theSessionToken };
