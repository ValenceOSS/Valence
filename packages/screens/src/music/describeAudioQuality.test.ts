import { describe, expect, it } from 'vitest';
import { describeAudioQuality } from './describeAudioQuality';

const FLAC = { codec: 'flac', isLossless: true, bitrateKbps: 1400 };

const MP3 = { codec: 'mp3', isLossless: false, bitrateKbps: 320 };

describe('describeAudioQuality', () => {
  it('says what an hour of an encoded quality uses', () => {
    expect(describeAudioQuality('low', FLAC)).toEqual({
      label: 'Data saver',
      detail: '96 kbps · about 41 MB an hour',
    });
  });

  it('calls the file itself lossless only where it is', () => {
    expect(describeAudioQuality('lossless', FLAC)).toEqual({
      label: 'Lossless',
      detail: 'FLAC · 1400 kbps · about 601 MB an hour',
    });
    expect(describeAudioQuality('lossless', MP3).label).toBe('Original');
    expect(describeAudioQuality('lossless', MP3).detail).toBe(
      'MP3 · 320 kbps · about 137 MB an hour',
    );
  });

  it('says an encode no smaller than the file plays the file instead', () => {
    expect(describeAudioQuality('high', MP3).detail).toBe(
      'Plays the original, which is no bigger · about 137 MB an hour',
    );
    expect(describeAudioQuality('normal', MP3).detail).toBe('160 kbps · about 69 MB an hour');
  });

  it('describes the file plainly where nothing is playing', () => {
    expect(describeAudioQuality('lossless', null)).toEqual({
      label: 'Lossless',
      detail: 'The file as it is on the server',
    });
  });
});
