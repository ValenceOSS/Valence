import { describe, expect, it, vi } from 'vitest';
import { aFakeMusicPlayer } from '@ValenceScreens/testing/aFakeMusicPlayer';
import { aTrack } from '@ValenceScreens/testing/aTrack';
import { musicMenuFor } from './musicMenuFor';

const found = vi.hoisted(() => ({ tracksFor: vi.fn() }));

vi.mock('./tracksFor', () => found);

const SONGS = [aTrack(1), aTrack(2)];

const SOURCE = { kind: 'album', id: 'a1', name: 'Arcadia' } as const;

/**
 * Chooses an item from the menu by its id.
 *
 * @param groups - The menu.
 * @param id - The item.
 */
const choose = (groups: ReturnType<typeof musicMenuFor>, id: string) => {
  groups
    .flatMap((group) => group.items)
    .find((item) => item.id === id)
    ?.onChoose();
};

describe('musicMenuFor', () => {
  it('plays it', async () => {
    found.tracksFor.mockResolvedValue({ tracks: SONGS, source: SOURCE, isOrdered: false });

    const { player } = aFakeMusicPlayer();

    choose(musicMenuFor({ kind: 'album', id: 'a1' }, 'Arcadia', player, vi.fn()), 'play');

    await vi.waitFor(() => {
      expect(player.play).toHaveBeenCalledWith(SONGS, 0, { source: SOURCE, isOrdered: false });
    });
  });

  it('puts it next, or at the end of the queue', async () => {
    found.tracksFor.mockResolvedValue({ tracks: SONGS, source: SOURCE, isOrdered: false });

    const { player } = aFakeMusicPlayer();
    const menu = musicMenuFor({ kind: 'album', id: 'a1' }, 'Arcadia', player, vi.fn());

    choose(menu, 'next');
    choose(menu, 'queue');

    await vi.waitFor(() => {
      expect(player.playNext).toHaveBeenCalledWith(SONGS);
      expect(player.addToQueue).toHaveBeenCalledWith(SONGS);
    });
  });

  it('opens it', () => {
    const open = vi.fn();

    choose(
      musicMenuFor({ kind: 'album', id: 'a1' }, 'Arcadia', aFakeMusicPlayer().player, open),
      'open',
    );

    expect(open).toHaveBeenCalledWith({ kind: 'album', id: 'a1' });
  });

  it('plays nothing where there is nothing to play', async () => {
    found.tracksFor.mockResolvedValue({ tracks: [], source: SOURCE, isOrdered: false });

    const { player } = aFakeMusicPlayer();

    choose(musicMenuFor({ kind: 'album', id: 'a1' }, 'Arcadia', player, vi.fn()), 'play');

    await Promise.resolve();

    expect(player.play).not.toHaveBeenCalled();
  });
});
