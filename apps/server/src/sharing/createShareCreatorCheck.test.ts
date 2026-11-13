import { describe, expect, it } from 'vitest';
import { createShareCreatorCheck } from './createShareCreatorCheck';
import type { GrantedPermission } from '@ValenceContracts/schemas/Permission';

const ITEM = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';

/**
 * The checks, over an account with the standing given.
 */
const checks = (
  standing: { banned?: boolean; held?: GrantedPermission[]; refusedItems?: string[] } = {},
) =>
  createShareCreatorCheck({
    isBanned: () => Promise.resolve(standing.banned ?? false),
    permissionsOf: () => Promise.resolve(new Set(standing.held ?? ['sharing.link'])),
    isOutOfReach: (viewer, mediaId) =>
      Promise.resolve(
        !(viewer.kind === 'account' && viewer.isAdministrator) &&
          (standing.refusedItems ?? []).includes(mediaId),
      ),
  });

describe('createShareCreatorCheck', () => {
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

  it('lets an administrator’s link reach what administrators are never kept from', async () => {
    expect(
      await checks({ held: ['administrator', 'sharing.link'], refusedItems: [ITEM] }).reaches(
        'account-1',
        ITEM,
      ),
    ).toBe(true);
  });
});
