import { describe, expect, it } from 'vitest';
import { audioStreamMatching } from './audioStreamMatching';
import type { AudioStream } from '@ValenceContracts/schemas/MediaItem';

const track = (change: Partial<AudioStream> & { index: number }): AudioStream => ({
  codec: 'aac',
  channels: 2,
  language: 'jpn',
  isDefault: false,
  isAtmos: false,
  ...change,
});

describe('audioStreamMatching', () => {
  it('finds the track in the same language wherever the copy puts it', () => {
    const wanted = track({ index: 1, language: 'jpn', isDefault: true });

    expect(
      audioStreamMatching(wanted, [track({ index: 1, language: 'eng' }), track({ index: 2 })])
        ?.index,
    ).toBe(2);
  });

  it('prefers the one that is likewise the default, then as many channels, then the codec', () => {
    const wanted = track({ index: 1, isDefault: true, channels: 6, codec: 'eac3' });

    expect(
      audioStreamMatching(wanted, [
        track({ index: 1, channels: 6, codec: 'eac3' }),
        track({ index: 2, isDefault: true }),
      ])?.index,
    ).toBe(2);
    expect(
      audioStreamMatching(wanted, [
        track({ index: 1, isDefault: true, codec: 'eac3' }),
        track({ index: 2, isDefault: true, channels: 6 }),
      ])?.index,
    ).toBe(2);
    expect(
      audioStreamMatching(wanted, [
        track({ index: 1, isDefault: true, channels: 6 }),
        track({ index: 2, isDefault: true, channels: 6, codec: 'eac3' }),
      ])?.index,
    ).toBe(2);
  });

  it('takes the first in the language where none is more alike', () => {
    expect(
      audioStreamMatching(track({ index: 9, language: 'ja' }), [
        track({ index: 3 }),
        track({ index: 4 }),
      ])?.index,
    ).toBe(3);
  });

  it('finds nothing in a copy without the language', () => {
    expect(
      audioStreamMatching(track({ index: 1 }), [track({ index: 1, language: 'eng' })]),
    ).toBeUndefined();
  });
});
