import { describe, expect, it } from 'vitest';
import { aStillPlatform } from './aStillPlatform';

describe('aStillPlatform', () => {
  it('keeps a preference in memory until it is forgotten', () => {
    const { store } = aStillPlatform();

    store.write('valence.theme', 'dark');

    expect(store.read('valence.theme')).toBe('dark');

    store.forget('valence.theme');

    expect(store.read('valence.theme')).toBeNull();
  });

  it('keeps nothing between two platforms', () => {
    aStillPlatform().store.write('valence.theme', 'dark');

    expect(aStillPlatform().store.read('valence.theme')).toBeNull();
  });

  it('has no server and nobody to tell', () => {
    const platform = aStillPlatform();

    expect(platform.serverAddress()).toBeNull();
    expect(platform.buildInfo()).toBeNull();
    expect(platform.reachability.isReachable()).toBe(true);
    expect(() => {
      platform.notifyLocally({ title: 'Arrived', body: 'A film' });
      platform.setUnreadBadge(2);
    }).not.toThrow();
  });

  it('opens a socket that sends nowhere', () => {
    const socket = aStillPlatform().openSocket({
      onOpen: () => {},
      onMessage: () => {},
      onClose: () => {},
    });

    expect(() => {
      socket.send('{}');
      socket.close();
    }).not.toThrow();
  });

  it('plays nothing', async () => {
    const platform = aStillPlatform();

    await expect(platform.musicAudio().audio.play()).resolves.toBeUndefined();
    await expect(platform.listeningAudio().play()).resolves.toBeUndefined();
    expect(platform.passkeys()).toEqual({ kind: 'in-the-page' });
  });
});
