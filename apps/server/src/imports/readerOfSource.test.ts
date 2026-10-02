import { describe, expect, it } from 'vitest';
import { aFakeSourceFetch } from './aFakeSourceFetch';
import { aSourceToImport } from './aSourceToImport';
import { readerOfSource } from './readerOfSource';
import { readFixture } from './readFixture';

const SOURCE = {
  id: 'source',
  kind: 'jellyfin' as const,
  name: 'Den',
  url: 'http://den',
  token: 'key',
  details: { serverId: 's', version: '12.1.0', clientId: '', userTokens: {}, pathMappings: [] },
  createdAt: new Date(0),
};

describe('readerOfSource', () => {
  it('uses the reader the services supply, where they supply one', () => {
    const reader = aSourceToImport();

    expect(
      readerOfSource(
        { fetch: () => Promise.reject(new Error('unused')), readerFor: () => reader },
        SOURCE,
        [],
      ),
    ).toBe(reader);
  });

  it('otherwise reads the source over the network, as itself where it has no client id', async () => {
    const { fetch, calls } = aFakeSourceFetch(() => ({
      body: readFixture('jellyfin-public-info.json'),
    }));

    await readerOfSource({ fetch }, SOURCE, []).identify();

    expect(calls[0]?.headers.Authorization).toContain('DeviceId="source"');

    await readerOfSource(
      { fetch },
      { ...SOURCE, details: { ...SOURCE.details, clientId: 'kept' } },
      [],
    ).identify();

    expect(calls[2]?.headers.Authorization).toContain('DeviceId="kept"');
  });
});
