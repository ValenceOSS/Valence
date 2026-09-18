import { describe, expect, it } from 'vitest';
import { NAME_MAX } from '@ValenceContracts/schemas/Household';
import { whatIsWrongWithTheName } from './whatIsWrongWithTheName';

describe('what a household may be called', () => {
  it('finds nothing wrong with an ordinary name', () => {
    expect(whatIsWrongWithTheName('The Morgans')).toBeNull();
  });

  it('asks for one where there is none', () => {
    expect(whatIsWrongWithTheName('')).toBe('Give the household a name.');
  });

  it('treats a name of only spaces as none at all', () => {
    expect(whatIsWrongWithTheName('   ')).toBe('Give the household a name.');
  });

  it('measures what will be saved rather than what was typed', () => {
    expect(whatIsWrongWithTheName(`  ${'a'.repeat(NAME_MAX)}  `)).toBeNull();
  });

  it('says how long is too long, rather than only that it is', () => {
    expect(whatIsWrongWithTheName('a'.repeat(NAME_MAX + 1))).toContain(NAME_MAX.toString());
  });
});
