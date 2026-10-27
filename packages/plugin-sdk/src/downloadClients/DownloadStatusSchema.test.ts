import { describe, expect, it } from 'vitest';
import { DownloadStatusSchema } from './DownloadStatusSchema';

describe('DownloadStatusSchema', () => {
  it('fills in what a download client did not say', () => {
    expect(DownloadStatusSchema.parse({ id: '7', state: 'downloading', progress: 0.25 })).toEqual({
      id: '7',
      state: 'downloading',
      progress: 0.25,
      sizeBytes: null,
      doneBytes: null,
      bytesPerSecond: null,
      secondsLeft: null,
      seeds: null,
      peers: null,
      failure: null,
    });
  });

  it('reads why a download failed', () => {
    expect(
      DownloadStatusSchema.parse({
        id: '7',
        state: 'failed',
        progress: 0,
        failure: { reason: 'tooBig', message: 'Over 200 GB' },
      }).failure,
    ).toEqual({ reason: 'tooBig', message: 'Over 200 GB' });
  });

  it('refuses progress past the whole', () => {
    expect(DownloadStatusSchema.safeParse({ id: '7', state: 'done', progress: 1.5 }).success).toBe(
      false,
    );
  });
});
