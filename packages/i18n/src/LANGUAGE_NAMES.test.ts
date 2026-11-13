import { describe, expect, it } from 'vitest';
import { LANGUAGES } from './LANGUAGES';
import { LANGUAGE_NAMES } from './LANGUAGE_NAMES';

describe('LANGUAGE_NAMES', () => {
  it('names every language Valence is translated into', () => {
    expect(Object.keys(LANGUAGE_NAMES).sort()).toEqual([...LANGUAGES].sort());
  });
});
