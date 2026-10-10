import { describe, expect, it } from 'vitest';
import { PreTranscodingSettingsSchema } from '@ValenceContracts/schemas/PreTranscoding';
import { withPreTranscodeTargets } from './withPreTranscodeTargets';

describe('withPreTranscodeTargets', () => {
  it('carries a single saved copy over as the only rung of a ladder', () => {
    const carried = PreTranscodingSettingsSchema.parse(
      withPreTranscodeTargets({
        isEnabled: true,
        quality: '720p',
        videoCodec: 'hevc',
        container: 'mkv',
        maxBitrateKbps: 2500,
        audio: 'compress',
        schedule: 'untilDone',
      }),
    );

    expect(carried.targets).toEqual([
      {
        quality: '720p',
        videoCodec: 'hevc',
        container: 'mkv',
        maxBitrateKbps: 2500,
        audio: 'compress',
      },
    ]);
    expect(carried).toMatchObject({ isEnabled: true, schedule: 'untilDone' });
  });

  it('leaves settings that already hold a ladder as they are', () => {
    const ladder = { targets: [{ quality: '480p' }] };

    expect(withPreTranscodeTargets(ladder)).toBe(ladder);
  });

  it('leaves anything unrecognisable for the schema to judge', () => {
    expect(withPreTranscodeTargets(null)).toBeNull();
    expect(withPreTranscodeTargets({ isEnabled: true })).toEqual({ isEnabled: true });
  });
});
