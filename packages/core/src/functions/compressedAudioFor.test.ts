import { describe, expect, it } from 'vitest';
import type { AudioStream } from '@ValenceContracts/schemas/MediaItem';
import { compressedAudioFor } from './compressedAudioFor';

const track = (channels: number): AudioStream => ({
  index: 1,
  codec: 'truehd',
  channels,
  language: 'eng',
  isDefault: true,
  isAtmos: true,
});

describe('compressedAudioFor', () => {
  it('encodes to something every television in the house decodes', () => {
    expect(compressedAudioFor(track(6)).codec).toBe('eac3');
  });

  it('narrows 7.1 to 5.1, because the encoder carries no more than six', () => {
    expect(compressedAudioFor(track(8)).channels).toBe(6);
  });

  it('leaves a narrower track at its own width', () => {
    expect(compressedAudioFor(track(2)).channels).toBe(2);
  });

  it('gives a stereo track less than a surround one', () => {
    expect(compressedAudioFor(track(2)).maxBitrateKbps).toBeLessThan(
      compressedAudioFor(track(6)).maxBitrateKbps,
    );
  });

  it("holds to a rung's audio ceiling where the rung states one", () => {
    expect(compressedAudioFor(track(6), 128).maxBitrateKbps).toBe(128);
  });

  it('never raises a track to meet a ceiling above what it would have had', () => {
    expect(compressedAudioFor(track(2), 640).maxBitrateKbps).toBe(192);
  });
});
