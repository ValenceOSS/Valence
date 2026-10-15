import { describe, expect, it } from 'vitest';
import { readStreamLimit } from './readStreamLimit';

describe('readStreamLimit', () => {
  const LIMITS = {
    accounts: { ada: { maxBitrateKbps: 20_000, maxStreams: null } },
    roles: { kids: { maxBitrateKbps: 8000, maxStreams: 1 } },
  };

  it('holds an account to its own limit and its roles’, the strictest of each', () => {
    expect(readStreamLimit(LIMITS, 'ada', ['kids'])).toEqual({
      maxBitrateKbps: 8000,
      maxStreams: 1,
    });
  });

  it('leaves an account nobody limited free', () => {
    expect(readStreamLimit(LIMITS, 'bo', [])).toEqual({ maxBitrateKbps: null, maxStreams: null });
    expect(readStreamLimit(undefined, 'bo', [])).toEqual({
      maxBitrateKbps: null,
      maxStreams: null,
    });
  });
});
