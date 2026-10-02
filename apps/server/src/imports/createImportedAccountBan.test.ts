import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { user } from '#dialect/Schema';
import { aHousehold } from '@ValenceServer/testing/aHousehold';
import { createImportedAccountBan } from './createImportedAccountBan';

describe('createImportedAccountBan', { timeout: 60_000 }, () => {
  it('bans an account, saying why, and says when there is no such account', async () => {
    const { db } = await aHousehold();
    const ban = createImportedAccountBan(db);

    expect(await ban('account', 'Disabled on Den before it was brought across.')).toBe(true);
    expect(await ban('nobody', 'x')).toBe(false);

    const [row] = await db.select().from(user).where(eq(user.id, 'account'));

    expect(row).toMatchObject({
      banned: true,
      banReason: 'Disabled on Den before it was brought across.',
    });
  });
});
