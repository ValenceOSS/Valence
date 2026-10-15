import { describe, expect, it } from 'vitest';
import { householdNameOf } from './householdNameOf';

describe('householdNameOf', () => {
  it('calls a household what it chose to be called', () => {
    expect(householdNameOf({ name: 'Dan', household: 'The Morgans' })).toBe('The Morgans');
  });

  it('calls a household by its account’s name until it has chosen one', () => {
    expect(householdNameOf({ name: 'Dan', household: null })).toBe('Dan');
  });

  it('treats a name of nothing but spaces as no name at all', () => {
    expect(householdNameOf({ name: 'Dan', household: '   ' })).toBe('Dan');
    expect(householdNameOf({ name: 'Dan', household: '' })).toBe('Dan');
  });

  it('trims the spaces around a chosen name', () => {
    expect(householdNameOf({ name: 'Dan', household: '  The Morgans ' })).toBe('The Morgans');
  });
});
