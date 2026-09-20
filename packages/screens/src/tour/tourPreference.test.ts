import { afterEach, describe, expect, it } from 'vitest';
import { hasSeenTour, markTourSeen } from './tourPreference';

afterEach(() => {
  window.localStorage.clear();
});

describe('tourPreference', () => {
  it('says nobody has seen it to begin with', () => {
    expect(hasSeenTour('account-1')).toBe(false);
  });

  it('remembers who has, and only them', () => {
    markTourSeen('account-1');

    expect(hasSeenTour('account-1')).toBe(true);
    expect(hasSeenTour('account-2')).toBe(false);
  });

  it('keeps everybody it has been told about', () => {
    markTourSeen('account-1');
    markTourSeen('account-2');
    markTourSeen('account-1');

    expect(hasSeenTour('account-1')).toBe(true);
    expect(hasSeenTour('account-2')).toBe(true);
  });
});
