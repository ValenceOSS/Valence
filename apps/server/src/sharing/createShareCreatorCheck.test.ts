import { describe, expect, it } from 'vitest';
import { createShareCreatorCheck } from './createShareCreatorCheck';
import type { GrantedPermission } from '@ValenceContracts/schemas/Permission';

const ITEM = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';

const BOOK = '6f4e0c1a-8b0b-4c55-9d7d-6a6a7f0c0001';

/**
 * The checks, over an account with the standing given.
 */
const checks = (
  standing: {
    banned?: boolean;
    held?: GrantedPermission[];
    refusedItems?: string[];
    refusedBooks?: string[];
  } = {},
) =>
  createShareCreatorCheck({
    isBanned: () => Promise.resolve(standing.banned ?? false),
    permissionsOf: () => Promise.resolve(new Set(standing.held ?? ['sharing.link'])),
    isOutOfReach: (viewer, mediaId) =>
      Promise.resolve(
        !(viewer.kind === 'account' && viewer.isAdministrator) &&
          (standing.refusedItems ?? []).includes(mediaId),
      ),
    canReachBook: (viewer, bookId) =>
      Promise.resolve(
        (viewer.kind === 'account' && viewer.isAdministrator) ||
          !(standing.refusedBooks ?? []).includes(bookId),
      ),
  });

describe('createShareCreatorCheck', () => {
  it('looks a creator up once for the requests inside a few seconds, and again after', async () => {
    let looked = 0;
    let clock = 0;
    const check = createShareCreatorCheck({
      isBanned: () => {
        looked += 1;

        return Promise.resolve(false);
      },
      permissionsOf: () => Promise.resolve(new Set<GrantedPermission>(['sharing.link'])),
      isOutOfReach: () => Promise.resolve(false),
      canReachBook: () => Promise.resolve(true),
      now: () => clock,
    });

    await check.stillShares('account-1');
    await check.reaches('account-1', ITEM);
    clock = 9_000;
    await check.stillShares('account-1');

    expect(looked).toBe(1);

    clock = 11_000;
    await check.stillShares('account-1');

    expect(looked).toBe(2);
  });

  it('keeps a link working for somebody still allowed to share', async () => {
    expect(await checks().stillShares('account-1')).toBe(true);
    expect(await checks().reaches('account-1', ITEM)).toBe(true);
  });

  it('stops it once its creator is banned or may no longer share', async () => {
    expect(await checks({ banned: true }).stillShares('account-1')).toBe(false);
    expect(await checks({ held: [] }).stillShares('account-1')).toBe(false);
  });

  it('stops it reaching what its creator can no longer reach', async () => {
    expect(await checks({ refusedItems: [ITEM] }).reaches('account-1', ITEM)).toBe(false);
  });

  it('stops it reaching a book its creator can no longer reach', async () => {
    expect(await checks().reachesBook('account-1', BOOK)).toBe(true);
    expect(await checks({ refusedBooks: [BOOK] }).reachesBook('account-1', BOOK)).toBe(false);
  });

  it('lets an administrator’s link reach what administrators are never kept from', async () => {
    expect(
      await checks({ held: ['administrator', 'sharing.link'], refusedItems: [ITEM] }).reaches(
        'account-1',
        ITEM,
      ),
    ).toBe(true);
  });
});
