import { describe, expect, it } from 'vitest';
import { readStreamLimit } from './readStreamLimit';

describe('readStreamLimit', () => {
  const LIMITS = {
    accounts: {
      ada: { maxBitrateKbps: 20_000, maxStreams: null, maxQuality: null, limitsDownloads: false },
      cy: { maxBitrateKbps: null, maxStreams: 3, maxQuality: '480p', limitsDownloads: false },
    },
    roles: {
      kids: { maxBitrateKbps: 8000, maxStreams: 1, maxQuality: null, limitsDownloads: false },
      family: {
        maxBitrateKbps: 30_000,
        maxStreams: 4,
        maxQuality: '1080p',
        limitsDownloads: true,
      },
    },
  } as const;

  it('holds an account to its own limit and its role’s, the strictest of each', () => {
    expect(readStreamLimit(LIMITS, 'ada', [{ id: 'kids', position: 0 }])).toEqual({
      maxBitrateKbps: 8000,
      maxStreams: 1,
      maxQuality: null,
      limitsDownloads: false,
    });
  });

  it('takes the limit of the highest role over a stricter one on a lower role', () => {
    expect(
      readStreamLimit(LIMITS, 'bo', [
        { id: 'kids', position: 10 },
        { id: 'family', position: 50 },
      ]),
    ).toEqual({
      maxBitrateKbps: 30_000,
      maxStreams: 4,
      maxQuality: '1080p',
      limitsDownloads: true,
    });
  });

  it('still lets the account’s own limit tighten that of its highest role', () => {
    expect(
      readStreamLimit(LIMITS, 'cy', [
        { id: 'kids', position: 10 },
        { id: 'family', position: 50 },
      ]),
    ).toEqual({
      maxBitrateKbps: 30_000,
      maxStreams: 3,
      maxQuality: '480p',
      limitsDownloads: true,
    });
  });

  it('holds an account with no roles to its own limit alone', () => {
    expect(readStreamLimit(LIMITS, 'cy', [])).toEqual({
      maxBitrateKbps: null,
      maxStreams: 3,
      maxQuality: '480p',
      limitsDownloads: false,
    });
  });

  it('leaves an account nobody limited free', () => {
    const free = {
      maxBitrateKbps: null,
      maxStreams: null,
      maxQuality: null,
      limitsDownloads: false,
    };

    expect(readStreamLimit(LIMITS, 'bo', [])).toEqual(free);
    expect(readStreamLimit(undefined, 'bo', [])).toEqual(free);
  });
});
