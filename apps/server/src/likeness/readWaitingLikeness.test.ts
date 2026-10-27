import { describe, expect, it, vi } from 'vitest';
import type { CatalogueTitle } from './createDatabaseLikenessStore';
import type { Likeness } from './Likeness';
import { READ_AGAIN_AFTER_MS, readWaitingLikeness } from './readWaitingLikeness';
import type { LikenessReading } from './readWaitingLikeness';

const NOW = new Date('2026-10-26T12:00:00.000Z');

const ALIKE: Likeness = { genres: [18], keywords: [1], cast: [], crew: [], recommendations: [] };

/**
 * Sets up a reading over the titles given, every one of which the catalogue answers unless told
 * otherwise.
 *
 * @param waiting - The titles waiting.
 * @param overrides - What to change about the reading.
 * @returns The reading, and the store it keeps into.
 */
const aReading = (waiting: CatalogueTitle[], overrides: Partial<LikenessReading> = {}) => {
  const store = {
    waiting: vi.fn(() => Promise.resolve(waiting)),
    keep: vi.fn(() => Promise.resolve()),
    forgetUnheld: vi.fn(() => Promise.resolve()),
  };
  const reading: LikenessReading = {
    store,
    read: () => Promise.resolve({ value: ALIKE, trouble: null }),
    onProgress: () => {},
    isCancelled: () => false,
    now: () => NOW,
    ...overrides,
  };

  return { reading, store };
};

describe('reading what the waiting titles are like', () => {
  it('keeps what the catalogue says of each title not read for a month', async () => {
    const { reading, store } = aReading([
      { kind: 'film', catalogueId: '603' },
      { kind: 'series', catalogueId: '95396' },
    ]);

    await expect(readWaitingLikeness(reading)).resolves.toEqual({ read: 2, trouble: null });
    expect(store.waiting).toHaveBeenCalledWith(new Date(NOW.getTime() - READ_AGAIN_AFTER_MS));
    expect(store.keep).toHaveBeenCalledWith({ kind: 'film', catalogueId: '603' }, ALIKE, NOW);
    expect(store.forgetUnheld).toHaveBeenCalled();
  });

  it('keeps a title the catalogue does not know as alike to nothing', async () => {
    const { reading, store } = aReading([{ kind: 'film', catalogueId: '1' }], {
      read: () => Promise.resolve({ value: null, trouble: null }),
    });

    await readWaitingLikeness(reading);

    expect(store.keep).toHaveBeenCalledWith(
      { kind: 'film', catalogueId: '1' },
      { genres: [], keywords: [], cast: [], crew: [], recommendations: [] },
      NOW,
    );
  });

  it('stops at the first trouble, keeping nothing for the title that met it', async () => {
    const trouble = { source: 'TMDB', reason: 'rateLimited' } as const;
    const read = vi.fn(() => Promise.resolve({ value: null, trouble }));
    const { reading, store } = aReading(
      Array.from(
        { length: 10 },
        (_, at) => ({ kind: 'film', catalogueId: at.toString() }) as const,
      ),
      { read },
    );

    await expect(readWaitingLikeness(reading)).resolves.toEqual({ read: 0, trouble });
    expect(store.keep).not.toHaveBeenCalled();
    expect(read.mock.calls.length).toBeLessThan(10);
  });

  it('stops at a request that fails outright, as at any other trouble', async () => {
    const { reading, store } = aReading([{ kind: 'film', catalogueId: '603' }], {
      read: () => Promise.reject(new Error('reset')),
    });

    await expect(readWaitingLikeness(reading)).resolves.toMatchObject({
      read: 0,
      trouble: { reason: 'unreachable' },
    });
    expect(store.keep).not.toHaveBeenCalled();
  });

  it('stops when the run is cancelled', async () => {
    const { reading, store } = aReading([{ kind: 'film', catalogueId: '603' }], {
      isCancelled: () => true,
    });

    await expect(readWaitingLikeness(reading)).resolves.toEqual({ read: 0, trouble: null });
    expect(store.keep).not.toHaveBeenCalled();
  });

  it('tells how far it has got', async () => {
    const onProgress = vi.fn();
    const { reading } = aReading([{ kind: 'film', catalogueId: '603' }], { onProgress });

    await readWaitingLikeness(reading);

    expect(onProgress.mock.calls).toEqual([
      [0, 1],
      [1, 1],
    ]);
  });
});
