import { describe, expect, it } from 'vitest';
import { readSpokenAudio } from './readSpokenAudio';

describe('readSpokenAudio', () => {
  it('reads dual audio however it is written', () => {
    expect(readSpokenAudio('[X] Show - 01 (BD 1080p Dual Audio)')).toBe('dual');
    expect(readSpokenAudio('Show S01 1080p BluRay Dual-Audio x265')).toBe('dual');
    expect(readSpokenAudio('Show S01 1080p Multi Audio Multi Subs')).toBe('dual');
    expect(readSpokenAudio('[X] Show - 01 [JPN+ENG]')).toBe('dual');
  });

  it('reads an English dub', () => {
    expect(readSpokenAudio('[X] Show (Episode 1089-1092) (Dub)')).toBe('dubbed');
    expect(readSpokenAudio('Show S01E01 English Dubbed 1080p')).toBe('dubbed');
    expect(readSpokenAudio('Show S01E01 ENG DUB 1080p')).toBe('dubbed');
  });

  it('reads subtitles, and nothing where the name says nothing', () => {
    expect(readSpokenAudio('[X] Show - 01 (1080p) [Eng Sub]')).toBe('subbed');
    expect(readSpokenAudio('Show S01E01 VOSTFR 1080p')).toBe('subbed');
    expect(readSpokenAudio('[FansubGroup] Show - 01 (1080p)')).toBeNull();
    expect(readSpokenAudio('Submarine 2010 1080p BluRay')).toBeNull();
  });
});
