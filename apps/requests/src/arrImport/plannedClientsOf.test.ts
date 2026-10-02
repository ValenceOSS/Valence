import { describe, expect, it } from 'vitest';
import { aSetup } from '@ValenceRequests/arrImport/testing/aSetup';
import type { DownloadClientRecord } from '@ValenceRequests/downloads/DownloadClientRecord';
import { plannedClientsOf } from './plannedClientsOf';

const MAPPINGS = [{ from: '/data', to: '/mnt/storage' }];

describe('plannedClientsOf', () => {
  it('brings in a Radarr 5’s clients, asking for each secret it shows only masked', async () => {
    const radarr = await aSetup('radarr-v5', 'radarr', 'http://radarr:7878');
    const planned = plannedClientsOf([radarr], [], {}, MAPPINGS);

    expect(planned.map((one) => one.report.standing)).toEqual(['new', 'new', 'unsupported']);
    expect(planned[0]?.draft).toMatchObject({
      kind: 'qbittorrent',
      url: 'http://qbittorrent:8080',
      username: 'admin',
      password: '',
      categories: { movies: 'radarr', shows: 'valence-series' },
      remotePath: '/downloads/',
      localPath: '/mnt/storage/downloads',
      priority: 1,
    });
    expect(planned[1]?.draft).toMatchObject({
      kind: 'sabnzbd',
      url: 'http://sabnzbd:8080/sabnzbd',
    });
    expect(planned.flatMap((one) => one.secrets)).toEqual([
      {
        key: 'client:qbittorrent@http://qbittorrent:8080:password',
        field: 'password',
        item: 'qBittorrent',
        from: ['Radarr'],
      },
      {
        key: 'client:sabnzbd@http://sabnzbd:8080/sabnzbd:apiKey',
        field: 'apiKey',
        item: 'SABnzbd',
        from: ['Radarr'],
      },
    ]);
    expect(planned[2]?.report.notes[0]?.message).toBe('Valence cannot use Deluge yet.');
  });

  it('fills a masked secret in with what the admin typed', async () => {
    const radarr = await aSetup('radarr-v5', 'radarr', 'http://radarr:7878');
    const planned = plannedClientsOf(
      [radarr],
      [],
      { 'client:sabnzbd@http://sabnzbd:8080/sabnzbd:apiKey': 'sab-key' },
      [],
    );

    expect(planned[1]?.draft?.apiKey).toBe('sab-key');
  });

  it('makes one client of one used by several apps, with each app’s category and a password shown in the clear', async () => {
    const radarr = await aSetup('radarr-v5', 'radarr', 'http://radarr:7878');
    const sonarr = await aSetup('sonarr-v3', 'sonarr', 'http://sonarr:8989');
    const planned = plannedClientsOf([radarr, sonarr], [], {}, []);
    const qbittorrent = planned.find((one) => one.draft?.kind === 'qbittorrent');

    expect(planned.filter((one) => one.draft?.kind === 'qbittorrent')).toHaveLength(1);
    expect(qbittorrent?.report.from).toEqual(['Radarr', 'Sonarr']);
    expect(qbittorrent?.secrets).toEqual([]);
    expect(qbittorrent?.draft).toMatchObject({
      password: 'hunter2',
      categories: { movies: 'radarr', shows: 'tv-sonarr' },
    });
    expect(planned.find((one) => one.draft?.kind === 'transmission')?.draft).toMatchObject({
      url: 'http://transmission:9091/transmission/rpc',
      username: 'sonarr',
      password: 's3cret',
    });
  });

  it('keeps Valence’s own category where two apps file under one', async () => {
    const radarr = await aSetup('radarr-v5', 'radarr', 'http://radarr:7878');
    const sonarr = await aSetup('sonarr-v3', 'sonarr', 'http://sonarr:8989');
    const clash = {
      ...sonarr,
      clients: sonarr.clients.map((client) => ({
        ...client,
        fields: client.fields.map((field) =>
          field.name === 'tvCategory' ? { ...field, value: 'Radarr' } : field,
        ),
      })),
    };
    const qbittorrent = plannedClientsOf([radarr, clash], [], {}, []).find(
      (one) => one.draft?.kind === 'qbittorrent',
    );

    expect(qbittorrent?.draft?.categories).toMatchObject({
      movies: 'radarr',
      shows: 'valence-series',
    });
    expect(qbittorrent?.report.notes).toHaveLength(1);
  });

  it('finds a client Valence has already by its address', async () => {
    const lidarr = await aSetup('lidarr-v2', 'lidarr', 'http://lidarr:8686');
    const kept: DownloadClientRecord = {
      id: '5f8b1c1e-2d3a-4b5c-8d9e-0f1a2b3c4d5e',
      name: 'NZBGet',
      kind: 'nzbget',
      url: 'http://NZBGet:6789/',
      username: 'nzbget',
      password: 'old',
      apiKey: '',
      categories: {
        movies: 'valence-films',
        shows: 'valence-series',
        music: 'valence-music',
        books: 'valence-books',
      },
      remotePath: '',
      localPath: '',
      priority: 1,
      isEnabled: true,
      createdAt: '2026-10-01T00:00:00.000Z',
      updatedAt: '2026-10-01T00:00:00.000Z',
    };
    const [planned] = plannedClientsOf([lidarr], [kept], {}, []);

    expect(planned?.report.standing).toBe('kept');
    expect(planned?.existing?.id).toBe(kept.id);
    expect(planned?.draft?.categories?.music).toBe('Music');
  });
});
