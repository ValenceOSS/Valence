import { describe, expect, it } from 'vitest';
import { householdNameOf } from './householdNameOf';

const DAN = { name: 'Dan', isOwner: true };
const DAD = { name: 'Dad', isOwner: false };

describe('householdNameOf', () => {
  it('calls a one-person account by its one profile, whatever the account once chose', () => {
    expect(householdNameOf({ name: 'dcm', household: 'The Morgans', profiles: [DAN] })).toBe('Dan');
  });

  it('calls an account of several people what it chose to be called', () => {
    expect(householdNameOf({ name: 'dcm', household: 'The Morgans', profiles: [DAD, DAN] })).toBe(
      'The Morgans',
    );
  });

  it('calls an account of several people by its owner until it has chosen a name', () => {
    expect(householdNameOf({ name: 'dcm', household: null, profiles: [DAD, DAN] })).toBe('Dan');
  });

  it('treats a name of nothing but spaces as no name at all', () => {
    expect(householdNameOf({ name: 'dcm', household: '   ', profiles: [DAD, DAN] })).toBe('Dan');
  });

  it('trims the spaces around a chosen name', () => {
    expect(householdNameOf({ name: 'dcm', household: ' The Morgans ', profiles: [DAD, DAN] })).toBe(
      'The Morgans',
    );
  });

  it('falls back to the account’s own name before it has any profile', () => {
    expect(householdNameOf({ name: 'dcm', household: null, profiles: [] })).toBe('dcm');
  });
});
