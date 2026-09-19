import { describe, expect, it } from 'vitest';
import { aFakeClient } from '@ValenceRequests/testing/aFakeClient';
import { createAdapterFor } from './createAdapterFor';
import type { ClientSettings } from './DownloadClientAdapter';

const SETTINGS: ClientSettings = {
  name: 'Client',
  url: 'http://client',
  username: 'u',
  password: 'p',
  apiKey: 'k',
  category: 'valence',
};

describe('createAdapterFor', () => {
  it('speaks to each kind of client in its own way', async () => {
    const { fetch, asked } = aFakeClient({});

    for (const kind of ['qbittorrent', 'transmission', 'sabnzbd', 'nzbget'] as const) {
      await createAdapterFor(kind, SETTINGS, fetch)
        .version()
        .catch(() => null);
    }

    expect(asked.map((request) => request.url.pathname)).toEqual([
      '/api/v2/auth/login',
      '/transmission/rpc',
      '/api',
      '/jsonrpc',
    ]);
  });
});
