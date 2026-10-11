import { describe, expect, it } from 'vitest';
import { soundDecodedHere } from '@ValenceScreens/playback/engine/soundDecodedHere';

describe('soundDecodedHere', () => {
  it('sends TrueHD in Matroska or MP4 to Valence’s own decoder', async () => {
    expect(await soundDecodedHere({ getInternalCodecId: () => Promise.resolve('A_TRUEHD') })).toBe(
      'truehd',
    );
    expect(await soundDecodedHere({ getInternalCodecId: () => Promise.resolve('mlpa') })).toBe(
      'truehd',
    );
  });

  it('leaves a sound Mediabunny decodes to Mediabunny', async () => {
    expect(
      await soundDecodedHere({ getInternalCodecId: () => Promise.resolve('A_AC3') }),
    ).toBeNull();
  });
});
