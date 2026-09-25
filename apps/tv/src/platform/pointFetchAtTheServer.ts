import { PLACEHOLDER } from '@ValenceClient/session/askTheServer';
import { signedHeaders } from '@ValenceTv/platform/theSessionToken';
import { theServersOrigin } from '@ValenceTv/platform/theServersOrigin';
import { describeThisTv } from '@ValenceTv/platform/describeThisTv';
import { appUserAgent } from '@ValenceCore/functions/appUserAgent';
import Constants from 'expo-constants';

const OURS = '/api/';

/**
 * Turns an address the application asked for into one on the server this television watches.
 *
 * Everything below a client asks for a path — `/api/profiles` — because in a browser the page's own
 * origin is the server. A television has none, so the path is put on the server here. The auth
 * library is the other case: it insists on a base it can build on, is handed a placeholder that goes
 * nowhere, and what it builds on that is moved onto the server the same way.
 *
 * Only Valence's own paths are moved. React Native asks for relative paths of its own in development,
 * and those belong to the bundler that asked.
 *
 * @param asked - The address the application asked for.
 * @returns The same address, on the server, or as it was where it is not Valence's.
 */
const atTheServer = (asked: string): string => {
  const path = asked.startsWith(PLACEHOLDER) ? asked.slice(PLACEHOLDER.length) : asked;
  const origin = theServersOrigin();

  return origin !== null && path.startsWith(OURS) ? `${origin}${path}` : path;
};

/**
 * Adds this television's session to a request's headers, unless the request already says who it is,
 * and says the request comes from the server's own origin, as a page the server served would. The
 * sign-in library refuses anything that changes a session — signing out, above all — without an
 * origin it trusts, and a browser always sends one where a television sends none. It names the
 * television too, so the devices signed in to an account list it by name.
 *
 * @param given - The headers the request was made with.
 * @returns The headers to send.
 */
const withTheSession = (given: HeadersInit | undefined): Headers => {
  const headers = new Headers(given);

  for (const [name, value] of Object.entries(signedHeaders())) {
    if (!headers.has(name)) {
      headers.set(name, value);
    }
  }

  const origin = theServersOrigin();

  if (origin !== null && !headers.has('origin')) {
    headers.set('origin', origin);
  }

  headers.set('user-agent', appUserAgent(describeThisTv(Constants.deviceName ?? null)));

  return headers;
};

/**
 * Puts a shim in front of the global `fetch`, once, on the way up, which aims every request the
 * application makes at the server and signs it as this television.
 *
 * The global is replaced rather than a client handed down because the application reaches for
 * `fetch` itself: a reader is a plain function called from a query, with nothing to inject into. A
 * request that arrives already built is rebuilt on the server's address with the same method, body
 * and headers.
 */
const pointFetchAtTheServer = (): void => {
  const send = globalThis.fetch.bind(globalThis);

  globalThis.fetch = (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
    if (input instanceof Request) {
      const aimed = new Request(atTheServer(input.url), input);

      return send(new Request(aimed, { headers: withTheSession(aimed.headers) }), init);
    }

    return send(atTheServer(String(input)), { ...init, headers: withTheSession(init?.headers) });
  };
};

export { atTheServer, pointFetchAtTheServer, withTheSession };
