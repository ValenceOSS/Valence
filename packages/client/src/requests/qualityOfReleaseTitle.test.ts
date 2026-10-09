import { describe, expect, it } from 'vitest';
import { qualityOfReleaseTitle } from './qualityOfReleaseTitle';

describe('qualityOfReleaseTitle', () => {
  it('reads a film’s or an episode’s resolution and source', () => {
    expect(qualityOfReleaseTitle('A.Film.2021.2160p.UHD.BluRay.REMUX.x265', 'video')).toBe(
      '2160p Remux',
    );
    expect(qualityOfReleaseTitle('A.Show.S01E01.1080p.WEB-DL.x264', 'video')).toBe('1080p WEB-DL');
    expect(qualityOfReleaseTitle('A.Film.2021.x264', 'video')).toBeNull();
  });

  it('reads music’s format, and a book’s', () => {
    expect(qualityOfReleaseTitle('Artist - Album (2020) [FLAC 24bit]', 'music')).toBe(
      'FLAC 24-bit',
    );
    expect(qualityOfReleaseTitle('Artist - Album (2020) [MP3 320]', 'music')).toBe('MP3 320');
    expect(qualityOfReleaseTitle('Author - A Book (Unabridged) M4B', 'book')).toBe('M4B');
    expect(qualityOfReleaseTitle('Author - A Book EPUB', 'book')).toBe('EPUB');
  });
});
