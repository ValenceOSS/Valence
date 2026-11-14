import { describe, expect, it } from 'vitest';
import { artworkAddresses } from './artworkAddresses';
import { artworkRevisions } from './artworkRevisions';
import { artworkUrl } from './artworkUrl';

describe('artworkUrl', () => {
  it('names where an item’s picture is served from', () => {
    expect(artworkUrl('film-1', 'poster')).toBe('/api/media/film-1/image/poster');
  });

  it('asks for the title’s own picture when that is what is wanted', () => {
    expect(artworkUrl('episode-1', 'backdrop', { isOfTitle: true })).toBe(
      '/api/media/episode-1/image/backdrop?of=title',
    );
  });

  it('asks for a poster with no lettering on it where the page writes the title itself', () => {
    expect(artworkUrl('film-1', 'poster', { isBare: true })).toBe(
      '/api/media/film-1/image/poster?lettering=none',
    );
  });

  it('asks again under a new address once the picture has been changed from here', () => {
    artworkRevisions.bump(['changed'], () => 7);

    expect(artworkUrl('changed', 'logo')).toBe('/api/media/changed/image/logo?v=7');
    expect(artworkUrl('changed', 'backdrop', { isOfTitle: true })).toBe(
      '/api/media/changed/image/backdrop?of=title&v=7',
    );
  });

  it('asks under the address the server last changed the pictures at', () => {
    artworkRevisions.learn([{ id: 'changed-elsewhere', artworkRevision: 1792635456917 }]);

    expect(artworkUrl('changed-elsewhere', 'poster')).toBe(
      '/api/media/changed-elsewhere/image/poster?v=1792635456917',
    );
  });

  it('asks for the small copy where a grid draws the picture', () => {
    expect(artworkUrl('film-2', 'poster', { size: 'small' })).toBe(
      '/api/media/film-2/image/poster?size=small',
    );
  });

  it('asks for the medium copy where a wide card draws the picture', () => {
    expect(artworkUrl('film-2', 'backdrop', { size: 'medium' })).toBe(
      '/api/media/film-2/image/backdrop?size=medium',
    );
  });

  it('asks for a narrowed copy by name where the server has named the picture', () => {
    artworkAddresses.learn([{ id: 'named', artwork: { poster: '/api/artwork/abc' } }]);

    expect(artworkUrl('named', 'poster', { size: 'small' })).toBe('/api/artwork/abc-w342.webp');
    expect(artworkUrl('named', 'poster', { size: 'medium' })).toBe('/api/artwork/abc-w640.webp');
  });

  it('asks at the image address for the whole picture, or one with no lettering', () => {
    artworkAddresses.learn([{ id: 'whole', artwork: { poster: '/api/artwork/abc' } }]);

    expect(artworkUrl('whole', 'poster')).toBe('/api/media/whole/image/poster');
    expect(artworkUrl('whole', 'poster', { isBare: true, size: 'small' })).toBe(
      '/api/media/whole/image/poster?lettering=none&size=small',
    );
  });

  it('asks a Jellyfin server for its picture with the width as one more query', () => {
    artworkAddresses.learn([
      {
        id: 'jellyfin',
        artwork: { poster: 'http://j.test/Items/a/Images/Primary?tag=t&quality=90' },
      },
    ]);

    expect(artworkUrl('jellyfin', 'poster', { size: 'small' })).toBe(
      'http://j.test/Items/a/Images/Primary?tag=t&quality=90&maxWidth=342',
    );
    expect(artworkUrl('jellyfin', 'poster')).toBe(
      'http://j.test/Items/a/Images/Primary?tag=t&quality=90',
    );
  });
});
