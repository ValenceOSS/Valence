import { describe, expect, it, vi } from 'vitest';
import { watchMusicDevices } from './watchMusicDevices';
import type { RealtimeClient } from '@ValenceClient/realtime/createRealtimeClient';
import type { RealtimeEvent, RealtimeTopic } from '@ValenceContracts/schemas/Realtime';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';

const createFakeClient = () => {
  const listeners = new Map<RealtimeTopic, (event: RealtimeEvent) => void>();

  const client: RealtimeClient = {
    start: () => {},
    stop: () => {},
    subscribe: (topic, listen) => {
      listeners.set(topic, listen);

      return () => {
        listeners.delete(topic);
      };
    },
    identify: () => {},
    onResumed: () => () => {},
    isLive: () => true,
    connectionId: () => null,
    sendParty: () => {},
    askClock: () => {},
    onClockTell: () => () => {},
    onRefused: () => () => {},
    onNeedsPassword: () => () => {},
  };

  return {
    client,
    listeners,
    arrive: (payload: JsonValue) => {
      listeners.get('playback')?.({
        kind: 'event',
        topic: 'playback',
        atMs: 1,
        folded: 0,
        payload,
      });
    },
  };
};

describe('watchMusicDevices', () => {
  it('says when this profile’s devices change', () => {
    const fake = createFakeClient();
    const onChanged = vi.fn();

    watchMusicDevices(onChanged, fake.client);
    fake.arrive({ kind: 'musicDevicesChanged' });

    expect(onChanged).toHaveBeenCalledTimes(1);
  });

  it('ignores anything else on the playback topic', () => {
    const fake = createFakeClient();
    const onChanged = vi.fn();

    watchMusicDevices(onChanged, fake.client);
    fake.arrive({ kind: 'somethingElse' });

    expect(onChanged).not.toHaveBeenCalled();
  });

  it('stops listening when told to', () => {
    const fake = createFakeClient();

    watchMusicDevices(vi.fn(), fake.client)();

    expect(fake.listeners.has('playback')).toBe(false);
  });
});
