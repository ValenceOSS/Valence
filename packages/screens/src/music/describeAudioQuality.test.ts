import { describe, expect, it } from 'vitest';
import { describeAudioQuality } from './describeAudioQuality';

describe('describeAudioQuality', () => {
  it('says what an hour of an encoded quality uses', () => {
    expect(describeAudioQuality('high', null)).toBe('320 kbps · about 137 MB an hour');
    expect(describeAudioQuality('low', null)).toBe('96 kbps · about 41 MB an hour');
  });

  it('works out an hour of lossless from the file playing', () => {
    expect(describeAudioQuality('lossless', 1400)).toBe(
      'The file as it is on the server · about 601 MB an hour',
    );
  });

  it('leaves lossless unmeasured where nothing is playing', () => {
    expect(describeAudioQuality('lossless', null)).toBe('The file as it is on the server');
  });
});
