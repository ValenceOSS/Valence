import { afterEach, describe, expect, it } from 'vitest';
import { readTheBoot } from './readTheBoot';

afterEach(() => {
  delete window.__VALENCE_BOOT__;
});

describe('readTheBoot', () => {
  it('reads what the host left on the window', () => {
    window.__VALENCE_BOOT__ = { passkeyWay: 'system', isReachable: false };

    expect(readTheBoot()).toMatchObject({ passkeyWay: 'system', isReachable: false });
  });

  it('starts from nothing known where the host left nothing', () => {
    expect(readTheBoot()).toMatchObject({ preferences: {}, update: { kind: 'none' } });
  });
});
