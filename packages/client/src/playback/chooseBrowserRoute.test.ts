import { describe, expect, it } from 'vitest';
import { chooseBrowserRoute } from '@ValenceClient/playback/chooseBrowserRoute';
import type { EngineSupport } from '@ValenceClient/playback/EngineSupport';

const SUPPORT: EngineSupport = {
  videoCodecs: ['h264', 'hevc'],
  tenBitVideoCodecs: ['hevc'],
  remuxVideoCodecs: ['h264', 'hevc'],
  remuxTenBitVideoCodecs: ['hevc'],
  toneMappedCodecs: ['hevc'],
  audioCodecs: ['aac'],
};

describe('chooseBrowserRoute', () => {
  it('repackages a picture the element decodes', () => {
    expect(
      chooseBrowserRoute(
        { videoCodec: 'h264', videoBitDepth: 8, videoRange: 'SDR' },
        SUPPORT,
        false,
      ),
    ).toBe('remux');
  });

  it('tone maps HDR HEVC itself on a screen that is not HDR', () => {
    expect(
      chooseBrowserRoute(
        { videoCodec: 'hevc', videoBitDepth: 10, videoRange: 'HDR10' },
        SUPPORT,
        false,
      ),
    ).toBe('webgpu');
  });

  it('leaves HDR to the element on an HDR screen', () => {
    expect(
      chooseBrowserRoute(
        { videoCodec: 'hevc', videoBitDepth: 10, videoRange: 'HDR10' },
        SUPPORT,
        true,
      ),
    ).toBe('remux');
  });

  it('decodes a picture itself where the element cannot take it', () => {
    expect(
      chooseBrowserRoute(
        { videoCodec: 'hevc', videoBitDepth: 10, videoRange: 'SDR' },
        { ...SUPPORT, remuxTenBitVideoCodecs: [] },
        false,
      ),
    ).toBe('webgpu');
  });
});
