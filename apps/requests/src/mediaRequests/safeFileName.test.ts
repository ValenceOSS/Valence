import { describe, expect, it } from 'vitest';
import { safeFileName } from './safeFileName';

describe('safeFileName', () => {
  it('keeps what a file name may hold', () => {
    expect(safeFileName("Schindler's List")).toBe("Schindler's List");
  });

  it('turns a colon into a dash, and drops what no file name may hold', () => {
    expect(safeFileName('Mission: Impossible')).toBe('Mission - Impossible');
    expect(safeFileName('What If...?')).toBe('What If');
    expect(safeFileName('AC/DC  "Live"')).toBe('ACDC Live');
  });
});
