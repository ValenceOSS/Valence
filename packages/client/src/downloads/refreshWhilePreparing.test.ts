import { describe, expect, it } from 'vitest';
import { refreshWhilePreparing } from './refreshWhilePreparing';
import type { Download } from '@ValenceContracts/schemas/Download';

const A_DOWNLOAD: Download = {
  id: 'one',
  mediaId: 'arrival',
  seriesId: null,
  seriesTitle: null,
  title: 'Arrival',
  quality: 'original',
  audioLanguages: [],
  state: 'preparing',
  progress: 0.4,
  bytesPerSecond: null,
  sizeBytes: null,
  failure: null,
  secondsLeft: null,
  askedFrom: null,
  askedAt: '2026-09-25T00:00:00.000Z',
  readyAt: null,
};

describe('refreshWhilePreparing', () => {
  it('asks again while anything is still being prepared or waiting to be', () => {
    expect(refreshWhilePreparing([A_DOWNLOAD])).toBe(10_000);
    expect(refreshWhilePreparing([{ ...A_DOWNLOAD, state: 'queued' }])).toBe(10_000);
  });

  it('leaves the list alone once nothing is, or before it has been read', () => {
    expect(refreshWhilePreparing([{ ...A_DOWNLOAD, state: 'ready' }])).toBe(false);
    expect(refreshWhilePreparing(undefined)).toBe(false);
  });
});
