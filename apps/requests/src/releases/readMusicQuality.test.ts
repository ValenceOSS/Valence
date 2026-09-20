import { describe, expect, it } from 'vitest';
import { readMusicQuality } from './readMusicQuality';

describe('readMusicQuality', () => {
  it.each([
    ['Album (1973) [FLAC 24-96]', 'flac24'],
    ['Album [24Bit-192kHz] FLAC', 'flac24'],
    ['Album Hi-Res FLAC', 'flac24'],
    ['Album [FLAC] 16BITS 44 1KHZ', 'flac'],
    ['Album [24-48] ALAC', 'alac'],
    ['Album [MP3 320]', 'mp3-320'],
    ['Album Mp3 320kbps', 'mp3-320'],
    ['Album MP3 V0', 'mp3-v0'],
    ['Album [AAC 256]', 'aac'],
    ['Album M4A', 'aac'],
    ['Album Opus', 'opus'],
    ['Album MP3 V2', 'mp3-v2'],
    ['Album MP3', 'mp3'],
    ['Album (BD FLAC2 0)', 'flac'],
    ['Album AAC2 0', 'aac'],
  ] as const)('reads %s as %s', (name, quality) => {
    expect(readMusicQuality(name)).toBe(quality);
  });

  it('says nothing where a name gives no audio format', () => {
    expect(readMusicQuality('Artist - Album (2020)')).toBeNull();
  });
});
