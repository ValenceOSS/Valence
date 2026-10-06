import { describe, expect, it } from 'vitest';
import {
  MusicCommandSchema,
  MusicDeviceSchema,
  MusicNowPlayingSchema,
  PlaybackEventSchema,
} from './MusicRemote';

describe('MusicRemote', () => {
  it('reads a device from an older server as one of no known kind or age', () => {
    expect(
      MusicDeviceSchema.parse({ clientId: 'laptop', label: 'MacBook', nowPlaying: null }),
    ).toEqual({
      clientId: 'laptop',
      label: 'MacBook',
      nowPlaying: null,
      clientKind: null,
      ageMs: null,
    });
  });

  it('reads how long ago a device reported, and nothing for an age that cannot be', () => {
    const device = { clientId: 'laptop', label: 'MacBook', nowPlaying: null, clientKind: null };

    expect(MusicDeviceSchema.parse({ ...device, ageMs: 1_200 }).ageMs).toBe(1_200);
    expect(MusicDeviceSchema.parse({ ...device, ageMs: -5 }).ageMs).toBeNull();
  });

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

  it('reads the news that a profile’s film devices changed', () => {
    expect(PlaybackEventSchema.parse({ kind: 'videoDevicesChanged' })).toEqual({
      kind: 'videoDevicesChanged',
    });
  });

  it('reads a report that carries what plays next and whether it is muted', () => {
    const report = MusicNowPlayingSchema.parse({
      trackId: '00000000-0000-4000-8000-000000000001',
      title: 'Caramel',
      artists: ['Sleep Token'],
      albumId: '00000000-0000-4000-8000-000000000002',
      hasArtwork: true,
      positionSeconds: 1,
      durationSeconds: 290,
      isPlaying: true,
      volume: 0.5,
      reportedAtMs: 1,
    });

    expect(report.upNext).toEqual([]);
    expect(report.isMuted).toBe(false);
  });

  it('reads the commands that change another device’s queue', () => {
    expect(
      MusicCommandSchema.safeParse({
        kind: 'enqueue',
        trackIds: ['00000000-0000-4000-8000-000000000001'],
        where: 'next',
      }).success,
    ).toBe(true);
    expect(MusicCommandSchema.safeParse({ kind: 'skipTo', ahead: 2 }).success).toBe(true);
    expect(MusicCommandSchema.safeParse({ kind: 'unqueue', ahead: 0 }).success).toBe(false);
    expect(MusicCommandSchema.safeParse({ kind: 'mute', isMuted: true }).success).toBe(true);
  });
});
