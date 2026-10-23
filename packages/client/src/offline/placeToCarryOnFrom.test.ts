import { describe, expect, it } from 'vitest';
import { placeToCarryOnFrom } from '@ValenceClient/offline/placeToCarryOnFrom';

const MEDIA = '00000000-0000-4000-8000-000000000001';

const here = (positionSeconds: number, at: string) => ({
  mediaId: MEDIA,
  positionSeconds,
  durationSeconds: 6000,
  atMs: Date.parse(at),
  server: null,
  profileId: 'pat',
});

const there = (positionSeconds: number, at: string) => ({
  mediaId: MEDIA,
  positionSeconds,
  durationSeconds: 6000,
  isFinished: false,
  updatedAt: at,
});

describe('placeToCarryOnFrom', () => {
  it('carries on from the server where another device watched it more recently', () => {
    expect(
      placeToCarryOnFrom(
        here(300, '2026-10-01T00:00:00.000Z'),
        there(2000, '2026-10-02T00:00:00.000Z'),
      ),
    ).toBe(2000);
  });

  it('carries on from this device where it was watched here more recently', () => {
    expect(
      placeToCarryOnFrom(
        here(3000, '2026-10-03T00:00:00.000Z'),
        there(2000, '2026-10-02T00:00:00.000Z'),
      ),
    ).toBe(3000);
  });

  it('carries on from whichever there is where there is only one', () => {
    expect(placeToCarryOnFrom(here(300, '2026-10-01T00:00:00.000Z'), undefined)).toBe(300);
    expect(placeToCarryOnFrom(undefined, there(2000, '2026-10-02T00:00:00.000Z'))).toBe(2000);
  });

  it('starts from the beginning where nothing says otherwise, or the newest place is not worth resuming', () => {
    expect(placeToCarryOnFrom(undefined, undefined)).toBeNull();
    expect(
      placeToCarryOnFrom(
        here(300, '2026-10-01T00:00:00.000Z'),
        there(5990, '2026-10-02T00:00:00.000Z'),
      ),
    ).toBeNull();
  });
});
