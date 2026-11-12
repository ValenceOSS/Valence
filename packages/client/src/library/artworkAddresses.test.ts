import { describe, expect, it } from 'vitest';
import { artworkAddresses } from './artworkAddresses';

describe('artworkAddresses', () => {
  it('knows where a picture is served by name once the server has said', () => {
    artworkAddresses.learn([{ id: 'film', artwork: { poster: '/api/artwork/p' } }]);

    expect(artworkAddresses.of('film', 'poster', 0)).toBe('/api/artwork/p');
    expect(artworkAddresses.of('film', 'logo', 0)).toBeUndefined();
  });

  it('knows nothing of an item the server named no pictures for', () => {
    artworkAddresses.learn([{ id: 'unnamed' }]);

    expect(artworkAddresses.of('unnamed', 'poster', 0)).toBeUndefined();
  });

  it('stops using a name once the pictures have been changed since', () => {
    artworkAddresses.learn([{ id: 'changed', artworkRevision: 5, artwork: { poster: '/a' } }]);

    expect(artworkAddresses.of('changed', 'poster', 5)).toBe('/a');
    expect(artworkAddresses.of('changed', 'poster', 9)).toBeUndefined();
  });

  it('gives the title’s own picture for a film but not for an episode', () => {
    artworkAddresses.learn([
      { id: 'a-film', seriesId: null, artwork: { backdrop: '/film' } },
      { id: 'an-episode', seriesId: 'show', artwork: { backdrop: '/still' } },
    ]);

    expect(artworkAddresses.of('a-film', 'backdrop', 0, true)).toBe('/film');
    expect(artworkAddresses.of('an-episode', 'backdrop', 0, true)).toBeUndefined();
    expect(artworkAddresses.of('an-episode', 'backdrop', 0)).toBe('/still');
  });

  it('keeps what it knew of the same revision beside what it is told', () => {
    artworkAddresses.learn([{ id: 'cover', artwork: { poster: '/p', backdrop: '/b' } }]);
    artworkAddresses.learn([{ id: 'cover', artwork: { poster: '/p', logo: undefined } }]);

    expect(artworkAddresses.of('cover', 'backdrop', 0)).toBe('/b');
  });

  it('forgets what it knew of an older revision', () => {
    artworkAddresses.learn([{ id: 'redone', artworkRevision: 1, artwork: { backdrop: '/old' } }]);
    artworkAddresses.learn([{ id: 'redone', artworkRevision: 2, artwork: { poster: '/new' } }]);

    expect(artworkAddresses.of('redone', 'backdrop', 2)).toBeUndefined();
  });
});
