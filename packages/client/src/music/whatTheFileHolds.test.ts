import { describe, expect, it } from 'vitest';
import { whatTheFileHolds } from './whatTheFileHolds';

describe('whatTheFileHolds', () => {
  it('says the format, the depth and rate, and the bitrate', () => {
    expect(
      whatTheFileHolds({ codec: 'flac', bitDepth: 24, sampleRate: 96_000, bitrateKbps: 2304 }),
    ).toBe('FLAC · 24-bit / 96 kHz · 2,304 kbps');
  });

  it('keeps a rate that is not a whole number of kilohertz', () => {
    expect(
      whatTheFileHolds({ codec: 'alac', bitDepth: 16, sampleRate: 44_100, bitrateKbps: null }),
    ).toBe('ALAC · 16-bit / 44.1 kHz');
  });

  it('leaves out what the file does not say', () => {
    expect(
      whatTheFileHolds({ codec: 'flac', bitDepth: null, sampleRate: null, bitrateKbps: null }),
    ).toBe('FLAC');
  });
});
