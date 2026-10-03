import { describe, expect, it } from 'vitest';
import { ownerKeyOf } from './ownerKeyOf';

describe('ownerKeyOf', () => {
  it('tells an account’s own link from each of its faces’', () => {
    expect(ownerKeyOf({ accountId: 'ada', profileId: null })).toBe('ada:account');
    expect(ownerKeyOf({ accountId: 'ada', profileId: 'ada-face' })).toBe('ada:face:ada-face');
    expect(ownerKeyOf({ accountId: 'ada', profileId: null })).not.toBe(
      ownerKeyOf({ accountId: 'ada', profileId: 'account' }),
    );
  });
});
