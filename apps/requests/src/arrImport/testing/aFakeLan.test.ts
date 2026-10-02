import { describe, expect, it } from 'vitest';
import { ArrStatusSchema } from '@ValenceRequests/arrApps/schemas/ArrStatusSchema';
import { aFakeLan } from './aFakeLan';

describe('aFakeLan', () => {
  it('answers each address from its own app, and keeps what each was asked', async () => {
    const lan = aFakeLan({ 'http://prowlarr:9696': 'prowlarr' });
    const prowlarr = lan.connect({
      name: 'Prowlarr',
      kind: 'prowlarr',
      url: 'http://prowlarr:9696',
      apiKey: 'key',
    });

    expect(await prowlarr.read('/system/status', ArrStatusSchema)).toMatchObject({
      appName: 'Prowlarr',
    });
    expect(lan.asked).toEqual([
      { origin: 'http://prowlarr:9696', method: 'GET', path: '/api/v1/system/status', key: 'key' },
    ]);
  });

  it('reaches nothing at an address with no app behind it', async () => {
    const lan = aFakeLan({});

    await expect(
      lan
        .connect({ name: 'Sonarr', kind: 'sonarr', url: 'http://sonarr:8989', apiKey: 'key' })
        .read('/system/status', ArrStatusSchema),
    ).rejects.toThrow();
  });
});
