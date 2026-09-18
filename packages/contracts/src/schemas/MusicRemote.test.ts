import { describe, expect, it } from 'vitest';
import { MusicCommandSchema, PlaybackEventSchema } from './MusicRemote';

describe('MusicRemote', () => {
  it('reads a command to take over what is playing', () => {
    const command = {
      kind: 'play',
      trackIds: ['00000000-0000-4000-8000-000000000001'],
      index: 0,
      positionSeconds: 42,
      isPlaying: true,
    };

    expect(MusicCommandSchema.parse(command)).toEqual(command);
  });

  it('refuses a volume past full', () => {
    expect(MusicCommandSchema.safeParse({ kind: 'volume', volume: 2 }).success).toBe(false);
  });

  it('refuses to play nothing', () => {
    expect(
      MusicCommandSchema.safeParse({
        kind: 'play',
        trackIds: [],
        index: 0,
        positionSeconds: 0,
        isPlaying: true,
      }).success,
    ).toBe(false);
  });

  it('reads the news that a profile’s devices changed', () => {
    expect(PlaybackEventSchema.parse({ kind: 'musicDevicesChanged' })).toEqual({
      kind: 'musicDevicesChanged',
    });
  });
});
