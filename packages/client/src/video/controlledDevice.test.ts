import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  controlDevice,
  dismissDevice,
  isDismissed,
  noteWhoIsWatching,
  onControlledDevice,
  readControlledDevice,
} from '@ValenceClient/video/controlledDevice';

const TV = { clientId: 'tv', label: 'Living room' };

afterEach(() => {
  controlDevice({ clientId: 'bedroom', label: 'Bedroom' });
  controlDevice(TV);
  controlDevice(null);
});

describe('controlledDevice', () => {
  it('controls nothing to begin with', () => {
    expect(readControlledDevice()).toBeNull();
  });

  it('remembers the device this one is the remote for', () => {
    controlDevice({ clientId: 'tv', label: 'Living room' });

    expect(readControlledDevice()).toEqual({ clientId: 'tv', label: 'Living room' });
  });

  it('tells a listener when it starts and stops being a remote', () => {
    const listener = vi.fn();

    onControlledDevice(listener);
    controlDevice({ clientId: 'tv', label: 'Living room' });
    controlDevice(null);

    expect(listener).toHaveBeenCalledTimes(2);
    expect(readControlledDevice()).toBeNull();
  });

  it('says nothing when told to control the device it already controls', () => {
    controlDevice({ clientId: 'tv', label: 'Living room' });

    const listener = vi.fn();

    onControlledDevice(listener);
    controlDevice({ clientId: 'tv', label: 'Living room' });

    expect(listener).not.toHaveBeenCalled();
  });

  it('stops telling a listener once it lets go', () => {
    const listener = vi.fn();

    onControlledDevice(listener)();
    controlDevice({ clientId: 'tv', label: 'Living room' });

    expect(listener).not.toHaveBeenCalled();
  });

  it('puts the remote away without anything being sent, and leaves the device alone', () => {
    controlDevice(TV);
    dismissDevice('tv');

    expect(readControlledDevice()).toBeNull();
    expect(isDismissed('tv')).toBe(true);
  });

  it('leaves the device it controls alone where another one is put away', () => {
    controlDevice(TV);
    dismissDevice('bedroom');

    expect(readControlledDevice()).toEqual(TV);
    expect(isDismissed('bedroom')).toBe(true);
  });

  it('keeps a device left alone while it goes on to the next episode', () => {
    dismissDevice('tv');
    noteWhoIsWatching(new Set(), 1_000);
    noteWhoIsWatching(new Set(['tv']), 4_000);

    expect(isDismissed('tv')).toBe(true);
  });

  it('keeps a device left alone however long it carries on watching', () => {
    dismissDevice('tv');
    noteWhoIsWatching(new Set(['tv']), 1_000);
    noteWhoIsWatching(new Set(['tv']), 10_000_000);

    expect(isDismissed('tv')).toBe(true);
  });

  it('follows a device again once it has stopped for a while and starts something new', () => {
    dismissDevice('tv');
    noteWhoIsWatching(new Set(), 1_000);
    noteWhoIsWatching(new Set(), 100_000);
    noteWhoIsWatching(new Set(['tv']), 1_000 + 120_000);

    expect(isDismissed('tv')).toBe(false);
  });

  it('forgets having left a device alone once somebody chooses it', () => {
    dismissDevice('tv');
    controlDevice(TV);

    expect(isDismissed('tv')).toBe(false);
    expect(readControlledDevice()).toEqual(TV);
  });
});
