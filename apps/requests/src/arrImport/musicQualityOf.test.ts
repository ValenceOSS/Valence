import { describe, expect, it } from 'vitest';
import { musicQualityOf } from './musicQualityOf';

describe('musicQualityOf', () => {
  it('reads Lidarr’s quality names as Valence’s', () => {
    expect(musicQualityOf('FLAC 24bit')).toBe('flac24');
    expect(musicQualityOf('FLAC')).toBe('flac');
    expect(musicQualityOf('ALAC 24bit')).toBe('alac');
    expect(musicQualityOf('MP3-VBR-V0')).toBe('mp3-v0');
    expect(musicQualityOf('MP3-320')).toBe('mp3-320');
    expect(musicQualityOf('MP3-192')).toBe('mp3');
    expect(musicQualityOf('AAC-256')).toBe('aac');
    expect(musicQualityOf('OPUS')).toBe('opus');
  });

  it('has none for a quality Valence cannot match', () => {
    expect(musicQualityOf('WAV')).toBeNull();
    expect(musicQualityOf('OGG Vorbis Q9')).toBeNull();
  });
});
