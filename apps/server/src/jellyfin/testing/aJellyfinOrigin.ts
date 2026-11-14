import type { JellyfinOrigin } from '@ValenceServer/jellyfin/JellyfinBackend';

/**
 * The request of a Jellyfin app on a phone, with whatever a test cares about changed.
 *
 * @param change - What differs.
 * @returns The request.
 */
const aJellyfinOrigin = (change: Partial<JellyfinOrigin> = {}): JellyfinOrigin => ({
  url: 'http://valence.test/jellyfin/Items',
  headers: new Headers({ 'user-agent': 'okhttp/4.12.0' }),
  client: {
    client: 'Findroid',
    device: 'Pixel 8',
    deviceId: 'pixel8abcdef',
    version: '0.15.0',
    token: 's.a-session',
  },
  send: () => Promise.resolve(new Response(null, { status: 404 })),
  ...change,
});

export { aJellyfinOrigin };
