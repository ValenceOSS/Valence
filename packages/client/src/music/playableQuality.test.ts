import { describe, expect, it } from 'vitest';
import { playableQuality, typeOfCodec } from './playableQuality';

const playsEverything = () => true;

const playsNothing = () => false;

describe('playableQuality', () => {
  it('asks for the file as it is where this device plays it', () => {
    expect(playableQuality({ codec: 'flac' }, 'lossless', playsEverything)).toBe('lossless');
  });

  it('asks for the highest encode where this device cannot play the file', () => {
    expect(playableQuality({ codec: 'alac' }, 'lossless', playsNothing)).toBe('high');
  });

  it('asks for the highest encode for a codec no browser plays', () => {
    expect(playableQuality({ codec: 'wma' }, 'lossless', playsEverything)).toBe('high');
  });

  it('asks for a lower quality as chosen, whatever the file is', () => {
    expect(playableQuality({ codec: 'flac' }, 'low', playsNothing)).toBe('low');
  });
});

describe('typeOfCodec', () => {
  it('names the type a browser is asked about', () => {
    expect(typeOfCodec('FLAC')).toBe('audio/flac');
    expect(typeOfCodec('MPEG 1 Layer 3')).toBe('audio/mpeg');
    expect(typeOfCodec('PCM_S16LE')).toBe('audio/wav');
  });

  it('names nothing for a codec it does not know', () => {
    expect(typeOfCodec('ape')).toBeNull();
  });
});
