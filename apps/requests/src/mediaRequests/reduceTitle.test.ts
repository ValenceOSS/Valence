import { describe, expect, it } from 'vitest';
import { reduceTitle } from './reduceTitle';

describe('reduceTitle', () => {
  it('keeps only what two spellings of a title share', () => {
    expect(reduceTitle('The Office (2005)')).toBe('office');
    expect(reduceTitle('Law & Order: Special Victims Unit')).toBe(
      'law and order special victims unit',
    );
    expect(reduceTitle('Amélie')).toBe('amelie');
  });
});
