import { describe, expect, it } from 'vitest';
import { aFakeLan } from '@ValenceRequests/arrImport/testing/aFakeLan';
import { readArrImport } from './readArrImport';

describe('readArrImport', () => {
  it('reads the Radarr and Sonarr an Overseerr sends to with the keys it keeps for them', async () => {
    const lan = aFakeLan({
      'http://overseerr:5055': 'overseerr',
      'http://radarr:7878': 'radarr-v5',
      'http://sonarr:8989': 'sonarr-v4',
    });
    const read = await readArrImport(
      [{ kind: 'overseerr', url: 'http://overseerr:5055', apiKey: 'overseerr-key' }],
      lan.connect,
    );

    expect(
      read.sources.map(({ name, kind, foundThrough, problem }) => ({
        name,
        kind,
        foundThrough,
        problem,
      })),
    ).toEqual([
      { name: 'Overseerr', kind: 'overseerr', foundThrough: null, problem: null },
      { name: 'Radarr', kind: 'radarr', foundThrough: 'Overseerr', problem: null },
      { name: 'Sonarr', kind: 'sonarr', foundThrough: 'Overseerr', problem: null },
    ]);
    expect(read.arrs.map((one) => one.kind)).toEqual(['radarr', 'sonarr']);
    expect(lan.asked.find((one) => one.origin === 'http://radarr:7878')?.key).toBe(
      'radarr-plain-key',
    );
    expect(lan.asked.every((one) => one.method === 'GET')).toBe(true);
  });

  it('keeps the key an admin gave over the one Overseerr keeps', async () => {
    const lan = aFakeLan({
      'http://overseerr:5055': 'overseerr',
      'http://radarr:7878': 'radarr-v5',
      'http://sonarr:8989': 'sonarr-v4',
    });

    await readArrImport(
      [
        { kind: 'radarr', url: 'http://radarr:7878/', apiKey: 'given-key' },
        { kind: 'overseerr', url: 'http://overseerr:5055', apiKey: 'overseerr-key' },
      ],
      lan.connect,
    );

    expect(
      new Set(lan.asked.filter((one) => one.origin === 'http://radarr:7878').map((one) => one.key)),
    ).toEqual(new Set(['given-key']));
  });

  it('says which app could not be reached, or is not what it was said to be, and reads the rest', async () => {
    const lan = aFakeLan({ 'http://sonarr:8989': 'sonarr-v3', 'http://prowlarr:9696': 'prowlarr' });
    const read = await readArrImport(
      [
        { kind: 'radarr', url: 'http://sonarr:8989', apiKey: 'key' },
        { kind: 'lidarr', url: 'http://lidarr:8686', apiKey: 'key' },
        { kind: 'prowlarr', url: 'http://prowlarr:9696', apiKey: 'key' },
      ],
      lan.connect,
    );

    expect(read.sources.map((one) => one.problem?.message ?? null)).toEqual([
      'That address belongs to Sonarr, not radarr.',
      'Couldn’t connect to Lidarr',
      null,
    ]);
    expect(read.arrs).toEqual([]);
    expect(read.prowlarr?.indexerCount).toBe(2);
  });

  it('tells apart two apps of the same name by their hosts', async () => {
    const lan = aFakeLan({ 'http://radarr:7878': 'radarr-v5', 'http://radarr2:7878': 'radarr-v5' });
    const read = await readArrImport(
      [
        { kind: 'radarr', url: 'http://radarr:7878', apiKey: 'key' },
        { kind: 'radarr', url: 'http://radarr2:7878', apiKey: 'key' },
      ],
      lan.connect,
    );

    expect(read.arrs.map((one) => one.source.name)).toEqual([
      'Radarr (radarr:7878)',
      'Radarr (radarr2:7878)',
    ]);
  });
});
