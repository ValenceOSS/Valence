import { describe, expect, it } from 'vitest';
import { lowerKeysDeep } from './lowerKeysDeep';

describe('lowerKeysDeep', () => {
  it('lowers names at every depth and leaves values alone', () => {
    expect(
      lowerKeysDeep({ DeviceProfile: { DirectPlayProfiles: [{ Container: 'MKV' }] }, N: 1 }),
    ).toEqual({ deviceprofile: { directplayprofiles: [{ container: 'MKV' }] }, n: 1 });
  });

  it('leaves a value that is not an object as it is', () => {
    expect(lowerKeysDeep('Text')).toBe('Text');
    expect(lowerKeysDeep(null)).toBeNull();
  });
});
