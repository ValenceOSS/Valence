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

  it('keeps a track’s styled and plain lines apart, under the title and the track', () => {
    expect(playbackQueries.styledCues('a', 't').queryKey).toEqual([
      'playback',
      'cues',
      'styled',
      'a',
      't',
    ]);
    expect(playbackQueries.plainCues('a', 't').queryKey).toEqual([
      'playback',
      'cues',
      'plain',
      'a',
      't',
    ]);
  });

  it('keeps a track’s lines once read, and never gives up asking for them', () => {
    for (const lines of [
      playbackQueries.styledCues('a', 't'),
      playbackQueries.plainCues('a', 't'),
    ]) {
      expect(lines.staleTime).toBe(Infinity);
      expect(lines.retry).toBe(true);
    }
  });

  it('waits longer each time before asking for a track’s lines again, up to half a minute', () => {
    const { retryDelay } = playbackQueries.styledCues('a', 't');
    const waits = [0, 1, 2, 10].map((attempt) =>
      typeof retryDelay === 'function' ? retryDelay(attempt, new Error('later')) : retryDelay,
    );

    expect(waits).toEqual([500, 1000, 2000, 30_000]);
  });
});
