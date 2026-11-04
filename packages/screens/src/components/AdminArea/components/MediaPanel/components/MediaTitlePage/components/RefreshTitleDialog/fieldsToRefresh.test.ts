import { describe, expect, it } from 'vitest';
import { fieldsToRefresh } from './fieldsToRefresh';

describe('fieldsToRefresh', () => {
  it('offers the fields TMDB fills, and none it never does', () => {
    const film = fieldsToRefresh('film');

    expect(film).toEqual(expect.arrayContaining(['title', 'overview', 'rating', 'genres']));
    expect(film).not.toContain('note');
    expect(film).not.toContain('sortTitle');
    expect(film).not.toContain('tags');
  });

  it('leaves out what a programme reads from TMDB live', () => {
    const show = fieldsToRefresh('show');

    expect(show).toContain('networks');
    expect(show).not.toContain('overview');
    expect(show).not.toContain('status');
  });
});
