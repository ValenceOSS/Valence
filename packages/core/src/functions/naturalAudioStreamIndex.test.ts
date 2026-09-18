import { describe, expect, it } from 'vitest';
import type { AudioStream } from '@ValenceContracts/schemas/MediaItem';
import { naturalAudioStreamIndex } from './naturalAudioStreamIndex';

const stream = (index: number, isDefault: boolean): AudioStream => ({
  index,
  codec: 'eac3',
  channels: 6,
  language: 'eng',
  isDefault,
  isAtmos: false,
});

describe('naturalAudioStreamIndex', () => {
  it('takes the track the file marks as the default one', () => {
    expect(naturalAudioStreamIndex([stream(1, false), stream(2, true)])).toBe(2);
  });

  it('takes the first track where the file marks none', () => {
    expect(naturalAudioStreamIndex([stream(3, false), stream(4, false)])).toBe(3);
  });

  it('answers nothing for a file with no audio at all', () => {
    expect(naturalAudioStreamIndex([])).toBeNull();
  });
});
