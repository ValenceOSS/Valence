import { describe, expect, it } from 'vitest';
import { possessiveOf } from './possessiveOf';

describe('possessiveOf', () => {
  it('adds an apostrophe and an s to an ordinary name', () => {
    expect(possessiveOf('Dan')).toBe('Dan’s');
  });

  it('adds the apostrophe alone to a name already ending in s', () => {
    expect(possessiveOf('Marques')).toBe('Marques’');
  });

  it('reads a capital S at the end as an s', () => {
    expect(possessiveOf('CHRIS')).toBe('CHRIS’');
  });

  it('trims what it is given, so a stray space does not land before the apostrophe', () => {
    expect(possessiveOf('  Dan  ')).toBe('Dan’s');
  });

  it('answers with nothing where there is no name', () => {
    expect(possessiveOf('   ')).toBe('');
  });
});
