import { sayVerbatim } from '@ValenceI18n/sayVerbatim';
import { describe, expect, it, vi } from 'vitest';
import { createPresenceService } from './PresenceService';
import { recentHealthOf } from './recentHealthOf';
import type { PlaybackPlan, Reason } from '@ValenceContracts/schemas/PlaybackPlan';

const reason: Reason = {
  code: 'ClientSupportsSource',
  detail: sayVerbatim('Client declares support'),
};

const plan: PlaybackPlan = {
  mediaId: '3f2504e0-4f89-41d3-9a0c-0305e82c3301',
  container: { kind: 'passthrough', reason },
  video: { kind: 'passthrough', reason },
  audio: { kind: 'passthrough', streamIndex: 1, reason },
  subtitles: { kind: 'none', reason },
};

const HEALTH = {
  positionSeconds: 1200,
  durationSeconds: 8500,
  bufferedAheadSeconds: 60,
  presentedWidth: 1920,
  presentedHeight: 800,
};

/**
 * A presence with one device watching a film, on a clock the test moves.
 *
 * @returns The presence and a way to move the clock on.
 */
const watching = () => {
  const clock = { nowMs: 10_000 };
  const presence = createPresenceService({}, () => clock.nowMs);

  presence.connect({
    clientId: 'tab-1',
    socketId: 'socket-1',
    accountId: 'account-1',
    profileId: 'profile-1',
    profileName: 'Marques',
    deviceLabel: 'Windows PC',
    send: vi.fn(),
  });
  presence.startPlayback('tab-1', {
    mediaId: 'media-1',
    mediaTitle: 'Arrival',
    seriesTitle: null,
    seasonNumber: null,
    episodeNumber: null,
    hasPoster: true,
    hasBackdrop: true,
    mode: 'transcode',
    reuse: null,
    transcoderSessionId: 'session-1',
    plan,
  });

  return {
    presence,
    moveOn: (ms: number) => {
      clock.nowMs += ms;
    },
  };
};

describe('recentHealthOf', () => {
  it('says what a player said a moment ago', () => {
    const { presence, moveOn } = watching();

    presence.heartbeatPlayback('tab-1', true, HEALTH);
    moveOn(1000);

    expect(recentHealthOf(presence, 'tab-1')).toEqual(HEALTH);
  });

  it('says nothing for a player that has not measured its stream, or has gone quiet', () => {
    const { presence, moveOn } = watching();

    presence.heartbeatPlayback('tab-1', true);

    expect(recentHealthOf(presence, 'tab-1')).toBeUndefined();

    presence.heartbeatPlayback('tab-1', true, HEALTH);
    moveOn(30_000);

    expect(recentHealthOf(presence, 'tab-1')).toBeUndefined();
  });

  it('says nothing for a device it does not know', () => {
    const { presence } = watching();

    expect(recentHealthOf(presence, 'tab-2')).toBeUndefined();
  });
});
