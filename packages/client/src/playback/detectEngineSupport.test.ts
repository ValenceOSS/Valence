import { describe, expect, it } from 'vitest';
import { detectEngineSupport } from '@ValenceClient/playback/detectEngineSupport';
import type { EnginesBrowser } from '@ValenceClient/playback/EnginesBrowser';

/**
 * A browser with WebGPU and WebCodecs, answering as told.
 *
 * @param overrides - What it answers differently.
 * @returns The browser.
 */
const aBrowser = (overrides: Partial<EnginesBrowser> = {}): EnginesBrowser => ({
  isSecureContext: true,
  hasGpu: () => Promise.resolve(true),
  canDecodeVideo: ({ codec }) => Promise.resolve(/^(avc1|hvc1\.1|av01\.0\.13M\.08)/.test(codec)),
  canDecodeAudio: ({ codec }) => Promise.resolve(codec === 'vorbis'),
  canEncodeAudio: () => Promise.resolve(true),
  canStream: (mimeType) => /mp4a|opus/.test(mimeType),
  canToneMap: () => Promise.resolve(true),
  ...overrides,
});

describe('detectEngineSupport', () => {
  it('claims the pictures the element decodes once repackaged, and HEVC it can tone map', async () => {
    const support = await detectEngineSupport(
      aBrowser({
        canDecodeVideo: ({ codec }) => Promise.resolve(codec.startsWith('hvc1')),
        canStream: (mimeType) => /mp4a|opus|hvc1\.2|avc1/.test(mimeType),
      }),
    );

    expect(support.remuxVideoCodecs).toEqual(['h264']);
    expect(support.remuxTenBitVideoCodecs).toEqual(['hevc']);
    expect(support.toneMapsHevc).toBe(true);
  });

  it('leaves HDR alone where the browser does not hand the signal over untouched', async () => {
    const support = await detectEngineSupport(
      aBrowser({
        canDecodeVideo: ({ codec }) => Promise.resolve(codec.startsWith('hvc1')),
        canToneMap: () => Promise.resolve(false),
      }),
    );

    expect(support.videoCodecs).toContain('hevc');
    expect(support.toneMapsHevc).toBe(false);
  });

  it('claims the pictures WebCodecs decodes and the sounds the element takes or the page decodes', async () => {
    expect(await detectEngineSupport(aBrowser())).toEqual({
      videoCodecs: ['h264', 'hevc', 'av1'],
      tenBitVideoCodecs: [],
      remuxVideoCodecs: [],
      remuxTenBitVideoCodecs: [],
      toneMapsHevc: false,
      audioCodecs: ['aac', 'opus', 'vorbis', 'ac3', 'eac3', 'pcm'],
    });
  });

  it('claims only the sounds the element takes as they are where nothing can encode Opus', async () => {
    const support = await detectEngineSupport(aBrowser({ canEncodeAudio: null }));

    expect(support.audioCodecs).toEqual(['aac', 'opus']);
  });

  it('claims nothing on a page that is not secure, since WebGPU is not there', async () => {
    const support = await detectEngineSupport(aBrowser({ isSecureContext: false }));

    expect(support.videoCodecs).toEqual([]);
  });

  it('claims nothing without a GPU to draw with', async () => {
    const support = await detectEngineSupport(aBrowser({ hasGpu: () => Promise.resolve(false) }));

    expect(support.videoCodecs).toEqual([]);
    expect(support.remuxVideoCodecs).toEqual([]);
  });

  it('counts a decoder that throws as one that cannot decode', async () => {
    const support = await detectEngineSupport(
      aBrowser({
        canDecodeVideo: ({ codec }) =>
          codec === 'vp8'
            ? Promise.reject(new Error('no'))
            : Promise.resolve(codec === 'avc1.640033'),
      }),
    );

    expect(support.videoCodecs).toEqual(['h264']);
  });

  it('claims nothing where no sound could reach the element', async () => {
    const support = await detectEngineSupport(aBrowser({ canStream: () => false }));

    expect(support.audioCodecs).toEqual([]);
  });
});
