import { playlistItem } from '@ValenceTv/music/playlistItem';
import type { PlaylistSummary } from '@ValenceContracts/schemas/Playlist';

const COVER = '00000000-0000-4000-8000-000000000009';

const PLAYLIST: PlaylistSummary = {
  id: '00000000-0000-4000-8000-000000000001',
  name: 'Late Night',
  description: null,
  isShared: false,
  isOrdered: true,
  isMine: true,
  owner: null,
  entryCount: 4,
  lostCount: 0,
  durationSeconds: 900,
  artworkAlbumIds: [COVER],
  updatedAt: '2026-09-23T00:00:00.000Z',
};

describe('playlistItem', () => {
  it('shows the first album on it as its cover', () => {
    expect(playlistItem(PLAYLIST)).toEqual({
      kind: 'playlist',
      id: PLAYLIST.id,
      title: 'Late Night',
      detail: 'Playlist',
      art: `/api/music/albums/${COVER}/artwork`,
      view: { kind: 'playlist', id: PLAYLIST.id },
    });
  });

  it('says whose it is where it belongs to somebody else', () => {
    const theirs = playlistItem({
      ...PLAYLIST,
      isMine: false,
      owner: { profileId: '00000000-0000-4000-8000-000000000005', name: 'Sam', colour: '#fff' },
    });

    expect(theirs.detail).toBe('Playlist • Sam');
  });

  it('says only that it is a playlist where somebody else owns it but is not named', () => {
    expect(playlistItem({ ...PLAYLIST, isMine: false }).detail).toBe('Playlist');
  });

  it('has no picture where nothing on it has a cover', () => {
    expect(playlistItem({ ...PLAYLIST, artworkAlbumIds: [] }).art).toBeNull();
  });
});
