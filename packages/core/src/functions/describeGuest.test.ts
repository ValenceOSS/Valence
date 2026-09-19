import { describe, expect, it } from 'vitest';
import { describeGuest } from './describeGuest';

describe('describeGuest', () => {
  it('names a guest after whoever let them in', () => {
    expect(describeGuest('Dan')).toBe('Dan’s guest');
  });

  it('writes the possessive the way the name wants it', () => {
    expect(describeGuest('Marques')).toBe('Marques’ guest');
  });

  it('says only that somebody is a guest where nobody is named', () => {
    expect(describeGuest(null)).toBe('A guest');
  });

  it('says the same where the name is empty, rather than leaving a gap before the word', () => {
    expect(describeGuest('  ')).toBe('A guest');
  });
});
