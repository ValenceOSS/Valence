import { describe, expect, it } from 'vitest';
import { sayAgainIfAny } from './sayAgainIfAny';
import { saying } from './saying';

describe('sayAgainIfAny', () => {
  it('says again what was said', () => {
    expect(sayAgainIfAny(saying('common.noReasonGiven'))).toBe('no reason given');
  });

  it('says nothing where nothing was said', () => {
    expect(sayAgainIfAny(null)).toBeNull();
    expect(sayAgainIfAny(undefined)).toBeNull();
  });
});
