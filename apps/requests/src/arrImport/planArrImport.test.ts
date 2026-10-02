import { describe, expect, it } from 'vitest';
import { aFakeLan } from '@ValenceRequests/arrImport/testing/aFakeLan';
import { LIBRARIES } from '@ValenceRequests/arrImport/testing/LIBRARIES';
import { anArrApp } from '@ValenceRequests/arrApps/testing/anArrApp';
import { readArrImport } from './readArrImport';
import { planArrImport } from './planArrImport';

const LAN = {
  'http://overseerr:5055': 'overseerr',
  'http://radarr:7878': 'radarr-v5',
  'http://sonarr:8989': 'sonarr-v4',
  'http://lidarr:8686': 'lidarr-v2',
  'http://prowlarr:9696': 'prowlarr',
};

const NOTHING_HELD = { clients: [], indexers: [], profiles: [], apps: [] };

const ORDER = {
  pathMappings: [
    { from: '/movies', to: '/media/Films' },
    { from: '/tv', to: '/media/Series' },
    { from: '/music', to: '/media/Music' },
  ],
  secrets: {},
  libraries: [...LIBRARIES],
};

describe('planArrImport', () => {
  it('says what bringing a whole setup in would do, and every secret it needs', async () => {
    const read = await readArrImport(
      [
        { kind: 'overseerr', url: 'http://overseerr:5055', apiKey: 'overseerr-key' },
        { kind: 'lidarr', url: 'http://lidarr:8686', apiKey: 'lidarr-key' },
        { kind: 'prowlarr', url: 'http://prowlarr:9696', apiKey: 'prowlarr-key' },
      ],
      aFakeLan(LAN).connect,
    );
    const { plan } = planArrImport(read, NOTHING_HELD, ORDER);

    expect(plan.sources.map((one) => one.name)).toEqual([
      'Overseerr',
      'Lidarr',
      'Radarr',
      'Sonarr',
      'Prowlarr',
    ]);
    expect(plan.clients.map((one) => [one.name, one.standing])).toEqual([
      ['NZBGet', 'new'],
      ['qBittorrent', 'new'],
      ['SABnzbd', 'new'],
      ['Deluge', 'unsupported'],
    ]);
    expect(plan.indexers.map((one) => one.name)).toEqual(['NZBgeek', 'PassThePopcorn']);
    expect(plan.prowlarr).toEqual({
      name: 'Prowlarr',
      url: 'http://prowlarr:9696',
      indexerCount: 2,
      standing: 'new',
    });
    expect(plan.profiles.map((one) => one.name)).toEqual(['Lossless', 'HD-1080p', 'WEB-1080p']);
    expect(plan.libraries.map((one) => [one.libraryName, one.appName])).toEqual([
      ['Music', 'Lidarr'],
      ['Films', 'Radarr'],
      ['Series', 'Sonarr'],
    ]);
    expect(plan.wanted).toEqual({ films: 1, series: 0, artists: 1, requests: 2, unaskable: 0 });
    expect(plan.secrets.map((one) => one.key)).toEqual([
      'client:nzbget@http://nzbget:6789:password',
      'client:qbittorrent@http://qbittorrent:8080:password',
      'client:sabnzbd@http://sabnzbd:8080/sabnzbd:apiKey',
      'indexer:https://api.nzbgeek.info',
    ]);
    expect(
      plan.secrets.find((one) => one.field === 'apiKey' && one.item === 'SABnzbd')?.from,
    ).toEqual(['Radarr', 'Sonarr']);
  });

  it('says a Prowlarr is connected already', async () => {
    const read = await readArrImport(
      [{ kind: 'prowlarr', url: 'http://prowlarr:9696', apiKey: 'prowlarr-key' }],
      aFakeLan(LAN).connect,
    );
    const { plan } = planArrImport(
      read,
      { ...NOTHING_HELD, apps: [anArrApp({ kind: 'prowlarr', url: 'http://prowlarr:9696/' })] },
      ORDER,
    );

    expect(plan.prowlarr?.standing).toBe('kept');
  });
});
