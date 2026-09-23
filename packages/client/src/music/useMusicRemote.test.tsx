import { waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { emitPresenceEvent } from '@ValenceClient/presence/presenceEvents';
import { renderHookInACache } from '@ValenceClient/testing/renderHookInACache';
import { aFakeMusicPlayer } from '@ValenceClient/testing/aFakeMusicPlayer';
import { useMusicRemote } from '@ValenceClient/music/useMusicRemote';
import type { MusicDevice } from '@ValenceContracts/schemas/MusicRemote';

vi.mock('@ValenceClient/music/watchMusicDevices', () => ({
  watchMusicDevices: () => () => {},
}));

const devices = vi.hoisted(() => ({
  fetchMusicDevices: vi.fn((): Promise<MusicDevice[]> => Promise.resolve([])),
}));

vi.mock('@ValenceClient/music/musicDevices', () => devices);

describe('useMusicRemote', () => {
  it('does what another of this person’s devices says', () => {
    const { player } = aFakeMusicPlayer();

    renderHookInACache(() => {
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

    renderHookInACache(() => {
      useMusicRemote(player);
    });

    emitPresenceEvent({ kind: 'message', text: 'Tea is ready' });

    expect(player.obey).not.toHaveBeenCalled();
  });

  it('stops listening once gone', () => {
    const { player } = aFakeMusicPlayer();

    const { unmount } = renderHookInACache(() => {
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

  it('mirrors what the device it controls says it is doing', async () => {
    const nowPlaying = {
      trackId: '00000000-0000-4000-8000-000000000001',
      title: 'Caramel',
      artists: ['Sleep Token'],
      albumId: '00000000-0000-4000-8000-000000000002',
      hasArtwork: true,
      positionSeconds: 12,
      durationSeconds: 290,
      isPlaying: true,
      volume: 0.4,
      isMuted: false,
      quality: 'lossless' as const,
      upNext: [],
      reportedAtMs: 1,
    };

    devices.fetchMusicDevices.mockResolvedValue([
      { clientId: 'phone', label: 'iPhone', nowPlaying },
    ]);

    const { player } = aFakeMusicPlayer({ remote: { clientId: 'phone', label: 'iPhone' } });

    renderHookInACache(() => {
      useMusicRemote(player);
    });

    await waitFor(() => {
      expect(player.mirror).toHaveBeenCalledWith(nowPlaying);
    });
  });

  it('mirrors nothing while it plays here', async () => {
    const { player } = aFakeMusicPlayer();

    renderHookInACache(() => {
      useMusicRemote(player);
    });

    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(player.mirror).not.toHaveBeenCalled();
  });
});
