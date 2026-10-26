import { describe, expect, it } from 'vitest';
import { noListeningFilesAreKept } from './noListeningFilesAreKept';

describe('noListeningFilesAreKept', () => {
  it('fetches nothing, holds nothing and has nowhere to play a song from', async () => {
    const files = noListeningFilesAreKept();

    await expect(files.fetch('/api/music/tracks/a/stream', 'track-a', () => {})).resolves.toEqual({
      bytes: 0,
      isComplete: false,
      failure: null,
    });
    await expect(files.has('track-a')).resolves.toBe(false);
    expect(files.addressOf('track-a')).toBe('');
  });
});
