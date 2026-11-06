import { describe, expect, it } from 'vitest';
import { judgeBookFormat } from './judgeBookFormat';

const judged = (title: string, categories: number[] = []) => judgeBookFormat({ title, categories });

describe('judgeBookFormat', () => {
  it('puts an EPUB above an AZW3 above a MOBI, and retail above a scan', () => {
    expect(judged('Some Book EPUB').score).toBeGreaterThan(judged('Some Book AZW3').score);
    expect(judged('Some Book AZW3').score).toBeGreaterThan(judged('Some Book MOBI').score);
    expect(judged('Some Book EPUB Retail').score).toBeGreaterThan(judged('Some Book EPUB').score);
    expect(judged('Some Book EPUB Scan').score).toBeLessThan(judged('Some Book EPUB').score);
  });

  it('puts an M4B above an MP3', () => {
    expect(judged('Some Book M4B', [3030]).score).toBeGreaterThan(
      judged('Some Book MP3', [3030]).score,
    );
  });

  it('refuses an abridged audiobook and takes an unabridged one', () => {
    expect(judged('Some Book (Abridged) MP3', [3030]).rejections).toHaveLength(1);
    expect(judged('Some Book (Unabridged) M4B', [3030]).rejections).toEqual([]);
  });

  it('refuses a full-cast adaptation, which is not the book read aloud', () => {
    expect(
      judged('Series 7, Some Book [Graphic Audio] - Author', [7000]).rejections.map(
        (said) => said.message,
      ),
    ).toEqual(['It’s a full-cast adaptation, not the book read aloud']);
    expect(judged('Some Book (Dramatized Adaptation) M4B', [3030]).rejections).toHaveLength(1);
    expect(judged('Some Book (Unabridged) M4B', [3030]).rejections).toEqual([]);
  });

  it('says why it ranks where it does', () => {
    expect(judged('Some Book EPUB Retail').reasons.map((said) => said.message)).toEqual([
      'EPUB, preferred for ebooks (+30)',
      'Retail (+10)',
    ]);
  });

  it('refuses a film or programme that shares the book’s name', () => {
    const refusal = ['It’s a film or programme, not a book'];
    const reasonsOf = (title: string, categories: number[] = []) =>
      judged(title, categories).rejections.map((said) => said.message);

    expect(reasonsOf('Harry Potter and the Chamber of Secrets (2002) DVDRip - Nony')).toEqual(
      refusal,
    );
    expect(reasonsOf('Harry Potter And the Deathly Hallows Part 1 (2010) 1080p x264')).toEqual(
      refusal,
    );
    expect(reasonsOf('Harry Potter and the Chamber of Secrets', [2040])).toEqual(refusal);
    expect(reasonsOf('Harry Potter and the Chamber of Secrets EPUB', [7020])).toEqual([]);
  });

  it('refuses a game that shares the book’s name', () => {
    expect(
      judged('[PCGame 1 CD Multi3] Harry Potter and the Philosopher’s Stone').rejections.map(
        (said) => said.message,
      ),
    ).toEqual(['It’s a game or software, not a book']);
    expect(judged('Harry Potter and the Philosopher’s Stone', [4050]).rejections).toHaveLength(1);
  });

  it('keeps a book whose category is a book’s, whatever its name says', () => {
    expect(judged('The Hunger Games 1080p Edition EPUB', [7020]).rejections).toEqual([]);
    expect(judged('Ready Player One (Unabridged) M4B', [3030]).rejections).toEqual([]);
  });
});
