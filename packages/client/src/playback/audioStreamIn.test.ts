import { describe, expect, it } from 'vitest';
import { audioStreamIn } from './audioStreamIn';
import type { AudioStream } from '@ValenceContracts/schemas/MediaItem';

const STREAMS: AudioStream[] = [
  { index: 1, codec: 'eac3', channels: 6, isDefault: true, isAtmos: false, language: 'eng' },
  { index: 2, codec: 'aac', channels: 2, isDefault: false, isAtmos: false, language: 'fre' },
];

describe('audioStreamIn', () => {
  it('asks for the soundtrack in the language chosen', () => {
    expect(audioStreamIn(STREAMS, 'fre')).toBe(2);
  });

  it('asks for nothing where the default is already in that language', () => {
    expect(audioStreamIn(STREAMS, 'eng')).toBeUndefined();
  });

  it('asks for nothing where no soundtrack is in that language', () => {
    expect(audioStreamIn(STREAMS, 'ger')).toBeUndefined();
  });
});
