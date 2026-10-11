import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMediaFeed } from '@ValenceScreens/playback/engine/createMediaFeed';
import { BufferSource, Input } from 'mediabunny';
import type { InputAudioTrack } from 'mediabunny';

const init = vi.fn<(options: object) => Promise<object>>();

vi.mock('mediabunny', () => ({
  AudioSample: class {},
  AudioSampleSource: class {},
  BufferSource: class {},
  canEncodeAudio: (codec: string) => Promise.resolve(codec === 'flac'),
  Input: class {},
  Conversion: { init: (options: object) => init(options) },
  ConversionCanceledError: class extends Error {},
  Mp4OutputFormat: class {},
  Output: class {},
  StreamTarget: class {},
}));

vi.mock('@ValenceScreens/playback/engine/registerCodecExtensions', () => ({
  registerCodecExtensions: () => Promise.resolve(),
}));

vi.mock('@ValenceScreens/playback/engine/loadBrowserDecoders', () => ({
  loadBrowserDecoders: () => Promise.resolve(null),
}));

/**
 * A Media Source that opens as soon as it is listened to, recording the buffer it was asked for.
 *
 * @param plays - Which sound types the element takes.
 * @returns The class, and the types it was asked for.
 */
const aMediaSource = (plays: (mimeType: string) => boolean) => {
  const asked: string[] = [];
  const buffer = Object.assign(new EventTarget(), {
    updating: false,
    timestampOffset: -1,
    buffered: { length: 0, start: () => 0, end: () => 0 },
    abort: vi.fn(),
    remove(this: EventTarget) {
      queueMicrotask(() => this.dispatchEvent(new Event('updateend')));
    },
  });

  return {
    asked,
    buffer,
    MediaSource: class extends EventTarget {
      static isTypeSupported = plays;
      readyState = 'open';
      duration = 0;
      override addEventListener(name: string, listener: EventListener) {
        super.addEventListener(name, listener);
        queueMicrotask(() => this.dispatchEvent(new Event(name)));
      }
      addSourceBuffer(mimeType: string) {
        asked.push(mimeType);

        return buffer;
      }
    },
  };
};

/**
 * A sound track of one codec.
 *
 * @param codec - Its codec string.
 * @returns The track.
 */
const aTrack = (
  codec: string,
): Pick<InputAudioTrack, 'id' | 'codec' | 'getCodecParameterString' | 'getNumberOfChannels'> => ({
  id: 2,
  codec: null,
  getCodecParameterString: () => Promise.resolve(codec),
  getNumberOfChannels: () => Promise.resolve(2),
});

/**
 * An opened file, which the mocked conversion never reads.
 *
 * @returns The file.
 */
const anInput = (): Input =>
  new Input({ source: new BufferSource(new ArrayBuffer(0)), formats: [] });

afterEach(() => {
  vi.unstubAllGlobals();
  init.mockReset();
});

describe('createMediaFeed', () => {
  it('copies the picture alongside the sound where it is given one', async () => {
    const source = aMediaSource(() => true);

    vi.stubGlobal('MediaSource', source.MediaSource);
    vi.stubGlobal('URL', { ...URL, createObjectURL: () => 'blob:film', revokeObjectURL: vi.fn() });

    await createMediaFeed({
      element: document.createElement('video'),
      input: anInput(),
      duration: 60,
      track: aTrack('mp4a.40.2'),
      picture: { id: 1, getCodecParameterString: () => Promise.resolve('hvc1.2.4.L153.B0') },
      onFault: vi.fn(),
    });

    expect(source.asked).toEqual(['video/mp4; codecs="hvc1.2.4.L153.B0, mp4a.40.2"']);
  });

  it('hands the element the track as it is where the element plays it, placed at the start', async () => {
    const source = aMediaSource((mimeType) => mimeType.includes('mp4a'));

    vi.stubGlobal('MediaSource', source.MediaSource);
    vi.stubGlobal('URL', { ...URL, createObjectURL: () => 'blob:sound', revokeObjectURL: vi.fn() });
    init.mockResolvedValue({ isValid: true, execute: () => Promise.resolve(), cancel: vi.fn() });

    const element = document.createElement('video');
    const feed = await createMediaFeed({
      element,
      input: anInput(),
      duration: 60,
      track: aTrack('mp4a.40.2'),
      onFault: vi.fn(),
    });

    await feed.startAt(12);

    expect(source.asked).toEqual(['audio/mp4; codecs="mp4a.40.2"']);
    expect(source.buffer.timestampOffset).toBe(12);
    expect(init).toHaveBeenCalledWith(expect.objectContaining({ trim: { start: 12 } }));
  });

  it('encodes the sound again as Opus where the element does not play it', async () => {
    const source = aMediaSource((mimeType) => mimeType.includes('opus'));

    vi.stubGlobal('MediaSource', source.MediaSource);
    vi.stubGlobal('URL', { ...URL, createObjectURL: () => 'blob:sound', revokeObjectURL: vi.fn() });

    await createMediaFeed({
      element: document.createElement('video'),
      input: anInput(),
      duration: 60,
      track: aTrack('dtsc'),
      onFault: vi.fn(),
    });

    expect(source.asked).toEqual(['audio/mp4; codecs="opus"']);
  });

  it('keeps the sound lossless as FLAC where the element takes FLAC', async () => {
    const source = aMediaSource((mimeType) => mimeType.includes('flac'));

    vi.stubGlobal('MediaSource', source.MediaSource);
    vi.stubGlobal('URL', { ...URL, createObjectURL: () => 'blob:sound', revokeObjectURL: vi.fn() });

    await createMediaFeed({
      element: document.createElement('video'),
      input: anInput(),
      duration: 60,
      track: aTrack('dtsc'),
      onFault: vi.fn(),
    });

    expect(source.asked).toEqual(['audio/mp4; codecs="flac"']);
  });
});
