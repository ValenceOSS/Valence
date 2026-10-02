import { describe, expect, it } from 'vitest';
import { subjectOfMedia } from './subjectOfMedia';

describe('subjectOfMedia', () => {
  it('takes a film as itself', () => {
    expect(subjectOfMedia({ id: 'film', seriesId: null })).toEqual({ mediaItemId: 'film' });
  });

  it('takes an episode as its whole programme', () => {
    expect(subjectOfMedia({ id: 'pilot', seriesId: 'show' })).toEqual({ seriesId: 'show' });
  });
});
