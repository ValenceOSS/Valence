import { describe, expect, it } from 'vitest';
import type { PlaybackPlan } from '@ValenceContracts/schemas/PlaybackPlan';
import { reasonsOfPlan } from './reasonsOfPlan';

const fine = {
  code: 'ClientSupportsSource',
  detail: { code: 'x', message: '', values: {} },
} as const;

const aPlan = (audio: PlaybackPlan['audio']): PlaybackPlan => ({
  mediaId: '00000000-0000-4000-8000-000000000000',
  container: { kind: 'passthrough', reason: fine },
  video: { kind: 'passthrough', reason: fine },
  audio,
  subtitles: { kind: 'none', reason: fine },
});

describe('reasonsOfPlan', () => {
  it('names only what had to change', () => {
    expect(
      reasonsOfPlan(
        aPlan({
          kind: 'transcode',
          streamIndex: 1,
          codec: 'aac',
          channels: 2,
          maxBitrateKbps: 256,
          reason: { ...fine, code: 'AudioCodecNotSupported' },
        }),
      ),
    ).toEqual(['AudioCodecNotSupported']);
  });

  it('names nothing for a file sent as it lies', () => {
    expect(reasonsOfPlan(aPlan({ kind: 'passthrough', streamIndex: 1, reason: fine }))).toEqual([]);
  });
});
