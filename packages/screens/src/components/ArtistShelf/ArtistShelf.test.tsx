import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { ArtistShelf, pictureOf } from './ArtistShelf';

const ARTIST = {
  id: '00000000-0000-4000-8000-00000000a7a7',
  libraryId: '00000000-0000-4000-8000-00000000f1f1',
  name: 'Sleep Token',
  hasImage: false,
  imageAlbumId: '00000000-0000-4000-8000-00000000a1b1',
  albumCount: 1,
  trackCount: 10,
  isFavourite: false,
};

describe('ArtistShelf', () => {
  it('draws nothing where there are no artists', () => {
    const { container } = renderInAnAddress(<ArtistShelf heading="Artists" artists={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('names each artist', () => {
    renderInAnAddress(<ArtistShelf heading="Artists" artists={[ARTIST]} />);

    expect(screen.getByRole('region', { name: 'Artists' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sleep Token/ })).toBeInTheDocument();
  });

  it('pictures an artist by their own picture first, then their latest cover', () => {
    expect(pictureOf({ ...ARTIST, hasImage: true })).toBe(`/api/music/artists/${ARTIST.id}/image`);
    expect(pictureOf(ARTIST)).toBe(`/api/music/albums/${ARTIST.imageAlbumId ?? ''}/artwork`);
    expect(pictureOf({ ...ARTIST, imageAlbumId: null })).toBeNull();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ArtistShelf.displayName).toBe('ArtistShelf');
  });
});
