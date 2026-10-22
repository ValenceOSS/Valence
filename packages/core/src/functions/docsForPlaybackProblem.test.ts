import { describe, expect, it } from 'vitest';
import { docsForPlaybackProblem } from './docsForPlaybackProblem';

describe('docsForPlaybackProblem', () => {
  it('points at the entry for the problem’s code', () => {
    expect(docsForPlaybackProblem('damaged')).toBe(
      'https://docs.getvalence.app/use/playback-errors#error-101',
    );
  });

  it('points at the whole list where no problem is named', () => {
    expect(docsForPlaybackProblem(null)).toBe('https://docs.getvalence.app/use/playback-errors');
  });
});
