import { describe, expect, it } from 'vitest';
import { describeAudioCodec } from './describeAudioCodec';

describe('describeAudioCodec', () => {
  it('names Dolby’s formats by their brand names', () => {
    expect(describeAudioCodec('atmos')).toBe('Dolby Atmos');
    expect(describeAudioCodec('truehd')).toBe('Dolby TrueHD');
    expect(describeAudioCodec('eac3')).toBe('Dolby Digital+');
    expect(describeAudioCodec('ac3')).toBe('Dolby Digital');
  });

  it('names the rest by their own names', () => {
    expect(describeAudioCodec('dts')).toBe('DTS');
    expect(describeAudioCodec('aac')).toBe('AAC');
    expect(describeAudioCodec('opus')).toBe('Opus');
  });
});
