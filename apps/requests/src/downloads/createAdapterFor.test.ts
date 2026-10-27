import { describe, expect, it } from 'vitest';
import { aDownloadClient } from '@ValenceRequests/testing/aDownloadClient';
import { aFakeClient } from '@ValenceRequests/testing/aFakeClient';
import { createPluginCallChannel } from '@ValenceRequests/pluginCalls/createPluginCallChannel';
import type { PluginCall } from '@ValenceContracts/schemas/PluginCall';
import { createAdapterFor } from './createAdapterFor';
import { createLinkFetcher } from './createLinkFetcher';

describe('createAdapterFor', () => {
  it('speaks to each kind of client in its own way, and to a plugin’s through its plugin', async () => {
    const { fetch, asked } = aFakeClient({});
    const channel = createPluginCallChannel();
    const called: PluginCall[] = [];

    channel.listen((call) => {
      called.push(call);
      channel.answer(call.id, { ok: true, value: { version: '1.0' }, linkHosts: [] });
    });

    const needs = {
      fetch,
      plugins: { channel, fetcher: createLinkFetcher(), sent: () => Promise.resolve([]) },
    };

    for (const kind of ['qbittorrent', 'transmission', 'sabnzbd', 'nzbget'] as const) {
      await createAdapterFor(aDownloadClient({ kind, url: 'http://client' }), needs)
        .version()
        .catch(() => null);
    }

    const version = await createAdapterFor(
      aDownloadClient({
        kind: 'plugin',
        url: '',
        localPath: '/downloads',
        plugin: { id: 'example-files', clientId: 'files', protocol: 'torrent' },
      }),
      needs,
    ).version();

    expect(asked.map((request) => request.url.pathname)).toEqual([
      '/api/v2/auth/login',
      '/transmission/rpc',
      '/api',
      '/jsonrpc',
    ]);
    expect(version).toBe('1.0');
    expect(called).toMatchObject([
      { pluginId: 'example-files', clientId: 'files', method: 'test' },
    ]);
  });
});
