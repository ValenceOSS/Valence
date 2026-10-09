import { describe, expect, it } from 'vitest';
import { aMediaRequest } from '@ValenceClient/testing/aMediaRequest';
import { aRequestItem } from '@ValenceClient/testing/aRequestItem';
import { downloadsOfHandOff } from './downloadsOfHandOff';

describe('downloadsOfHandOff', () => {
  it('shows each download an app has as a row, holding the items it says it holds', () => {
    const first = aRequestItem({ id: '0b1d2c3e-4f56-4a78-9b01-23456789abc1', episode: 1 });
    const second = aRequestItem({ id: '0b1d2c3e-4f56-4a78-9b01-23456789abc2', episode: 2 });

    expect(
      downloadsOfHandOff(aMediaRequest({ items: [first, second] }), [
        {
          id: '41',
          releaseTitle: 'Show.S01E02.1080p',
          itemIds: [second.id],
          clientName: 'qBittorrent',
          progress: 0.25,
          sizeBytes: 2000,
          secondsLeft: 90,
          problem: null,
        },
      ]),
    ).toEqual([
      {
        downloadId: '41',
        releaseTitle: 'Show.S01E02.1080p',
        items: [second],
        queued: {
          state: 'downloading',
          wasPaused: false,
          progress: 0.25,
          secondsLeft: 90,
          sizeBytes: 2000,
          downloadBytesPerSecond: null,
          uploadBytesPerSecond: null,
          clientName: 'qBittorrent',
          indexerName: null,
          sentAt: '',
        },
      },
    ]);
  });
});
