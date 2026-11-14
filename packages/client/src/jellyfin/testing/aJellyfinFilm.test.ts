import { describe, expect, it } from 'vitest';
import { aJellyfinFilm } from './aJellyfinFilm';

describe('aJellyfinFilm', () => {
  it('is a film part watched unless told otherwise', () => {
    expect(aJellyfinFilm()).toMatchObject({ Name: 'Sneakers', Type: 'Movie' });
    expect(aJellyfinFilm({ Name: 'Heat' }).Name).toBe('Heat');
  });
});
