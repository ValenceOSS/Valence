import { describe, expect, it } from 'vitest';
import { describeSessionDelivery } from './describeSessionDelivery';
import type { ActiveSession } from '@ValenceClient/admin/fetchAdmin';
import type { PlaybackPlan, Reason } from '@ValenceContracts/schemas/PlaybackPlan';

const reason: Reason = { code: 'ClientSupportsSource', detail: 'The client takes it as it is' };

const PLAN: PlaybackPlan = {
  mediaId: '3f2504e0-4f89-41d3-9a0c-0305e82c3301',
  container: { kind: 'passthrough', reason },
  video: { kind: 'passthrough', reason },
  audio: { kind: 'passthrough', streamIndex: 1, reason },
  subtitles: { kind: 'none', reason },
};

const REMUXED: PlaybackPlan = { ...PLAN, container: { kind: 'remux', target: 'mp4', reason } };

const SOUND_CONVERTED: PlaybackPlan = {
  ...PLAN,
  audio: {
    kind: 'transcode',
    streamIndex: 1,
    codec: 'aac',
    channels: 2,
    maxBitrateKbps: 192,
    reason,
  },
};

const PICTURE_CONVERTED: PlaybackPlan = {
  ...PLAN,
  video: {
    kind: 'transcode',
    codec: 'h264',
    range: 'SDR',
    maxBitrateKbps: 8000,
    maxWidth: 1920,
    maxHeight: 1080,
    reason,
  },
};

const playing = (plan: PlaybackPlan): NonNullable<ActiveSession['playback']> => ({
  mediaId: plan.mediaId,
  mediaTitle: 'Arrival',
  hasPoster: false,
  hasBackdrop: false,
  mode: 'transcode',
  plan,
  reuse: 'none',
  isPlaying: true,
  pausedByAdmin: false,
  startedAt: 1500,
  health: null,
});

describe('describeSessionDelivery', () => {
  it('calls a file handed over untouched a direct play, quietly', () => {
    const delivery = describeSessionDelivery(playing(PLAN));

    expect(delivery.label).toBe('DirectPlay');
  });

  it('calls a rewrapped container a remux, rather than lumping it in with a re-encode', () => {
    const delivery = describeSessionDelivery(playing(REMUXED));

    expect(delivery.label).toBe('Remux');
  });

  it('calls converting only the sound a direct stream', () => {
    const delivery = describeSessionDelivery(playing(SOUND_CONVERTED));

    expect(delivery.label).toBe('DirectStream');
  });

  it('calls converting the picture transcoding, which is the one worth noticing', () => {
    const delivery = describeSessionDelivery(playing(PICTURE_CONVERTED));

    expect(delivery.label).toBe('Transcoding');
  });

  it('never gives a remux and a re-encode the same badge, which is the whole point', () => {
    const remux = describeSessionDelivery(playing(REMUXED));
    const transcode = describeSessionDelivery(playing(PICTURE_CONVERTED));

    expect(remux.label).not.toBe(transcode.label);
  });

  it('carries a sentence for a dialog, not just a word for a badge', () => {
    expect(describeSessionDelivery(playing(PLAN)).detail).toContain('untouched');
  });
});
