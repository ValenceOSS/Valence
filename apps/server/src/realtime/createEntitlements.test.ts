import { describe, expect, it, vi } from 'vitest';
import { createEntitlements } from './createEntitlements';
import type { Permission } from '@ValenceContracts/schemas/Permission';

const createReader = (permissions: Permission[]) => {
  let calls = 0;
  let given = permissions;

  return {
    calls: () => calls,
    give: (next: Permission[]) => {
      given = next;
    },
    resolve: (): Promise<ReadonlySet<Permission>> => {
      calls += 1;

      return Promise.resolve(new Set(given));
    },
  };
};

describe('createEntitlements', () => {
  it('reads permissions for an account it has not seen', async () => {
    const reader = createReader(['server.logs']);
    const entitlements = createEntitlements({ resolve: reader.resolve, now: () => 0, ttlMs: 5000 });

    expect(await entitlements.of('account', null)).toStrictEqual(new Set(['server.logs']));
  });

  it('does not read again within the window, so a flood costs one query', async () => {
    const reader = createReader(['server.logs']);
    const entitlements = createEntitlements({ resolve: reader.resolve, now: () => 0, ttlMs: 5000 });

    for (let index = 0; index < 4000; index += 1) {
      await entitlements.of('account', null);
    }

    expect(reader.calls()).toBe(1);
  });

  it('reads again once the window has passed', async () => {
    const reader = createReader(['server.logs']);
    let clock = 0;
    const entitlements = createEntitlements({
      resolve: reader.resolve,
      now: () => clock,
      ttlMs: 5000,
    });

    await entitlements.of('account', null);
    clock = 5000;
    await entitlements.of('account', null);

    expect(reader.calls()).toBe(2);
  });

  it('keeps accounts apart rather than answering one with another', async () => {
    const reader = createReader(['server.logs']);
    const entitlements = createEntitlements({ resolve: reader.resolve, now: () => 0, ttlMs: 5000 });

    await entitlements.of('one', null);
    await entitlements.of('two', null);

    expect(reader.calls()).toBe(2);
  });

  it('picks up a revoked permission immediately when told to forget', async () => {
    const reader = createReader(['server.logs']);
    const entitlements = createEntitlements({ resolve: reader.resolve, now: () => 0, ttlMs: 5000 });

    await entitlements.of('account', null);
    reader.give([]);
    entitlements.forget('account');

    expect(await entitlements.of('account', null)).toStrictEqual(new Set());
  });

  it('forgets every account when a role everyone holds changes', async () => {
    const reader = createReader(['server.logs']);
    const entitlements = createEntitlements({ resolve: reader.resolve, now: () => 0, ttlMs: 5000 });

    await entitlements.of('one', null);
    await entitlements.of('two', null);
    reader.give([]);
    entitlements.forgetAll();

    expect(await entitlements.of('one', null)).toStrictEqual(new Set());
    expect(await entitlements.of('two', null)).toStrictEqual(new Set());
  });

  it('reads what a profile may do with the profile named', async () => {
    const resolve = vi
      .fn<(accountId: string, profileId: string | null) => Promise<ReadonlySet<Permission>>>()
      .mockResolvedValue(new Set());
    const entitlements = createEntitlements({ resolve, now: () => 0, ttlMs: 5000 });

    await entitlements.of('account', 'kid');

    expect(resolve).toHaveBeenCalledWith('account', 'kid');
  });

  it('keeps profiles on one account apart, so a child is not answered with a parent', async () => {
    const entitlements = createEntitlements({
      resolve: (accountId, profileId) =>
        Promise.resolve(
          new Set<Permission>(
            accountId === 'account' && profileId === 'parent' ? ['server.logs'] : [],
          ),
        ),
      now: () => 0,
      ttlMs: 5000,
    });

    await entitlements.of('account', 'parent');

    expect(await entitlements.of('account', 'kid')).toStrictEqual(new Set());
    expect(await entitlements.of('account', null)).toStrictEqual(new Set());
  });

  it('remembers each profile’s reading on its own', async () => {
    const reader = createReader(['server.logs']);
    const entitlements = createEntitlements({ resolve: reader.resolve, now: () => 0, ttlMs: 5000 });

    await entitlements.of('account', 'kid');
    await entitlements.of('account', 'kid');
    await entitlements.of('account', 'parent');

    expect(reader.calls()).toBe(2);
  });

  it('forgets every profile on an account at once, and no other account’s', async () => {
    const reader = createReader(['server.logs']);
    const entitlements = createEntitlements({ resolve: reader.resolve, now: () => 0, ttlMs: 5000 });

    await entitlements.of('account', 'kid');
    await entitlements.of('account', 'parent');
    await entitlements.of('account', null);
    await entitlements.of('other', 'kid');
    reader.give([]);
    entitlements.forget('account');

    expect(await entitlements.of('account', 'kid')).toStrictEqual(new Set());
    expect(await entitlements.of('account', 'parent')).toStrictEqual(new Set());
    expect(await entitlements.of('account', null)).toStrictEqual(new Set());
    expect(await entitlements.of('other', 'kid')).toStrictEqual(new Set(['server.logs']));
  });

  it('does not forget an account whose name merely starts with another’s', async () => {
    const reader = createReader(['server.logs']);
    const entitlements = createEntitlements({ resolve: reader.resolve, now: () => 0, ttlMs: 5000 });

    await entitlements.of('account-2', 'kid');
    reader.give([]);
    entitlements.forget('account');

    expect(await entitlements.of('account-2', 'kid')).toStrictEqual(new Set(['server.logs']));
  });
});
