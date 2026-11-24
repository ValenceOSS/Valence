import { describe, expect, it } from 'vitest';
import { typedStreamLimitOf } from './typedStreamLimitOf';

describe('typedStreamLimitOf', () => {
  it('leaves every field empty before the limit has been read', () => {
    expect(typedStreamLimitOf(undefined)).toEqual({
      bitrate: '',
      streams: '',
      quality: null,
      limitsDownloads: false,
    });
  });

  it('leaves a field empty where there is no limit', () => {
    expect(
      typedStreamLimitOf({
        maxBitrateKbps: null,
        maxStreams: null,
        maxQuality: null,
        limitsDownloads: false,
      }),
    ).toEqual({ bitrate: '', streams: '', quality: null, limitsDownloads: false });
  });

  it('gives the bitrate in megabits, the streams as a count, and the quality as it is', () => {
    expect(
      typedStreamLimitOf({
        maxBitrateKbps: 8000,
        maxStreams: 2,
        maxQuality: '1080p',
        limitsDownloads: true,
      }),
    ).toEqual({ bitrate: '8', streams: '2', quality: '1080p', limitsDownloads: true });
  });

  it('keeps a bitrate that is not a whole number of megabits', () => {
    expect(
      typedStreamLimitOf({
        maxBitrateKbps: 1500,
        maxStreams: null,
        maxQuality: null,
        limitsDownloads: false,
      }).bitrate,
    ).toBe('1.5');
  });
});
