import { describe, expect, it } from 'vitest';
import { isUnknownToServer } from './isUnknownToServer';

describe('isUnknownToServer', () => {
  it('knows the address is unknown where a newer server refuses it as such', () => {
    expect(isUnknownToServer(404, { code: 'error.common.thisServerDoesNotHaveThatAddress' })).toBe(
      true,
    );
  });

  it('knows the address is unknown where an older server answers a plain-text 404', () => {
    expect(isUnknownToServer(404, undefined)).toBe(true);
  });

  it('takes any other refusal as the thing asked for being missing', () => {
    expect(isUnknownToServer(404, { code: 'error.common.noSuchMediaItem' })).toBe(false);
    expect(isUnknownToServer(404, { error: 'There is no such folder.' })).toBe(false);
    expect(isUnknownToServer(404, {})).toBe(false);
  });

  it('says nothing about an answer that is not a 404', () => {
    expect(isUnknownToServer(500, undefined)).toBe(false);
    expect(isUnknownToServer(403, { code: 'error.common.thisServerDoesNotHaveThatAddress' })).toBe(
      false,
    );
  });
});
