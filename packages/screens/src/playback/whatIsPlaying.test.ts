import { describe, expect, it } from 'vitest';
import { whatIsPlaying } from './whatIsPlaying';

describe('what is playing', () => {
  it('is the film where nothing says otherwise', () => {
    expect(whatIsPlaying({})).toBe('the film');
  });

  it('is the episode where the item belongs to a series', () => {
    expect(whatIsPlaying({ seriesTitle: 'Severance' })).toBe('the episode');
  });

  it('is the film where a series title arrived empty', () => {
    expect(whatIsPlaying({ seriesTitle: '' })).toBe('the film');
  });

  it('is the film where a series title arrived as nothing', () => {
    expect(whatIsPlaying({ seriesTitle: null })).toBe('the film');
  });

  it('names no kind at all for an extra, which has no noun worth guessing', () => {
    expect(whatIsPlaying({ extraKind: 'trailer' })).toBe('this');
  });

  it('calls an extra belonging to a series the same thing', () => {
    expect(whatIsPlaying({ seriesTitle: 'Severance', extraKind: 'featurette' })).toBe('this');
  });
});
