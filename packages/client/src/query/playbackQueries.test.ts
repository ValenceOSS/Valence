import { describe, expect, it } from 'vitest';
import { playbackQueries } from './playbackQueries';

describe('playbackQueries', () => {
  it('keeps a title’s chapters beside its segments, under the playback key', () => {
    expect(playbackQueries.chapters('a').queryKey).toEqual(['playback', 'chapters', 'a']);
    expect(playbackQueries.segments('a').queryKey).toEqual(['playback', 'segments', 'a']);
  });

  it('reads a title’s chapters once, since a file’s chapters do not change while it plays', () => {
    expect(playbackQueries.chapters('a').staleTime).toBe(Infinity);
  });
});
