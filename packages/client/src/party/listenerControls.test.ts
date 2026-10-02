import { describe, expect, it, vi } from 'vitest';
import { listenerControls } from './listenerControls';
import { aWatchParty } from '@ValenceClient/testing/aWatchParty';
import type { ListeningParty } from './listeningParty';

const player = () => ({ pause: vi.fn(), resume: vi.fn(), seek: vi.fn() });

/**
 * A listening party this client is in, choosing or following.
 *
 * @param change - What differs.
 * @returns The party.
 */
const listening = (change: Partial<ListeningParty> = {}): ListeningParty => ({
  party: aWatchParty({ kind: 'listen' }),
  hostName: 'Dan',
  mayChoose: false,
  mayPlayPause: false,
  maySeek: false,
  send: vi.fn(),
  ...change,
});

describe('listenerControls', () => {
  it('simply drives the player outside a party', () => {
    const driven = player();
    const controls = listenerControls(null, { isPlaying: true, positionSeconds: 5 }, driven);

    controls.playPause();
    controls.seek(30);

    expect(controls).toMatchObject({ isFollowing: false, mayPlayPause: true, maySeek: true });
    expect(driven.pause).toHaveBeenCalled();
    expect(driven.seek).toHaveBeenCalledWith(30);
  });

  it('hands pausing and moving to the host, where they let everybody', () => {
    const driven = player();
    const party = listening({ mayPlayPause: true, maySeek: true });
    const controls = listenerControls(party, { isPlaying: true, positionSeconds: 5 }, driven);

    controls.playPause();
    controls.seek(30);

    expect(party.send).toHaveBeenCalledWith({ kind: 'pause', atSeconds: 5 });
    expect(party.send).toHaveBeenCalledWith({ kind: 'seek', atSeconds: 30 });
    expect(driven.pause).not.toHaveBeenCalled();
  });

  it('lets a follower do neither where the host has not let them', () => {
    const controls = listenerControls(
      listening(),
      { isPlaying: true, positionSeconds: 5 },
      player(),
    );

    expect(controls).toMatchObject({ isFollowing: true, mayPlayPause: false, maySeek: false });
  });

  it('lets a follower whose music did not start press play to join in', () => {
    const driven = player();
    const controls = listenerControls(
      listening(),
      { isPlaying: false, positionSeconds: 5 },
      driven,
    );

    controls.playPause();

    expect(controls.mayPlayPause).toBe(true);
    expect(driven.resume).toHaveBeenCalled();
  });
});
