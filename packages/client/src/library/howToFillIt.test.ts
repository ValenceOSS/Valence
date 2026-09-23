import { describe, expect, it } from 'vitest';
import { howToFillIt } from './howToFillIt';

describe('howToFillIt', () => {
  it('tells an admin to add a library, and anybody else whom to ask', () => {
    expect(howToFillIt('no libraries', true)).toBe('Add one to get started.');
    expect(howToFillIt('no libraries', false)).toBe('Ask the server admin to add one.');
  });

  it('says every library wants scanning where all of them are empty', () => {
    expect(howToFillIt('every library', false)).toBe(
      'Ask the server admin to scan your libraries.',
    );
  });

  it('says the one library wants scanning where only it is empty', () => {
    expect(howToFillIt('one library', true)).toBe('Scan it, or add files to its folder.');
  });
});
