import { describe, expect, it } from 'vitest';
import {
  ReportNowWatchingSchema,
  SendVideoCommandSchema,
  VideoCommandSchema,
  VideoDeviceListSchema,
  VideoNowWatchingSchema,
} from './VideoRemote';

const NOW_WATCHING = {
  mediaId: '00000000-0000-4000-8000-000000000001',
  title: 'Arrival',
  subtitle: null,
  hasBackdrop: true,
  positionSeconds: 60,
  durationSeconds: 6000,
  isPlaying: true,
  reportedAtMs: 1,
};

describe('VideoCommandSchema', () => {
  it('reads a command to play a film from a point', () => {
    const command = {
      kind: 'play',
      mediaId: '00000000-0000-4000-8000-000000000001',
      startSeconds: 42,
    };

    expect(VideoCommandSchema.parse(command)).toEqual(command);
  });

  it('refuses to play something that is not a film id', () => {
    expect(
      VideoCommandSchema.safeParse({ kind: 'play', mediaId: 'arrival', startSeconds: 0 }).success,
    ).toBe(false);
  });

  it('reads the buttons a remote has', () => {
    for (const command of [
      { kind: 'pause' },
      { kind: 'resume' },
      { kind: 'stop' },
      { kind: 'seek', positionSeconds: 30 },
      { kind: 'skip', seconds: -10 },
    ]) {
      expect(VideoCommandSchema.safeParse(command).success).toBe(true);
    }
  });

  it('refuses to seek before the start', () => {
    expect(VideoCommandSchema.safeParse({ kind: 'seek', positionSeconds: -1 }).success).toBe(false);
  });

  it('refuses a skip of more than an hour, or of part of a second', () => {
    expect(VideoCommandSchema.safeParse({ kind: 'skip', seconds: 3601 }).success).toBe(false);
    expect(VideoCommandSchema.safeParse({ kind: 'skip', seconds: 1.5 }).success).toBe(false);
  });
});

describe('VideoNowWatchingSchema', () => {
  it('reads what a device says it is watching', () => {
    expect(VideoNowWatchingSchema.parse(NOW_WATCHING)).toEqual(NOW_WATCHING);
  });

  it('refuses a position before the start', () => {
    expect(VideoNowWatchingSchema.safeParse({ ...NOW_WATCHING, positionSeconds: -5 }).success).toBe(
      false,
    );
  });
});

describe('VideoDeviceListSchema', () => {
  it('reads a device that has not said what kind it is', () => {
    const list = { devices: [{ clientId: 'tab', label: 'Chrome', kind: null, nowWatching: null }] };

    expect(VideoDeviceListSchema.parse(list)).toEqual(list);
  });

  it('refuses a device with no id', () => {
    expect(
      VideoDeviceListSchema.safeParse({
        devices: [{ clientId: '', label: 'Chrome', kind: 'browser', nowWatching: null }],
      }).success,
    ).toBe(false);
  });
});

describe('ReportNowWatchingSchema', () => {
  it('reads a report that a device has stopped watching', () => {
    expect(ReportNowWatchingSchema.safeParse({ clientId: 'tv', nowWatching: null }).success).toBe(
      true,
    );
  });

  it('refuses a device id longer than any Valence gives out', () => {
    expect(
      ReportNowWatchingSchema.safeParse({ clientId: 'x'.repeat(121), nowWatching: null }).success,
    ).toBe(false);
  });
});

describe('SendVideoCommandSchema', () => {
  it('reads a command that says which device sent it', () => {
    expect(
      SendVideoCommandSchema.safeParse({ fromClientId: 'phone', command: { kind: 'pause' } })
        .success,
    ).toBe(true);
  });

  it('refuses a command from nowhere', () => {
    expect(
      SendVideoCommandSchema.safeParse({ fromClientId: '', command: { kind: 'pause' } }).success,
    ).toBe(false);
  });
});
