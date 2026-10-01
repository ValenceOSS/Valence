import { describe, expect, it } from 'vitest';
import { ArrQueuePageSchema } from '@ValenceRequests/arrApps/schemas/ArrQueuePageSchema';
import { queueItemOf } from './queueItemOf';

const APP = '3f0e8a52-7b1c-4d2e-9f3a-5b6c7d8e9f01';

describe('queueItemOf', () => {
  it('shows how far along a download is, and how long it has left', () => {
    const [record] = ArrQueuePageSchema.parse({
      records: [
        {
          id: 5,
          title: 'Dune.2021.1080p',
          status: 'downloading',
          trackedDownloadState: 'downloading',
          size: 1000,
          sizeleft: 250,
          timeleft: '00:01:40',
          downloadClient: 'qBittorrent',
        },
      ],
    }).records;

    expect(record === undefined ? null : queueItemOf(APP, record)).toEqual({
      id: 5,
      appId: APP,
      title: 'Dune.2021.1080p',
      status: 'downloading',
      progress: 0.75,
      sizeBytes: 1000,
      leftBytes: 250,
      secondsLeft: 100,
      downloadClient: 'qBittorrent',
      problem: null,
    });
  });

  it('shows nothing done of a download of no known size', () => {
    const [record] = ArrQueuePageSchema.parse({
      records: [{ id: 6, title: 'Dune', status: 'queued' }],
    }).records;

    expect(record === undefined ? null : queueItemOf(APP, record)).toMatchObject({
      status: 'queued',
      progress: 0,
      sizeBytes: null,
      secondsLeft: null,
      downloadClient: null,
    });
  });
});
