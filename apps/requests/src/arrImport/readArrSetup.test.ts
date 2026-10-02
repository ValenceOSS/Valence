import { describe, expect, it } from 'vitest';
import { createArrCaller } from '@ValenceRequests/arrApps/createArrCaller';
import { aFakeArr } from '@ValenceRequests/arrApps/testing/aFakeArr';
import { arrFixture } from '@ValenceRequests/arrImport/testing/arrFixture';
import { readArrSetup } from './readArrSetup';

const SOURCE = {
  kind: 'radarr' as const,
  url: 'http://radarr:7878',
  apiKey: 'radarr-key',
  name: 'Radarr',
  version: '5.14.0.9383',
  foundThrough: null,
  problem: null,
};

describe('readArrSetup', () => {
  it('reads a Radarr 5’s setup, its secrets still masked, by asking and never changing', async () => {
    const arr = aFakeArr(arrFixture('radarr-v5'));
    const setup = await readArrSetup(createArrCaller(arr.fetch, SOURCE), 'radarr', SOURCE);

    expect(setup.clients.map((one) => one.implementation)).toEqual([
      'QBittorrent',
      'Sabnzbd',
      'Deluge',
    ]);
    expect(setup.clients[0]?.fields.find((field) => field.name === 'password')?.value).toBe(
      '********',
    );
    expect(setup.remotePaths).toHaveLength(1);
    expect(setup.customFormats.map((one) => one.name)).toEqual(['x265', 'HDR', 'Repack']);
    expect(setup.movies.map((one) => one.tmdbId)).toEqual([693_134, 438_631, 536_869]);
    expect(setup.series).toEqual([]);
    expect(arr.asked.every((one) => one.method === 'GET')).toBe(true);
  });

  it('reads a Sonarr 3, which has no custom formats, and its series', async () => {
    const source = { ...SOURCE, kind: 'sonarr' as const, url: 'http://sonarr:8989' };
    const arr = aFakeArr(arrFixture('sonarr-v3'));
    const setup = await readArrSetup(createArrCaller(arr.fetch, source), 'sonarr', source);

    expect(setup.customFormats).toEqual([]);
    expect(setup.releaseProfiles[0]).toMatchObject({ ignored: ['CAM', 'TS'], required: [] });
    expect(setup.series.map((one) => one.title)).toHaveLength(3);
    expect(setup.movies).toEqual([]);
  });

  it('reads a Lidarr’s artists and metadata profiles', async () => {
    const source = { ...SOURCE, kind: 'lidarr' as const, url: 'http://lidarr:8686' };
    const arr = aFakeArr(arrFixture('lidarr-v2'));
    const setup = await readArrSetup(createArrCaller(arr.fetch, source), 'lidarr', source);

    expect(setup.artists.map((one) => one.artistName)).toEqual(['Radiohead', 'Portishead']);
    expect(setup.metadataProfiles).toEqual([
      { id: 1, name: 'Standard' },
      { id: 2, name: 'None' },
    ]);
    expect(setup.rootFolders[0]).toMatchObject({
      defaultQualityProfileId: 2,
      defaultMetadataProfileId: 1,
    });
  });
});
