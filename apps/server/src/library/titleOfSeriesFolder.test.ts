import { describe, expect, it } from 'vitest';
import { titleOfSeriesFolder } from './titleOfSeriesFolder';

describe('titleOfSeriesFolder', () => {
  it('names a programme from its folder', () => {
    expect(titleOfSeriesFolder('/media/shows/Curb Your Enthusiasm')).toBe('Curb Your Enthusiasm');
  });

  it('leaves the year out, which is a fact about the programme rather than its name', () => {
    expect(titleOfSeriesFolder('/media/shows/Unsolved (2018)')).toBe('Unsolved');
  });

  it('reads a country the way a folder writes it', () => {
    expect(titleOfSeriesFolder('/media/shows/The Office (US)')).toBe('The Office US');
  });

  it('turns the separators a release uses back into spaces', () => {
    expect(titleOfSeriesFolder('/media/shows/Some.Show')).toBe('Some Show');
  });

  it('gives nothing for a folder with no name to give', () => {
    expect(titleOfSeriesFolder('/media/shows/(2019)')).toBeNull();
  });
});
