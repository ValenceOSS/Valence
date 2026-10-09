import { describe, expect, it } from 'vitest';
import { ArrQueuePageSchema } from '@ValenceRequests/arrApps/schemas/ArrQueuePageSchema';
import { handOffDownloadOf } from './handOffDownloadOf';

const recordOf = (fields: Record<string, number | string | null>) => {
  const [record] = ArrQueuePageSchema.parse({ records: [{ id: 41, ...fields }] }).records;

  if (record === undefined) {
    throw new Error('No record');
  }

  return record;
};

describe('handOffDownloadOf', () => {
  it('says how far along a download is, in which client, and the items it holds', () => {
    expect(
      handOffDownloadOf(
        recordOf({
          title: 'A.Film.2021.1080p',
          size: 1000,
          sizeleft: 250,
          timeleft: '00:02:00',
          downloadClient: 'qBittorrent',
        }),
        ['a'],
        'Radarr',
      ),
    ).toEqual({
      id: '41',
      releaseTitle: 'A.Film.2021.1080p',
      itemIds: ['a'],
      clientName: 'qBittorrent',
      progress: 0.75,
      sizeBytes: 1000,
      secondsLeft: 120,
      problem: null,
    });
  });

  it('names the app where it names no client, and shows no progress it cannot work out', () => {
    expect(handOffDownloadOf(recordOf({ title: 'A' }), [], 'Radarr')).toMatchObject({
      clientName: 'Radarr',
      progress: 0,
      sizeBytes: null,
      secondsLeft: null,
    });
  });
});
