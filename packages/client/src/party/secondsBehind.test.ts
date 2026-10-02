import { describe, expect, it } from 'vitest';
import { secondsBehind } from './secondsBehind';
import { aPartyMember } from '@ValenceClient/testing/aPartyMember';

describe('secondsBehind', () => {
  const keeper = aPartyMember({ connectionId: 'keeper', positionSeconds: 100 });

  it('says how far behind somebody is, and ahead as less than nothing', () => {
    expect(secondsBehind(aPartyMember({ positionSeconds: 94 }), keeper)).toBe(6);
    expect(secondsBehind(aPartyMember({ positionSeconds: 103 }), keeper)).toBe(-3);
  });

  it('carries an earlier report forward before comparing', () => {
    const earlier = aPartyMember({ positionSeconds: 99, reportedAtMs: 0 });
    const later = { ...keeper, reportedAtMs: 1000 };

    expect(secondsBehind(earlier, later)).toBeCloseTo(0, 5);
  });
});
