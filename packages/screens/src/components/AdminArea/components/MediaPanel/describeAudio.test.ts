import { describe, expect, it } from 'vitest';
import { describeAudio } from './describeAudio';
import { aMediaSummary } from '@ValenceClient/testing/aMediaSummary';

describe('describeAudio', () => {
  it('names the format and channels the way they are sold', () => {
    expect(
      describeAudio(aMediaSummary({ audio: { codec: 'EAC3', channels: 6, isAtmos: false } })),
    ).toBe('Dolby Digital+ 5.1');
    expect(
      describeAudio(aMediaSummary({ audio: { codec: 'aac', channels: 2, isAtmos: false } })),
    ).toBe('AAC Stereo');
  });

  it('says Atmos where the track carries it', () => {
    expect(
      describeAudio(aMediaSummary({ audio: { codec: 'truehd', channels: 8, isAtmos: true } })),
    ).toBe('Dolby TrueHD 7.1 · Atmos');
  });

  it('is a dash for a file with no sound', () => {
    expect(describeAudio(aMediaSummary({ audio: null }))).toBe('—');
  });
});
