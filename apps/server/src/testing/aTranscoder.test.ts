import { describe, expect, it } from 'vitest';
import { aTranscoder } from './aTranscoder';

describe('aTranscoder', () => {
  it('refuses what a test did not ask it to do', async () => {
    await expect(
      aTranscoder().fingerprint({ inputPath: '/f.mkv', startSeconds: 0, durationSeconds: 1 }),
    ).rejects.toThrow('not used');
  });

  it('does what a test asked of it', async () => {
    const transcoder = aTranscoder({ isReachable: () => Promise.resolve(false) });

    await expect(transcoder.isReachable()).resolves.toBe(false);
  });
});
