import { eq } from 'drizzle-orm';
import { ADMINISTRATOR_ROLE_NAME } from '@ValenceCore/functions/defaultRoles';
import { user } from '#dialect/Schema';
import type { AnyValenceDatabase } from '#dialect/AnyValenceDatabase';
import type { PermissionService } from '@ValenceServer/auth/PermissionService';

/**
 * Builds what makes an imported account an administrator, the same way setup makes the first one:
 * the Administrator role, and the flag the sign-in layer reads.
 *
 * @param db - The database.
 * @param permissions - The roles.
 * @returns What gives an account administration.
 */
const createAdministratorGrant =
  (db: AnyValenceDatabase, permissions: Pick<PermissionService, 'listRoles' | 'assignRole'>) =>
  async (userId: string): Promise<void> => {
    await db.update(user).set({ role: 'admin' }).where(eq(user.id, userId));

    const administrator = (await permissions.listRoles()).find(
      (role) => role.name === ADMINISTRATOR_ROLE_NAME,
    );

    if (administrator !== undefined) {
      await permissions.assignRole(userId, administrator.id);
    }
  };

export { createAdministratorGrant };
