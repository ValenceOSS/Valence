import { createJellyfinApp } from '@ValenceServer/jellyfin/createJellyfinApp';
import { jellyfinRouteOf } from '@ValenceServer/jellyfin/jellyfinRouteOf';
import { lowerKeysOf } from '@ValenceServer/jellyfin/lowerKeysOf';
import { readJellyfinClient } from '@ValenceServer/jellyfin/readJellyfinClient';
import { aJellyfinBackend } from '@ValenceServer/jellyfin/testing/aJellyfinBackend';

const AUTHORIZATION =
  'MediaBrowser Client="Findroid", Device="Pixel 8", DeviceId="pixel8abcdef", Version="0.15.0"';

/**
 * The Jellyfin endpoints over the stand-in for Valence, asked as an app on a phone would ask them,
 * signed in unless a test says otherwise.
 *
 * @returns How to ask, and what the stand-in recorded.
 */
const aJellyfinServer = () => {
  const made = aJellyfinBackend();
  const jellyfin = createJellyfinApp(made.backend);

  const ask = (path: string, init: RequestInit & { token?: string | null } = {}) => {
    const { token = 's.a-session', ...rest } = init;
    const url = new URL(`http://valence.test/jellyfin${path}`);
    const headers = new Headers(rest.headers);

    headers.set(
      'authorization',
      token === null ? AUTHORIZATION : `${AUTHORIZATION}, Token="${token}"`,
    );

    const query = lowerKeysOf(
      Object.fromEntries(
        [...url.searchParams.keys()].map((key) => [key, url.searchParams.getAll(key)]),
      ),
    );

    return jellyfin.answer(
      new Request(new URL(`${jellyfinRouteOf(url.pathname)}${url.search}`, url), {
        ...rest,
        headers,
      }),
      {
        url: url.toString(),
        headers,
        client: readJellyfinClient(headers, query),
        send: () => Promise.resolve(new Response(null, { status: 404 })),
      },
    );
  };

  const post = (path: string, body: object, token?: string | null) =>
    ask(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      ...(token === undefined ? {} : { token }),
    });

  return { ...made, ask, post };
};

export { aJellyfinServer };
