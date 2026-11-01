import { describe, expect, it, vi } from 'vitest';
import { createMemoryPlaybackService } from '@ValenceServer/playback/createMemoryPlaybackService';
import { createPresenceService } from '@ValenceServer/presence/PresenceService';
import { endWhatSignInsHeld } from './endWhatSignInsHeld';

/**
 * Somebody with the app open, signed in with the given sign-in.
 */
const openOn = (clientId: string, accountId: string, sessionId: string | null) => {
  const send = vi.fn();

  return {
    send,
    arrival: {
      clientId,
      socketId: `socket-${clientId}`,
      accountId,
      profileId: null,
      profileName: null,
      deviceLabel: 'Pixel 9',
      sessionId,
      send,
    },
  };
};

describe('endWhatSignInsHeld', () => {
  it('tells every tab of the ended sign-ins why, and closes their sockets', async () => {
    const presence = createPresenceService();
    const closeSockets = vi.fn();
    const ended = openOn('tab-1', 'dan', 'session-1');
    const kept = openOn('tab-2', 'dan', 'session-2');

    presence.connect(ended.arrival);
    presence.connect(kept.arrival);

    await endWhatSignInsHeld(
      { playback: createMemoryPlaybackService(), presence, closeSockets },
      { sessionIds: ['session-1'] },
      'Signed out',
    );

    expect(ended.send).toHaveBeenCalledWith({ kind: 'stopped', reason: 'Signed out' });
    expect(kept.send).not.toHaveBeenCalled();
    expect(closeSockets).toHaveBeenCalledWith({ sessionIds: ['session-1'] });
  });

  it('reaches every tab of an account signed out everywhere, and nobody else’s', async () => {
    const presence = createPresenceService();
    const dans = [openOn('tab-1', 'dan', 'session-1'), openOn('tab-2', 'dan', 'session-2')];
    const marques = openOn('tab-3', 'marques', 'session-3');

    for (const one of [...dans, marques]) {
      presence.connect(one.arrival);
    }

    await endWhatSignInsHeld(
      { playback: createMemoryPlaybackService(), presence },
      { accountId: 'dan' },
      'Signed out',
    );

    for (const one of dans) {
      expect(one.send).toHaveBeenCalledWith({ kind: 'stopped', reason: 'Signed out' });
    }

    expect(marques.send).not.toHaveBeenCalled();
  });
});
