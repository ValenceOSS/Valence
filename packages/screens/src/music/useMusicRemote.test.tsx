import { describe, expect, it, vi } from 'vitest';
import { emitPresenceEvent } from '@ValenceClient/presence/presenceEvents';
import { renderHookInAnAddress } from '@ValenceScreens/testing/renderHookInAnAddress';
import { aFakeMusicPlayer } from '@ValenceScreens/testing/aFakeMusicPlayer';
import { useMusicRemote } from './useMusicRemote';

vi.mock('@ValenceClient/music/watchMusicDevices', () => ({
  watchMusicDevices: () => () => {},
}));

describe('useMusicRemote', () => {
  it('does what another of this person’s devices says', () => {
    const { player } = aFakeMusicPlayer();

    renderHookInAnAddress(() => {
      useMusicRemote(player);
    });

    emitPresenceEvent({
      kind: 'music',
      command: { kind: 'pause' },
      fromClientId: 'phone',
      fromLabel: 'iPhone',
    });

    expect(player.obey).toHaveBeenCalledWith({ kind: 'pause' });
  });

  it('ignores presence news that is not about music', () => {
    const { player } = aFakeMusicPlayer();

    renderHookInAnAddress(() => {
      useMusicRemote(player);
    });

    emitPresenceEvent({ kind: 'message', text: 'Tea is ready' });

    expect(player.obey).not.toHaveBeenCalled();
  });

  it('stops listening once gone', () => {
    const { player } = aFakeMusicPlayer();

    const { unmount } = renderHookInAnAddress(() => {
      useMusicRemote(player);
    });

    unmount();
    emitPresenceEvent({
      kind: 'music',
      command: { kind: 'next' },
      fromClientId: 'x',
      fromLabel: 'x',
    });

    expect(player.obey).not.toHaveBeenCalled();
  });
});
