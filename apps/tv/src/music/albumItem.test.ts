import { albumItem } from '@ValenceTv/music/albumItem';
import type { MusicAlbum } from '@ValenceContracts/schemas/Music';

const ALBUM: MusicAlbum = {
  id: '00000000-0000-4000-8000-000000000001',
  libraryId: '00000000-0000-4000-8000-000000000002',
  title: 'Take Me Back To Eden',
  artist: { id: '00000000-0000-4000-8000-000000000003', name: 'Sleep Token' },
  year: 2023,
  genres: [],
  hasArtwork: true,
  isCompilation: false,
  trackCount: 12,
  durationSeconds: 3600,
  sizeBytes: 1,
  isExplicit: false,
  addedAt: '2026-09-23T00:00:00.000Z',
};

describe('albumItem', () => {
  it('names the album and who made it, with its cover', () => {
    expect(albumItem(ALBUM)).toMatchObject({
      kind: 'album',
      title: 'Take Me Back To Eden',
      detail: 'Sleep Token • Album',
      art: `/api/music/albums/${ALBUM.id}/artwork`,
      view: { kind: 'album', id: ALBUM.id },
    });
  });

  it('has no picture where the album has no cover', () => {
    expect(albumItem({ ...ALBUM, hasArtwork: false }).art).toBeNull();
  });
});
