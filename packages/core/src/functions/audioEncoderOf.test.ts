import { describe, expect, it } from 'vitest';
import { audioEncoderOf } from './audioEncoderOf';

describe('audioEncoderOf', () => {
  it('encodes Dolby Digital Plus with its own encoder', () => {
    expect(audioEncoderOf('eac3')).toBe('eac3');
  });

  it('encodes everything else as AAC', () => {
    expect(audioEncoderOf('aac')).toBe('aac');
    expect(audioEncoderOf('mp3')).toBe('aac');
    expect(audioEncoderOf('-f null')).toBe('aac');
    expect(audioEncoderOf('constructor')).toBe('aac');
    expect(audioEncoderOf('toString')).toBe('aac');
  });
});
