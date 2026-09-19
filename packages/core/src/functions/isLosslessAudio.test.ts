import { describe, expect, it } from 'vitest';
import type { AudioStream } from '@ValenceContracts/schemas/MediaItem';
import { isLosslessAudio } from './isLosslessAudio';

const track = (codec: string): AudioStream => ({
  index: 1,
  codec,
  channels: 6,
  language: 'eng',
  isDefault: true,
  isAtmos: false,
});

describe('isLosslessAudio', () => {
  it('knows the codecs a remux carries its big tracks in', () => {
    expect(isLosslessAudio(track('truehd'))).toBe(true);
    expect(isLosslessAudio(track('dtshd'))).toBe(true);
    expect(isLosslessAudio(track('flac'))).toBe(true);
    expect(isLosslessAudio(track('pcm'))).toBe(true);
  });

  it('does not count a lossy track, which compressing again would only make worse', () => {
    expect(isLosslessAudio(track('eac3'))).toBe(false);
    expect(isLosslessAudio(track('dts'))).toBe(false);
    expect(isLosslessAudio(track('aac'))).toBe(false);
  });
});
