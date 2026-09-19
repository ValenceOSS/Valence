import { describe, expect, it } from 'vitest';
import { nameOfSession } from './nameOfSession';

describe('nameOfSession', () => {
  it('calls a viewer by their own name', () => {
    expect(nameOfSession({ isGuest: false, guestOf: null, profileName: 'Marques' })).toBe(
      'Marques',
    );
  });

  it('calls a guest after whoever let them in', () => {
    expect(nameOfSession({ isGuest: true, guestOf: 'Dan', profileName: null })).toBe('Dan’s guest');
  });

  it('still says somebody is a guest where the link has lost its owner', () => {
    expect(nameOfSession({ isGuest: true, guestOf: null, profileName: null })).toBe('A guest');
  });

  it('says a tab that has not named itself is unknown, rather than calling it a guest', () => {
    expect(nameOfSession({ isGuest: false, guestOf: null, profileName: null })).toBe(
      'Unknown viewer',
    );
  });
});
