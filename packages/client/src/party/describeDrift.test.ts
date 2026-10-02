import { describe, expect, it } from 'vitest';
import { describeDrift } from './describeDrift';
import { aPartyMember } from '@ValenceClient/testing/aPartyMember';

describe('describeDrift', () => {
  const keeper = aPartyMember({ connectionId: 'keeper', positionSeconds: 100 });

  it('says how far behind or ahead somebody is', () => {
    expect(describeDrift(aPartyMember({ positionSeconds: 95 }), keeper)).toBe('5.0s behind');
    expect(describeDrift(aPartyMember({ positionSeconds: 102.5 }), keeper)).toBe('2.5s ahead');
  });

  it('says nothing of a gap too small to matter', () => {
    expect(describeDrift(aPartyMember({ positionSeconds: 99.6 }), keeper)).toBeNull();
  });
});
