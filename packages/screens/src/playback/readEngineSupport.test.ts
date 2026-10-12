import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('readEngineSupport', () => {
  it('asks the browser’s own decoders once, and remembers the answer for the page', async () => {
    const isConfigSupported = vi.fn(() => Promise.resolve({ supported: true }));

    vi.stubGlobal('isSecureContext', true);
    vi.stubGlobal('navigator', {
      ...navigator,
      gpu: { requestAdapter: () => Promise.resolve({}) },
    });
    vi.stubGlobal('VideoDecoder', { isConfigSupported });
    vi.stubGlobal('AudioDecoder', { isConfigSupported });
    vi.stubGlobal('AudioEncoder', { isConfigSupported });
    vi.stubGlobal('MediaSource', { isTypeSupported: () => true });

    const { readEngineSupport } = await import('@ValenceScreens/playback/readEngineSupport');
    const first = await readEngineSupport();
    const asked = isConfigSupported.mock.calls.length;
    const second = await readEngineSupport();

    expect(first.videoCodecs).toContain('hevc');
    expect(first.audioCodecs).toContain('ac3');
    expect(second).toBe(first);
    expect(isConfigSupported).toHaveBeenCalledTimes(asked);
  });

  it('leaves Dolby and DTS to the server where the page’s policy forbids compiling WebAssembly', async () => {
    const isConfigSupported = vi.fn(() => Promise.resolve({ supported: true }));

    vi.stubGlobal('isSecureContext', true);
    vi.stubGlobal('navigator', {
      ...navigator,
      gpu: { requestAdapter: () => Promise.resolve({}) },
    });
    vi.stubGlobal('VideoDecoder', { isConfigSupported });
    vi.stubGlobal('AudioDecoder', { isConfigSupported });
    vi.stubGlobal('AudioEncoder', { isConfigSupported });
    vi.stubGlobal('MediaSource', { isTypeSupported: () => true });
    vi.stubGlobal('WebAssembly', {
      ...WebAssembly,
      Module: class {
        constructor() {
          throw new Error('Refused by the content security policy');
        }
      },
    });

    const { readEngineSupport } = await import('@ValenceScreens/playback/readEngineSupport');

    expect((await readEngineSupport()).audioCodecs).not.toContain('dts');
  });

  it('claims nothing in a browser without WebCodecs', async () => {
    vi.stubGlobal('isSecureContext', true);
    vi.stubGlobal('VideoDecoder', undefined);

    const { readEngineSupport } = await import('@ValenceScreens/playback/readEngineSupport');

    expect((await readEngineSupport()).videoCodecs).toEqual([]);
  });
});
