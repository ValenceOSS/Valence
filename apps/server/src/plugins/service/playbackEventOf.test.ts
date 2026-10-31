import { describe, expect, it } from 'vitest';
import { playbackEventOf } from './playbackEventOf';

describe('playbackEventOf', () => {
  it('tells of a pause as who, what, where it got to and on which device', () => {
    expect(
      playbackEventOf('playback.paused', Date.parse('2026-10-31T12:00:00.000Z'), {
        accountId: 'account-1',
        profileId: 'profile-1',
        mediaId: 'item-1',
        positionSeconds: 70,
        durationSeconds: 6000,
        clientKind: 'browser',
        deviceLabel: 'Chrome on Mac',
      }),
    ).toEqual({
      topic: 'playback.paused',
      occurredAt: '2026-10-31T12:00:00.000Z',
      accountId: 'account-1',
      profileId: 'profile-1',
      mediaId: 'item-1',
      positionSeconds: 70,
      durationSeconds: 6000,
      client: { kind: 'browser', label: 'Chrome on Mac' },
    });
  });
});
