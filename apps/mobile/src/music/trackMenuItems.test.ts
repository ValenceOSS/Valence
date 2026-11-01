import { aTrack } from '@ValenceClient/testing/aTrack';
import { thePhonesMusicPlayer } from '@ValenceMobile/music/thePhonesMusicPlayer';
import { trackMenuItems } from './trackMenuItems';
import type { TrackMenu } from './trackMenuItems.types';

/**
 * A track's menu for a test, with nothing told yet.
 *
 * @param overrides - What differs.
 * @returns What the menu is made from.
 */
const aMenu = (overrides: Partial<TrackMenu> = {}): TrackMenu => ({
  track: aTrack(1),
  player: thePhonesMusicPlayer(),
  isLiked: false,
  onLike: jest.fn(),
  onAlbum: jest.fn(),
  onArtist: jest.fn(),
  playlists: [],
  onPlaylistsChanged: jest.fn(),
  ...overrides,
});

describe('trackMenuItems', () => {
  it('plays the song next when chosen', () => {
    const menu = aMenu();
    const playNext = jest.spyOn(menu.player, 'playNext').mockImplementation(() => undefined);

    trackMenuItems(menu)
      .find((item) => item.label === 'Play next')
      ?.onChoose();

    expect(playNext).toHaveBeenCalledWith([menu.track]);
  });

  it('goes to the album and the artist', () => {
    const menu = aMenu();
    const items = trackMenuItems(menu);

    items.find((item) => item.label === 'Go to album')?.onChoose();
    items.find((item) => item.label === 'Go to artist')?.onChoose();

    expect(menu.onAlbum).toHaveBeenCalledWith(menu.track.album.id);
    expect(menu.onArtist).toHaveBeenCalledWith(menu.track.artists[0]?.id);
  });

  it('offers moving and removing only inside a playlist, and marks removing', () => {
    const outside = trackMenuItems(aMenu()).map((item) => item.label);
    const inside = trackMenuItems(
      aMenu({
        inAPlaylist: {
          canMoveUp: false,
          canMoveDown: true,
          onMoveUp: jest.fn(),
          onMoveDown: jest.fn(),
          onRemove: jest.fn(),
        },
      }),
    );

    expect(outside).not.toContain('Remove from this playlist');
    expect(inside.map((item) => item.label)).toContain('Move down');
    expect(inside.map((item) => item.label)).not.toContain('Move up');
    expect(inside.find((item) => item.label === 'Remove from this playlist')?.isDestructive).toBe(
      true,
    );
  });

  it('says a liked song can be taken out of liked songs', () => {
    expect(trackMenuItems(aMenu({ isLiked: true })).map((item) => item.label)).toContain(
      'Remove from liked songs',
    );
  });
});
