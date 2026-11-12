import { describe, expect, it } from 'vitest';
import { diskShares } from './diskShares';

const NAMES = { valence: 'Valence', else: 'Everything else', free: 'Free' };

const DISK = { totalBytes: 1000, availableBytes: 400 };

describe('diskShares', () => {
  it('divides the disk between its libraries, Valence, everything else and the room left', () => {
    const shares = diskShares(
      DISK,
      [
        { id: 'films', name: 'Films', kind: 'movies', sizeBytes: 200 },
        { id: 'shows', name: 'Shows', kind: 'shows', sizeBytes: 300 },
      ],
      50,
      NAMES,
    );

    expect(shares.map((share) => [share.id, share.bytes])).toEqual([
      ['shows', 300],
      ['films', 200],
      ['valence', 50],
      ['else', 50],
      ['free', 400],
    ]);
  });

  it('always adds up to the disk', () => {
    const shares = diskShares(
      DISK,
      [{ id: 'films', name: 'Films', kind: 'movies', sizeBytes: 123 }],
      77,
      NAMES,
    );

    expect(shares.reduce((sum, share) => sum + share.bytes, 0)).toBe(DISK.totalBytes);
  });

  it('leaves out a library holding nothing', () => {
    const shares = diskShares(
      DISK,
      [{ id: 'empty', name: 'Empty', kind: 'movies', sizeBytes: 0 }],
      0,
      NAMES,
    );

    expect(shares.some((share) => share.id === 'empty')).toBe(false);
  });

  it('never counts more of Valence than the used space leaves room for', () => {
    const shares = diskShares(
      DISK,
      [{ id: 'films', name: 'Films', kind: 'movies', sizeBytes: 590 }],
      500,
      NAMES,
    );

    expect(shares.find((share) => share.id === 'valence')?.bytes).toBe(10);
    expect(shares.find((share) => share.id === 'else')?.bytes).toBe(0);
  });
});
