import type { ValenceHost } from '@ValenceSDK/host/ValenceHost';

/**
 * Stands in for what a plugin's handlers are given, for a test to call a handler directly. Each part
 * a test does not supply refuses, so a handler reaching for something it should not is noticed.
 *
 * @param parts - The parts of the host this test supplies.
 * @returns The host.
 */
const aValenceHost = (parts: Partial<ValenceHost> = {}): ValenceHost => {
  const refuse = (): Promise<never> =>
    Promise.reject(new Error('This test does not supply that part of the host.'));
  const quiet = (): void => undefined;

  return {
    plugin: { id: 'a-plugin', version: '1.0.0' },
    settings: { read: () => Promise.resolve({}) },
    log: { info: quiet, warn: quiet, error: quiet },
    storage: { get: refuse, set: refuse, delete: refuse, keys: refuse },
    secrets: { get: refuse, set: refuse, delete: refuse, keys: refuse },
    events: { emit: refuse },
    crypto: { hmac: refuse, equal: refuse },
    http: { fetch: refuse },
    accounts: { connection: refuse, disconnect: refuse },
    profiles: { list: refuse },
    library: { get: refuse, search: refuse, findByExternalId: refuse, episodes: refuse },
    viewing: { progress: refuse, markWatched: refuse, markUnwatched: refuse },
    requests: { searchCatalogue: refuse, create: refuse, missingAlbums: refuse },
    playlists: { list: refuse, create: refuse, add: refuse, read: refuse, drop: refuse },
    music: { findTrack: refuse },
    notifications: { send: refuse },
    ...parts,
  };
};

export { aValenceHost };
