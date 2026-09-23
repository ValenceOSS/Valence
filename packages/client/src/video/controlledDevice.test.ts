import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  controlDevice,
  onControlledDevice,
  readControlledDevice,
} from '@ValenceClient/video/controlledDevice';

afterEach(() => {
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
});
