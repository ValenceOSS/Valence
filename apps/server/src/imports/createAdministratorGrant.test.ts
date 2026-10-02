import { eq } from 'drizzle-orm';
import { describe, expect, it, vi } from 'vitest';
import { ADMINISTRATOR_ROLE_NAME } from '@ValenceCore/functions/defaultRoles';
import { user } from '#dialect/Schema';
import { aHousehold } from '@ValenceServer/testing/aHousehold';
import { createAdministratorGrant } from './createAdministratorGrant';

/**
 * Roles as the permission service lists them.
 *
 * @param names - The roles there are.
 * @returns The listing.
 */
const rolesNamed = (names: string[]) =>
  names.map((name, index) => ({
    id: `role-${index.toString()}`,
    name,
    position: index,
    permissions: [],
    color: null,
  }));

describe('createAdministratorGrant', { timeout: 60_000 }, () => {
  it('gives the Administrator role and the flag sign-in reads', async () => {
    const { db } = await aHousehold();
    const assignRole = vi.fn(() => Promise.resolve());
    const grant = createAdministratorGrant(db, {
      listRoles: () => Promise.resolve(rolesNamed(['Viewer', ADMINISTRATOR_ROLE_NAME])),
      assignRole,
    });

    await grant('account');

    const [row] = await db.select({ role: user.role }).from(user).where(eq(user.id, 'account'));

    expect(row?.role).toBe('admin');
    expect(assignRole).toHaveBeenCalledWith('account', 'role-1');
  });

  it('still sets the flag where there is no Administrator role to give', async () => {
    const { db } = await aHousehold();
    const assignRole = vi.fn(() => Promise.resolve());

    await createAdministratorGrant(db, { listRoles: () => Promise.resolve([]), assignRole })(
      'account',
    );

    expect(assignRole).not.toHaveBeenCalled();
  });
});
