import { artistItem } from '@ValenceTv/music/artistItem';
import type { MusicArtist } from '@ValenceContracts/schemas/Music';

const ARTIST: MusicArtist = {
  id: '00000000-0000-4000-8000-000000000001',
  libraryId: '00000000-0000-4000-8000-000000000002',
  name: 'Sleep Token',
  hasImage: true,
  imageAlbumId: '00000000-0000-4000-8000-000000000003',
  albumCount: 3,
  trackCount: 36,
  isFavourite: false,
};

describe('artistItem', () => {
  it('names the artist with their own picture', () => {
    expect(artistItem(ARTIST)).toEqual({
      kind: 'artist',
      id: ARTIST.id,
      title: 'Sleep Token',
      detail: 'Artist',
      art: `/api/music/artists/${ARTIST.id}/image`,
      view: { kind: 'artist', id: ARTIST.id },
    });
  });

  it('borrows an album cover where the artist has no picture', () => {
    expect(artistItem({ ...ARTIST, hasImage: false }).art).toBe(
      '/api/music/albums/00000000-0000-4000-8000-000000000003/artwork',
    );
  });

  it('has no picture where there is neither', () => {
    expect(artistItem({ ...ARTIST, hasImage: false, imageAlbumId: null }).art).toBeNull();
  });
});
