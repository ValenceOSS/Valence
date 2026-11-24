import { describe, expect, it } from 'vitest';
import { readTypedStreamLimit } from './readTypedStreamLimit';

describe('readTypedStreamLimit', () => {
  it('reads the bitrate from megabits and the streams as they are', () => {
    expect(
      readTypedStreamLimit({ bitrate: '8', streams: '2', quality: null, limitsDownloads: false }),
    ).toEqual({ maxBitrateKbps: 8000, maxStreams: 2, maxQuality: null, limitsDownloads: false });
  });

  it('reads a fraction of a megabit to the nearest kilobit', () => {
    expect(
      readTypedStreamLimit({ bitrate: '1.5', streams: '', quality: null, limitsDownloads: false })
        .maxBitrateKbps,
    ).toBe(1500);
  });

  it('reads an empty field, or one of spaces, as no limit', () => {
    const read = readTypedStreamLimit({
      bitrate: '',
      streams: '   ',
      quality: null,
      limitsDownloads: false,
    });

    expect(read.maxBitrateKbps).toBeNull();
    expect(read.maxStreams).toBeNull();
  });

  it('reads nothing at all from what is not a limit', () => {
    const read = readTypedStreamLimit({
      bitrate: 'fast',
      streams: '0',
      quality: null,
      limitsDownloads: false,
    });

    expect(read.maxBitrateKbps).toBeUndefined();
    expect(read.maxStreams).toBeUndefined();
    expect(
      readTypedStreamLimit({ bitrate: '-4', streams: '', quality: null, limitsDownloads: false })
        .maxBitrateKbps,
    ).toBeUndefined();
  });

  it('keeps the quality chosen, holding downloads to it where asked', () => {
    expect(
      readTypedStreamLimit({ bitrate: '', streams: '', quality: '720p', limitsDownloads: true }),
    ).toEqual({
      maxBitrateKbps: null,
      maxStreams: null,
      maxQuality: '720p',
      limitsDownloads: true,
    });
  });

  it('holds downloads to nothing where there is no quality to hold them to', () => {
    expect(
      readTypedStreamLimit({ bitrate: '', streams: '', quality: null, limitsDownloads: true })
        .limitsDownloads,
    ).toBe(false);
  });
});
