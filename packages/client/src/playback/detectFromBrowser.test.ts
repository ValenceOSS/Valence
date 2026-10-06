import { describe, expect, it, vi } from 'vitest';
import type { BrowsersMedia } from '@ValenceClient/playback/BrowsersMedia';
import { detectFromBrowser } from '@ValenceClient/playback/detectFromBrowser';

const NO_FILES = { canPlayType: () => '' };

/**
 * A browser's window, answering as told.
 *
 * @param overrides - What it answers differently.
 * @returns The window.
 */
const aPage = (overrides: Partial<BrowsersMedia> = {}): BrowsersMedia => ({
  MediaSource: { isTypeSupported: (mimeType) => /avc1|mp4a/.test(mimeType) },
  navigator: { platform: 'MacIntel' },
  screen: { width: 1920, height: 1080 },
  devicePixelRatio: 2,
  matchMedia: () => ({ matches: false }),
  ...overrides,
});

/**
 * An output device taking so many channels.
 *
 * @param maxChannelCount - How many it takes.
 * @returns Its audio context, and what closing one does.
 */
const anOutputAccepting = (maxChannelCount: number) => {
  const close = vi.fn(() => Promise.resolve());

  return {
    close,
    AudioContext: class {
      destination = { maxChannelCount };
      close = close;
    },
  };
};

describe('detectFromBrowser', () => {
  it('claims what the browser says it plays through Media Source', () => {
    const profile = detectFromBrowser(aPage(), NO_FILES);

    expect(profile.directPlayProfiles[0]?.videoCodecs).toEqual(['h264']);
    expect(profile.directPlayProfiles[0]?.audioCodecs).toEqual(['aac']);
  });

  it('claims nothing beyond the fallbacks where the browser has no Media Source', () => {
    const profile = detectFromBrowser(aPage({ MediaSource: undefined }), NO_FILES);

    expect(profile.directPlayProfiles[0]?.videoCodecs).toEqual(['h264']);
    expect(profile.maxVideoLevels).toEqual({});
  });

  it('asks the video element what it plays from a file', () => {
    const profile = detectFromBrowser(aPage(), {
      canPlayType: (mimeType) => (/matroska.*(av01|opus)/.test(mimeType) ? 'maybe' : ''),
    });

    expect(profile.directPlayProfiles.map((one) => one.container)).toEqual(['mp4', 'mkv']);
  });

  it('measures the screen in its own pixels', () => {
    const profile = detectFromBrowser(aPage(), NO_FILES);

    expect(profile.maxWidth).toBe(3840);
    expect(profile.maxHeight).toBe(2160);
  });

  it('claims high dynamic range where the screen says it shows it', () => {
    const profile = detectFromBrowser(aPage({ matchMedia: () => ({ matches: true }) }), NO_FILES);

    expect(profile.supportedVideoRanges).toContain('HDR10');
  });

  it('reports no HDR rather than failing in a browser without media queries', () => {
    const profile = detectFromBrowser(aPage({ matchMedia: undefined }), NO_FILES);

    expect(profile.supportedVideoRanges).toEqual(['SDR']);
  });

  it('carries the name it is given, and calls itself a browser otherwise', () => {
    expect(detectFromBrowser(aPage(), NO_FILES, 'LG TV').name).toBe('LG TV');
    expect(detectFromBrowser(aPage(), NO_FILES).name).toBe('Browser');
  });
});

describe('asking the browser how many channels the output takes', () => {
  it('reports what the device says it takes', () => {
    const { AudioContext } = anOutputAccepting(8);

    expect(detectFromBrowser(aPage({ AudioContext }), NO_FILES).maxAudioChannels).toBe(8);
  });

  it('lets go of the context it opened to ask', () => {
    const { AudioContext, close } = anOutputAccepting(6);

    detectFromBrowser(aPage({ AudioContext }), NO_FILES);

    expect(close).toHaveBeenCalledOnce();
  });

  it('falls back to stereo on a browser with no audio context at all', () => {
    expect(detectFromBrowser(aPage(), NO_FILES).maxAudioChannels).toBe(2);
  });

  it('falls back to stereo rather than throwing where opening one fails', () => {
    const page = aPage({
      AudioContext: class {
        destination = { maxChannelCount: 8 };

        constructor() {
          throw new Error('no audio device');
        }

        close = () => Promise.resolve();
      },
    });

    expect(detectFromBrowser(page, NO_FILES).maxAudioChannels).toBe(2);
  });

  it('falls back to stereo where the device answers with nothing usable', () => {
    const { AudioContext } = anOutputAccepting(Number.NaN);

    expect(detectFromBrowser(aPage({ AudioContext }), NO_FILES).maxAudioChannels).toBe(2);
  });
});
