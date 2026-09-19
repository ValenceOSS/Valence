import { describe, expect, it, vi } from 'vitest';
import { guestAtTheDoor } from './guestAtTheDoor';
import type { ResolvedShare } from './ShareService';

const A_SHARE: ResolvedShare = {
  id: 'share-1',
  createdBy: 'account-1',
  createdByName: 'Dan',
  kind: 'item',
  mediaId: 'film-1',
  seriesId: null,
  bookId: null,
  title: 'Arrival',
  expiresAt: null,
  viewCap: null,
  views: 0,
  revokedAt: null,
};

describe('guestAtTheDoor', () => {
  it('says which link somebody holds and whose it is', async () => {
    const shares = { resolve: vi.fn(() => Promise.resolve(A_SHARE)) };

    expect(await guestAtTheDoor('a-token', shares)).toEqual({
      shareId: 'share-1',
      guestOf: 'Dan',
    });
  });

  it('answers with nothing where there is no cookie to read', async () => {
    const shares = { resolve: vi.fn(() => Promise.resolve(A_SHARE)) };

    expect(await guestAtTheDoor(undefined, shares)).toBeNull();
    expect(shares.resolve).not.toHaveBeenCalled();
  });

  it('treats an empty cookie as no cookie', async () => {
    const shares = { resolve: vi.fn(() => Promise.resolve(A_SHARE)) };

    expect(await guestAtTheDoor('', shares)).toBeNull();
    expect(shares.resolve).not.toHaveBeenCalled();
  });

  it('answers with nothing where the link resolves to nothing', async () => {
    const shares = { resolve: vi.fn(() => Promise.resolve(null)) };

    expect(await guestAtTheDoor('a-token', shares)).toBeNull();
  });

  it('carries no name where the account that made the link is gone', async () => {
    const shares = { resolve: vi.fn(() => Promise.resolve({ ...A_SHARE, createdByName: null })) };

    expect(await guestAtTheDoor('a-token', shares)).toEqual({
      shareId: 'share-1',
      guestOf: null,
    });
  });
});
