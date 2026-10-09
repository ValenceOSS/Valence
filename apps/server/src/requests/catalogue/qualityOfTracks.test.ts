import { describe, expect, it } from 'vitest';
import { qualityOfTracks } from './qualityOfTracks';

const track = (codec: string, isLossless: boolean, bitDepth: number | null = null) => ({
  codec,
  isLossless,
  bitDepth,
});

describe('qualityOfTracks', () => {
  it('calls an album lossless only where every track is, and 24-bit where every one is that deep', () => {
    expect(qualityOfTracks([track('flac', true, 16), track('flac', true, 24)])).toBe('flac');
    expect(qualityOfTracks([track('flac', true, 24)])).toBe('flac24');
    expect(qualityOfTracks([track('alac', true)])).toBe('alac');
    expect(qualityOfTracks([track('flac', true), track('mp3', false)])).toBe('mp3');
  });

  it('places a lossy album by its commonest codec, an MP3 at the bottom', () => {
    expect(qualityOfTracks([track('aac', false), track('aac', false), track('mp3', false)])).toBe(
      'aac',
    );
    expect(qualityOfTracks([track('opus', false)])).toBe('opus');
    expect(qualityOfTracks([track('vorbis', false)])).toBe('mp3');
    expect(qualityOfTracks([])).toBe('mp3');
  });
});
