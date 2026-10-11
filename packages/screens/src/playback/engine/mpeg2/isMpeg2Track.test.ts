import { describe, expect, it } from 'vitest';
import { isMpeg2Track } from '@ValenceScreens/playback/engine/mpeg2/isMpeg2Track';

describe('isMpeg2Track', () => {
  it('recognises MPEG-2 by what Matroska calls it', async () => {
    expect(
      await isMpeg2Track({ codec: null, getInternalCodecId: () => Promise.resolve('V_MPEG2') }),
    ).toBe(true);
  });

  it('recognises MPEG-2 by its transport stream type', async () => {
    expect(await isMpeg2Track({ codec: null, getInternalCodecId: () => Promise.resolve(2) })).toBe(
      true,
    );
  });

  it('leaves a picture Mediabunny knows alone', async () => {
    expect(
      await isMpeg2Track({ codec: 'avc', getInternalCodecId: () => Promise.resolve('V_MPEG2') }),
    ).toBe(false);
  });
});
