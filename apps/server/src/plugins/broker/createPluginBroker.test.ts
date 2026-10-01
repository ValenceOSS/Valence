import { describe, expect, it, vi } from 'vitest';
import { PluginManifestSchema } from '@ValenceSDK/manifest/PluginManifestSchema';
import { JsonValueSchema } from '@ValenceContracts/schemas/JsonValue';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';
import { createMemoryPluginStore } from '@ValenceServer/plugins/store/createMemoryPluginStore';
import { createPluginBroker } from './createPluginBroker';
import type { Permission } from '@ValenceSDK/manifest/PermissionSchema';
import { A_PLUGIN_MEDIA_FOR_TEST } from './A_PLUGIN_MEDIA_FOR_TEST';
import { aPluginHostForTest } from './aPluginHostForTest';
import type { BrokerScope } from './BrokerScope';

const VIEWER: BrokerScope = { kind: 'viewer', profileId: 'p1', accountId: 'a1', isAdmin: false };

const BACKGROUND: BrokerScope = { kind: 'background' };

const manifestWith = (permissions: Permission[], contributes: object = {}) =>
  PluginManifestSchema.parse({
    manifestVersion: 2,
    id: 'broker-test',
    name: 'Broker Test',
    version: '1.0.0',
    apiVersion: '^1.0',
    author: { name: 'Tester' },
    description: 'Tests the broker.',
    permissions,
    contributes,
    entry: 'dist/plugin.js',
    settings: [{ id: 'clientId', label: 'Client id', kind: 'text' }],
  });

const build = (permissions: Permission[], contributes: object = {}) => {
  const store = createMemoryPluginStore();
  const host = aPluginHostForTest();
  const fetch = vi.fn(() => Promise.resolve({ status: 200, headers: {}, text: 'ok' }));
  const tokensFor = vi.fn(() =>
    Promise.resolve({ accessToken: 'token', expiresAt: null, account: 'me' }),
  );
  const log = vi.fn();
  const broker = createPluginBroker({
    installation: {
      id: 'broker-test',
      manifest: manifestWith(permissions, contributes),
      settings: { clientId: 'abc' },
    },
    store,
    host,
    fetch,
    tokensFor,
    log,
  });
  const ask = async (method: string, args: JsonValue[], scope: BrokerScope | null = VIEWER) =>
    JsonValueSchema.parse(JSON.parse(await broker(method, JSON.stringify(args), scope)));

  return { store, host, fetch, tokensFor, log, broker, ask };
};

describe('the plugin broker', () => {
  it('refuses a method it does not know and arguments it cannot read', async () => {
    const { broker, ask } = build([]);

    await expect(ask('files.read', [])).rejects.toThrow('Valence has no files.read');
    await expect(broker('settings.read', 'not json', VIEWER)).rejects.toThrow('could not read');
    await expect(ask('log.info', [42])).rejects.toThrow('could not read');
  });

  it('reads settings and writes logs without any permission', async () => {
    const { ask, log } = build([]);

    expect(await ask('settings.read', [])).toEqual({ clientId: 'abc' });
    expect(await ask('log.warn', ['careful', { count: 1 }])).toBeNull();
    expect(log).toHaveBeenCalledWith('warn', 'careful');
    await ask('log.info', ['hello']);
    await ask('log.error', ['oops']);
    expect(log).toHaveBeenCalledWith('info', 'hello');
    expect(log).toHaveBeenCalledWith('error', 'oops');
  });

  it('keeps nothing for a plugin without storage', async () => {
    const { ask } = build([]);

    await expect(ask('storage.set', ['k', 1])).rejects.toThrow('not given the storage permission');
    await expect(ask('storage.get', ['k'])).rejects.toThrow('not given the storage permission');
    await expect(ask('storage.delete', ['k'])).rejects.toThrow('not given the storage permission');
    await expect(ask('storage.keys', [])).rejects.toThrow('not given the storage permission');
  });

  it('keeps, reads, lists and forgets values within the quota', async () => {
    const { ask } = build([{ kind: 'storage', quotaBytes: 100 }]);

    await ask('storage.set', ['sync:a', { done: true }]);
    await ask('storage.set', ['sync:b', [1, 2]]);
    await ask('storage.set', ['other', 'x']);

    expect(await ask('storage.get', ['sync:a'])).toEqual({ done: true });
    expect(await ask('storage.keys', ['sync:'])).toEqual(['sync:a', 'sync:b']);
    expect(await ask('storage.keys', [])).toEqual(['other', 'sync:a', 'sync:b']);

    await ask('storage.delete', ['sync:a']);

    expect(await ask('storage.get', ['sync:a'])).toBeNull();
  });

  it('refuses a value that would pass the quota, counting a replaced key once', async () => {
    const { ask } = build([{ kind: 'storage', quotaBytes: 40 }]);

    await ask('storage.set', ['k', 'x'.repeat(20)]);
    await ask('storage.set', ['k', 'y'.repeat(30)]);
    await expect(ask('storage.set', ['k2', 'z'.repeat(20)])).rejects.toThrow(
      'used all of the 40 bytes',
    );
  });

  it('fetches only with the network permission', async () => {
    const without = build([]);

    await expect(without.ask('http.fetch', ['https://api.example.com/'])).rejects.toThrow(
      'network',
    );

    const withNetwork = build([{ kind: 'network', hosts: ['api.example.com'] }]);

    expect(
      await withNetwork.ask('http.fetch', ['https://api.example.com/', { method: 'GET' }]),
    ).toEqual({
      status: 200,
      headers: {},
      text: 'ok',
    });
    expect(withNetwork.fetch).toHaveBeenCalledWith('https://api.example.com/', { method: 'GET' });
  });

  it('reads the library only with the library permission', async () => {
    const without = build([]);

    await expect(without.ask('library.search', ['x'])).rejects.toThrow('library');
    await expect(without.ask('library.get', ['m1'])).rejects.toThrow('library');
    await expect(without.ask('music.findTrack', [{ title: 't', artist: 'a' }])).rejects.toThrow(
      'library',
    );

    const { ask, host } = build([{ kind: 'library', access: 'read' }]);

    expect(await ask('library.get', ['m1'])).toEqual(A_PLUGIN_MEDIA_FOR_TEST);
    expect(host.library.get).toHaveBeenCalledWith('m1');
    expect(await ask('library.search', ['Frieren', ['series']])).toEqual([A_PLUGIN_MEDIA_FOR_TEST]);
    expect(host.library.search).toHaveBeenCalledWith('Frieren', ['series']);
    expect(await ask('library.search', ['Frieren'])).toEqual([A_PLUGIN_MEDIA_FOR_TEST]);
    expect(await ask('library.findByExternalId', ['anilist', '154587'])).toEqual([
      A_PLUGIN_MEDIA_FOR_TEST,
    ]);
    expect(await ask('library.episodes', ['s1'])).toEqual([A_PLUGIN_MEDIA_FOR_TEST]);
    expect(
      await ask('music.findTrack', [{ title: 'Song', artist: 'Band', isrc: 'GB1' }]),
    ).toBeNull();
    expect(host.music.findTrack).toHaveBeenCalledWith({
      title: 'Song',
      artist: 'Band',
      album: null,
      isrc: 'GB1',
    });
  });

  it('reads viewing with read, and changes it only with write', async () => {
    const reader = build([{ kind: 'viewing', access: 'read' }]);

    expect(await reader.ask('viewing.progress', ['p1'])).toEqual([]);
    await expect(reader.ask('viewing.markWatched', ['p1', 'm1'])).rejects.toThrow('not write');

    const writer = build([{ kind: 'viewing', access: 'write' }]);

    expect(await writer.ask('viewing.progress', ['p1', '2026-01-01T00:00:00Z'])).toEqual([]);
    await writer.ask('viewing.markWatched', ['p1', 'm1', '2026-01-02T00:00:00Z']);
    await writer.ask('viewing.markUnwatched', ['p1', 'm1']);
    expect(writer.host.viewing.markWatched).toHaveBeenCalledWith(
      'p1',
      'm1',
      '2026-01-02T00:00:00Z',
    );
    expect(writer.host.viewing.markUnwatched).toHaveBeenCalledWith('p1', 'm1');
  });

  it('acts only for the viewer using a page', async () => {
    const { ask } = build([{ kind: 'viewing', access: 'write' }]);

    await expect(ask('viewing.markWatched', ['someone-else', 'm1'])).rejects.toThrow(
      'only act for the person using it',
    );
  });

  it('acts in the background only for people who used or connected the plugin', async () => {
    const { ask, store } = build([{ kind: 'viewing', access: 'write' }]);

    await expect(ask('viewing.markWatched', ['p2', 'm1'], BACKGROUND)).rejects.toThrow(
      'people who have used it',
    );

    await store.rememberProfile('broker-test', 'p2');

    expect(await ask('viewing.markWatched', ['p2', 'm1'], BACKGROUND)).toBeNull();
  });

  it('acts for nobody once the work a question belonged to has finished', async () => {
    const { ask } = build([{ kind: 'viewing', access: 'write' }]);

    await expect(ask('viewing.progress', ['p1'], null)).rejects.toThrow(
      'after the work it belonged to',
    );
  });

  it('hands over account tokens only for a declared provider and the right person', async () => {
    const without = build([]);

    await expect(without.ask('accounts.connection', ['p1', 'anilist'])).rejects.toThrow('accounts');

    const { ask, tokensFor, store } = build([
      { kind: 'network', hosts: ['anilist.co'] },
      {
        kind: 'accounts',
        providers: [
          {
            id: 'anilist',
            name: 'AniList',
            authorizeUrl: 'https://anilist.co/api/v2/oauth/authorize',
            tokenUrl: 'https://anilist.co/api/v2/oauth/token',
            scopes: [],
            clientIdSetting: 'clientId',
          },
        ],
      },
    ]);

    await expect(ask('accounts.connection', ['p1', 'spotify'])).rejects.toThrow(
      'no account provider called spotify',
    );
    await expect(ask('accounts.connection', ['p9', 'anilist'])).rejects.toThrow('person using it');
    expect(await ask('accounts.connection', ['p1', 'anilist'])).toEqual({
      accessToken: 'token',
      expiresAt: null,
      account: 'me',
    });
    expect(tokensFor).toHaveBeenCalledWith('p1', 'anilist');

    await store.saveConnection({
      pluginId: 'broker-test',
      profileId: 'p1',
      provider: 'anilist',
      accessToken: 'sealed',
      refreshToken: null,
      expiresAt: null,
      account: null,
    });
    await ask('accounts.disconnect', ['p1', 'anilist']);
    expect(await store.readConnection('broker-test', 'p1', 'anilist')).toBeNull();
  });

  it('lists the people who have used the plugin, by name', async () => {
    const { ask, store } = build([]);

    await store.rememberProfile('broker-test', 'p1');
    await store.rememberProfile('broker-test', 'gone');

    expect(await ask('profiles.list', [])).toEqual([{ id: 'p1', name: 'Profile p1' }]);
  });

  it('asks for things only with the requests permission', async () => {
    const without = build([]);

    await expect(without.ask('requests.searchCatalogue', ['x', 'album'])).rejects.toThrow(
      'requests',
    );

    const { ask, host } = build([{ kind: 'requests', access: 'create' }]);

    expect(await ask('requests.searchCatalogue', ['Album', 'album'])).toEqual([]);
    expect(await ask('requests.create', ['p1', { catalogueId: 'mb-1', kind: 'album' }])).toEqual({
      status: 'made',
    });
    expect(host.requests.create).toHaveBeenCalledWith('p1', { catalogueId: 'mb-1', kind: 'album' });
    await expect(
      ask('requests.create', ['p2', { catalogueId: 'mb-1', kind: 'album' }]),
    ).rejects.toThrow('person using it');
  });

  it('reads playlists with read, and makes and fills them only with write', async () => {
    const reader = build([{ kind: 'playlists', access: 'read' }]);

    expect(await reader.ask('playlists.list', ['p1'])).toEqual([{ id: 'pl1', name: 'Mine' }]);
    expect(await reader.ask('playlists.read', ['p1', 'pl1'])).toEqual({
      id: 'pl1',
      name: 'Mine',
      entries: [{ entryId: 'e1', mediaId: 'm1' }],
    });
    await expect(reader.ask('playlists.create', ['p1', { name: 'New' }])).rejects.toThrow(
      'not write',
    );
    await expect(reader.ask('playlists.drop', ['p1', 'pl1', 'e1'])).rejects.toThrow('not write');

    const writer = build([{ kind: 'playlists', access: 'write' }]);

    expect(
      await writer.ask('playlists.create', ['p1', { name: 'New', description: 'Imported' }]),
    ).toEqual({
      id: 'pl2',
    });
    expect(await writer.ask('playlists.create', ['p1', { name: 'Bare' }])).toEqual({ id: 'pl2' });
    await writer.ask('playlists.add', ['p1', 'pl2', ['t1', 't2']]);
    expect(writer.host.playlists.create).toHaveBeenCalledWith('p1', {
      name: 'New',
      description: 'Imported',
    });
    expect(writer.host.playlists.create).toHaveBeenCalledWith('p1', {
      name: 'Bare',
      description: null,
    });
    expect(writer.host.playlists.add).toHaveBeenCalledWith('p1', 'pl2', ['t1', 't2']);
    expect(await writer.ask('playlists.drop', ['p1', 'pl2', 'e1'])).toBeNull();
    expect(writer.host.playlists.drop).toHaveBeenCalledWith('p1', 'pl2', 'e1');
  });

  it('sends notifications only with the notifications permission, signed with the plugin name', async () => {
    const without = build([]);

    await expect(
      without.ask('notifications.send', ['p1', { title: 'Hi', body: 'There' }]),
    ).rejects.toThrow('notifications');

    const { ask, host } = build([{ kind: 'notifications' }]);

    await ask('notifications.send', ['p1', { title: 'Hi', body: 'There' }]);
    expect(host.notifications.send).toHaveBeenCalledWith('p1', {
      title: 'Hi',
      body: 'There',
      from: 'Broker Test',
    });
  });

  it('passes on an error a service throws', async () => {
    const { ask, host } = build([{ kind: 'library', access: 'read' }]);

    vi.mocked(host.library.search).mockRejectedValueOnce(new Error('The library is busy.'));

    await expect(ask('library.search', ['x'])).rejects.toThrow('The library is busy.');
  });

  it('sends only events the plugin declared, with the emits permission, a few a minute', async () => {
    const declared = { emits: [{ id: 'imported', title: 'A playlist was imported' }] };
    const { ask, host } = build([{ kind: 'emits' }], declared);

    await ask('events.emit', ['imported', { songs: 12 }], BACKGROUND);

    expect(host.events.emit).toHaveBeenCalledWith({
      pluginId: 'broker-test',
      pluginName: 'Broker Test',
      name: 'imported',
      title: 'A playlist was imported',
      detail: { songs: 12 },
    });
    await expect(ask('events.emit', ['deleted'], BACKGROUND)).rejects.toThrow(
      'did not declare an event called deleted',
    );

    for (let sent = 1; sent < 30; sent += 1) {
      await ask('events.emit', ['imported'], BACKGROUND);
    }

    await expect(ask('events.emit', ['imported'], BACKGROUND)).rejects.toThrow('too many events');
    await expect(build([]).ask('events.emit', ['imported'], BACKGROUND)).rejects.toThrow();
  });
});
