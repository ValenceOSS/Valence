import { describe, expect, it } from 'vitest';
import { describeNumber } from './describeNumber';
import { aMediaSummary } from '@ValenceClient/testing/aMediaSummary';

describe('describeNumber', () => {
  it('numbers an episode, or a run of them', () => {
    expect(describeNumber(aMediaSummary({ episodeNumber: 1 }))).toBe('E1');
    expect(describeNumber(aMediaSummary({ episodeNumber: 3, episodeNumberEnd: 4 }))).toBe('E3–4');
  });

  it('is a dash where the file does not say', () => {
    expect(describeNumber(aMediaSummary({ episodeNumber: null }))).toBe('—');
  });
});
