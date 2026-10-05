/* oxlint-disable valence/no-hard-coded-strings -- stands in for a plugin host in tests */
import { vi } from 'vitest';
import { A_PLUGIN_MEDIA_FOR_TEST } from './A_PLUGIN_MEDIA_FOR_TEST';
import type { PluginHost } from './PluginHost';

/**
 * A host whose every call answers plainly and can be inspected, for tests of what calls it.
 *
 * @returns The host.
 */
const aPluginHostForTest = (): PluginHost => ({
  profiles: {
    read: vi.fn((id: string) =>
      Promise.resolve(id === 'gone' ? null : { id, name: `Profile ${id}`, accountId: 'a1' }),
    ),
  },
  library: {
    get: vi.fn(() => Promise.resolve(A_PLUGIN_MEDIA_FOR_TEST)),
    search: vi.fn(() => Promise.resolve([A_PLUGIN_MEDIA_FOR_TEST])),
    findByExternalId: vi.fn(() => Promise.resolve([A_PLUGIN_MEDIA_FOR_TEST])),
    episodes: vi.fn(() => Promise.resolve([A_PLUGIN_MEDIA_FOR_TEST])),
  },
  viewing: {
    progress: vi.fn(() => Promise.resolve([])),
    markWatched: vi.fn(() => Promise.resolve()),
    markUnwatched: vi.fn(() => Promise.resolve()),
  },
  requests: {
    searchCatalogue: vi.fn(() => Promise.resolve([])),
    create: vi.fn(() => Promise.resolve({ status: 'made' as const })),
    missingAlbums: vi.fn(() => Promise.resolve({ isMatching: false, albums: [] })),
  },
  playlists: {
    list: vi.fn(() => Promise.resolve([{ id: 'pl1', name: 'Mine' }])),
    create: vi.fn(() => Promise.resolve({ id: 'pl2' })),
    add: vi.fn(() => Promise.resolve()),
    read: vi.fn((_profileId: string, playlistId: string) =>
      Promise.resolve({
        id: playlistId,
        name: 'Mine',
        entries: [{ entryId: 'e1', mediaId: 'm1', missing: null }],
      }),
    ),
    drop: vi.fn(() => Promise.resolve()),
  },
  music: { findTrack: vi.fn(() => Promise.resolve(null)) },
  notifications: { send: vi.fn(() => Promise.resolve()) },
  events: { emit: vi.fn(() => Promise.resolve()) },
});

export { aPluginHostForTest };
