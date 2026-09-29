import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { aFakeSocket } from '@ValenceClient/testing/aFakeSocket';
import { usePluginWithdrawn } from './usePluginWithdrawn';
import type { PluginChange } from '@ValenceContracts/schemas/Plugin';

vi.mock('@ValenceClient/realtime/getRealtimeClient', () => ({ getRealtimeClient: () => null }));

/**
 * The socket's word that a plugin changed.
 *
 * @param change - What changed.
 * @returns The event as the socket delivers it.
 */
const said = (change: PluginChange) => ({
  kind: 'event' as const,
  topic: 'plugins' as const,
  atMs: 0,
  folded: 0,
  payload: change,
});

const NOTHING_SHOWN: { pluginId: string | null } = { pluginId: null };

describe('usePluginWithdrawn', () => {
  it('says when the plugin being shown is turned off or removed, and nothing else', () => {
    const socket = aFakeSocket();
    const onWithdrawn = vi.fn<(change: PluginChange) => void>();

    renderHook(() => {
      usePluginWithdrawn('anilist', onWithdrawn, socket.client);
    });

    socket.say('plugins', said({ pluginId: 'anilist', change: 'settings' }));
    socket.say('plugins', said({ pluginId: 'music-import', change: 'disabled' }));
    socket.say('plugins', {
      ...said({ pluginId: 'anilist', change: 'disabled' }),
      payload: 'nonsense',
    });

    expect(onWithdrawn).not.toHaveBeenCalled();

    socket.say('plugins', said({ pluginId: 'anilist', change: 'disabled' }));
    socket.say('plugins', said({ pluginId: 'anilist', change: 'removed' }));

    expect(onWithdrawn.mock.calls.map(([change]) => change.change)).toEqual([
      'disabled',
      'removed',
    ]);
  });

  it('listens for nothing while no plugin is shown, and stops once it is gone', () => {
    const socket = aFakeSocket();
    const onWithdrawn = vi.fn();
    const { rerender, unmount } = renderHook(
      ({ pluginId }: { pluginId: string | null }) => {
        usePluginWithdrawn(pluginId, onWithdrawn, socket.client);
      },
      { initialProps: NOTHING_SHOWN },
    );

    socket.say('plugins', said({ pluginId: 'anilist', change: 'removed' }));

    expect(onWithdrawn).not.toHaveBeenCalled();

    rerender({ pluginId: 'anilist' });
    unmount();

    expect(socket.stopped).toEqual(['plugins']);
  });

  it('listens for nothing with nobody signed in to hear it', () => {
    const onWithdrawn = vi.fn();

    renderHook(() => {
      usePluginWithdrawn('anilist', onWithdrawn);
    });

    expect(onWithdrawn).not.toHaveBeenCalled();
  });
});
