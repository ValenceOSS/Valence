import { describe, expect, it } from 'vitest';
import { hasSeededEnough } from '@ValenceRequests/downloads/hasSeededEnough';

const GB = 1024 ** 3;

const seeding = (seedingSeconds: number | null, uploadedBytes: number | null) => ({
  seedingSeconds,
  uploadedBytes,
  sizeBytes: GB,
});

describe('hasSeededEnough', () => {
  it('is satisfied at once where nothing is asked for', () => {
    expect(hasSeededEnough(seeding(0, 0), { seedSeconds: null, seedRatio: null })).toBe(true);
  });

  it('holds a torrent until it has seeded for as long as it was asked to', () => {
    const rule = { seedSeconds: 3600, seedRatio: null };

    expect(hasSeededEnough(seeding(3599, 0), rule)).toBe(false);
    expect(hasSeededEnough(seeding(3600, 0), rule)).toBe(true);
  });

  it('holds a torrent until it has given back the ratio it was asked to', () => {
    const rule = { seedSeconds: null, seedRatio: 1 };

    expect(hasSeededEnough(seeding(0, GB / 2), rule)).toBe(false);
    expect(hasSeededEnough(seeding(0, GB), rule)).toBe(true);
  });

  it('wants both where both were asked for', () => {
    const rule = { seedSeconds: 3600, seedRatio: 1 };

    expect(hasSeededEnough(seeding(3600, GB / 2), rule)).toBe(false);
    expect(hasSeededEnough(seeding(60, GB * 2), rule)).toBe(false);
    expect(hasSeededEnough(seeding(3600, GB), rule)).toBe(true);
  });

  it('will not call a rule met on numbers the client would not give', () => {
    expect(hasSeededEnough(seeding(null, GB), { seedSeconds: 60, seedRatio: null })).toBe(false);
    expect(hasSeededEnough(seeding(60, null), { seedSeconds: null, seedRatio: 1 })).toBe(false);
    expect(
      hasSeededEnough(
        { seedingSeconds: 60, uploadedBytes: GB, sizeBytes: null },
        { seedSeconds: null, seedRatio: 1 },
      ),
    ).toBe(false);
  });

  it('will not divide by a size of nothing', () => {
    expect(
      hasSeededEnough(
        { seedingSeconds: 60, uploadedBytes: 0, sizeBytes: 0 },
        { seedSeconds: null, seedRatio: 1 },
      ),
    ).toBe(false);
  });
});
