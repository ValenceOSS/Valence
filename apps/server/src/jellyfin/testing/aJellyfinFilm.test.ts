import { describe, expect, it } from 'vitest';
import { aJellyfinFilm } from './aJellyfinFilm';

describe('aJellyfinFilm', () => {
  it('is a film with a poster and a backdrop unless told otherwise', () => {
    expect(aJellyfinFilm()).toMatchObject({ title: 'Sneakers', seriesId: null });
    expect(aJellyfinFilm({ title: 'Heat' }).title).toBe('Heat');
  });
});
