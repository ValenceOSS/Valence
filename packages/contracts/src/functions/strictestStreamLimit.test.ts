import { describe, expect, it } from 'vitest';
import { strictestStreamLimit } from './strictestStreamLimit';

describe('strictestStreamLimit', () => {
  it('takes the lowest ceiling set on each side', () => {
    expect(
      strictestStreamLimit([
        { maxBitrateKbps: 20_000, maxStreams: null, maxQuality: null, limitsDownloads: false },
        { maxBitrateKbps: 8000, maxStreams: 3, maxQuality: null, limitsDownloads: false },
        { maxBitrateKbps: null, maxStreams: 2, maxQuality: null, limitsDownloads: false },
      ]),
    ).toEqual({ maxBitrateKbps: 8000, maxStreams: 2, maxQuality: null, limitsDownloads: false });
  });

  it('leaves a side open where nobody set one', () => {
    expect(strictestStreamLimit([])).toEqual({
      maxBitrateKbps: null,
      maxStreams: null,
      maxQuality: null,
      limitsDownloads: false,
    });
  });

  it('takes the lowest quality any of them sets', () => {
    expect(
      strictestStreamLimit([
        { maxBitrateKbps: null, maxStreams: null, maxQuality: '1080p', limitsDownloads: false },
        { maxBitrateKbps: null, maxStreams: null, maxQuality: '480p', limitsDownloads: false },
        { maxBitrateKbps: null, maxStreams: null, maxQuality: '2160p', limitsDownloads: false },
      ]).maxQuality,
    ).toBe('480p');
  });

  it('leaves the quality open where none of them sets one, and not where one does', () => {
    expect(
      strictestStreamLimit([
        { maxBitrateKbps: 8000, maxStreams: null, maxQuality: null, limitsDownloads: false },
        { maxBitrateKbps: null, maxStreams: 2, maxQuality: null, limitsDownloads: false },
      ]).maxQuality,
    ).toBeNull();
    expect(
      strictestStreamLimit([
        { maxBitrateKbps: null, maxStreams: null, maxQuality: null, limitsDownloads: false },
        { maxBitrateKbps: null, maxStreams: null, maxQuality: '720p', limitsDownloads: false },
      ]).maxQuality,
    ).toBe('720p');
  });

  it('holds downloads to the quality where any of them says so', () => {
    expect(
      strictestStreamLimit([
        { maxBitrateKbps: null, maxStreams: null, maxQuality: '720p', limitsDownloads: false },
        { maxBitrateKbps: null, maxStreams: null, maxQuality: null, limitsDownloads: true },
      ]).limitsDownloads,
    ).toBe(true);
    expect(
      strictestStreamLimit([
        { maxBitrateKbps: null, maxStreams: null, maxQuality: '720p', limitsDownloads: false },
        { maxBitrateKbps: null, maxStreams: null, maxQuality: '480p', limitsDownloads: false },
      ]).limitsDownloads,
    ).toBe(false);
  });
});
