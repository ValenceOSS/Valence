import { describe, expect, it } from 'vitest';
import { seriesCoverOf } from './seriesCoverOf';

describe('seriesCoverOf', () => {
  it('takes the first book in reading order, passing over a prequel and a companion', () => {
    expect(
      seriesCoverOf([
        { position: '0', isCompanion: false, coverUrl: 'prequel.jpg' },
        { position: '2', isCompanion: false, coverUrl: 'second.jpg' },
        { position: '1', isCompanion: true, coverUrl: 'companion.jpg' },
        { position: '1', isCompanion: false, coverUrl: 'first.jpg' },
      ]),
    ).toBe('first.jpg');
  });

  it('falls back to any book with a cover, and to nothing where none has one', () => {
    expect(seriesCoverOf([{ position: null, isCompanion: true, coverUrl: 'any.jpg' }])).toBe(
      'any.jpg',
    );
    expect(seriesCoverOf([{ position: '1', isCompanion: false, coverUrl: null }])).toBeNull();
  });
});
