import { describe, expect, it } from 'vitest';
import { ArrQueuePageSchema } from './ArrQueuePageSchema';

describe('ArrQueuePageSchema', () => {
  it('reads a Sonarr queue page, with which episode each download is for', () => {
    const page = ArrQueuePageSchema.parse({
      page: 1,
      pageSize: 1000,
      sortKey: 'timeleft',
      sortDirection: 'ascending',
      totalRecords: 1,
      records: [
        {
          seriesId: 3,
          episodeId: 41,
          seasonNumber: 1,
          languages: [{ id: 1, name: 'English' }],
          quality: { quality: { id: 9, name: 'HDTV-1080p' }, revision: { version: 1 } },
          customFormats: [],
          customFormatScore: 0,
          size: 2_147_483_648,
          title: 'Severance.S01E02.1080p.WEB.H264-GROUP',
          sizeleft: 1_073_741_824,
          timeleft: '00:12:30',
          estimatedCompletionTime: '2026-10-01T09:12:30Z',
          added: '2026-10-01T08:50:00Z',
          status: 'downloading',
          trackedDownloadStatus: 'ok',
          trackedDownloadState: 'downloading',
          statusMessages: [],
          downloadId: 'ABCDEF',
          protocol: 'torrent',
          downloadClient: 'qBittorrent',
          downloadClientHasPostImportCategory: false,
          indexer: 'Nyaa (Prowlarr)',
          episodeHasFile: false,
          id: 1_234_567,
        },
      ],
    });

    expect(page.records[0]).toMatchObject({
      id: 1_234_567,
      seriesId: 3,
      episodeId: 41,
      size: 2_147_483_648,
      sizeleft: 1_073_741_824,
      timeleft: '00:12:30',
      downloadClient: 'qBittorrent',
    });
  });

  it('reads Radarr’s and Lidarr’s records too, and an empty queue', () => {
    expect(
      ArrQueuePageSchema.parse({
        records: [
          { movieId: 12, title: 'Dune.Part.Two.2024', status: 'queued', id: 5 },
          {
            artistId: 2,
            albumId: 9,
            title: 'Radiohead - OK Computer (1997) [FLAC]',
            status: 'completed',
            trackedDownloadStatus: 'warning',
            statusMessages: [{ title: 'OK Computer', messages: ['Has missing tracks'] }],
            id: 6,
          },
        ],
      }).records.map((record) => [record.movieId, record.albumId]),
    ).toEqual([
      [12, undefined],
      [undefined, 9],
    ]);
    expect(ArrQueuePageSchema.parse({ page: 1, totalRecords: 0, records: [] }).records).toEqual([]);
  });
});
