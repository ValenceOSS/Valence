import { describe, expect, it, vi } from 'vitest';
import { isANarrowedKey } from './isANarrowedKey';
import type { Permission } from '@ValenceContracts/schemas/Permission';

const MEDIA_ONLY: ReadonlySet<Permission> = new Set<Permission>(['streaming.view']);

describe('isANarrowedKey', () => {
  it('says a key held to some permissions is one', async () => {
    expect(await isANarrowedKey(true, () => Promise.resolve(MEDIA_ONLY))).toBe(true);
  });

  it('says a key holding everything its account does is not', async () => {
    expect(await isANarrowedKey(true, () => Promise.resolve(null))).toBe(false);
  });

  it('does not ask about a key for a request signed in without one', async () => {
    const restriction = vi.fn(() => Promise.resolve(MEDIA_ONLY));

    expect(await isANarrowedKey(false, restriction)).toBe(false);
    expect(restriction).not.toHaveBeenCalled();
  });
});
