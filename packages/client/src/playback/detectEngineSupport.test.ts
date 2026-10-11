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
  ...overrides,
});

describe('detectEngineSupport', () => {
  it('claims the pictures WebCodecs decodes and the sounds the element takes or the page decodes', async () => {
    expect(await detectEngineSupport(aBrowser())).toEqual({
      videoCodecs: ['h264', 'hevc', 'av1'],
      tenBitVideoCodecs: [],
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

    expect(support).toEqual({ videoCodecs: [], tenBitVideoCodecs: [], audioCodecs: [] });
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
