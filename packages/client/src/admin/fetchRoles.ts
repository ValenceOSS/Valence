import { readFromServer } from '@ValenceClient/query/readFromServer';
import { readRefusal } from './readRefusal';
import type { Refusal } from './readRefusal';
import { z } from 'zod';
import {
  GrantedPermissionsReadSchema,
  PermissionOrRetiredSchema,
  PermissionsReadSchema,
} from '@ValenceContracts/schemas/Permission';
import type { Permission, PermissionGrant, Role } from '@ValenceContracts/schemas/Permission';
import { say } from '@ValenceI18n/say';

const RoleSchema = z.object({
  id: z.string(),
  name: z.string(),
  position: z.number(),
  permissions: GrantedPermissionsReadSchema,
  color: z.string().nullable(),
});

const GrantSchema = z.object({
  permission: z.string(),
  effect: z.enum(['allow', 'deny']),
});

const AccountPermissionsSchema = z.object({
  roles: z.array(RoleSchema),
  overrides: z.array(GrantSchema).transform((grants) =>
    grants.flatMap((grant) => {
      const known = PermissionOrRetiredSchema.safeParse(grant.permission);

      return known.success ? [{ permission: known.data, effect: grant.effect }] : [];
    }),
  ),
  effective: GrantedPermissionsReadSchema,
});

type AccountPermissions = z.infer<typeof AccountPermissionsSchema>;

const RoleListSchema = z.object({
  roles: z.array(RoleSchema),
  outOfReach: z.array(z.string()).default([]),
});

type RoleList = z.infer<typeof RoleListSchema>;

/**
 * Reads every permission this server knows how to grant, which is what a role editor offers rather
 * than a list written down in the page.
 *
 * @returns The permissions, or none where the request failed.
 */
const fetchPermissionCatalogue = async (): Promise<Permission[]> => {
  return (
    await readFromServer('/api/admin/permissions', z.object({ permissions: PermissionsReadSchema }))
  ).permissions;
};

/**
 * Reads the roles on this server, highest first, and which of them rank at or above the reader.
 *
 * @returns The roles, and those out of the reader's reach.
 */
const fetchRoles = async (): Promise<RoleList> =>
  readFromServer('/api/admin/roles', RoleListSchema);

/**
 * Puts the roles in a new order, highest first, which is what decides who may manage whom.
 *
 * @param ids - Every role, highest first.
 * @returns Any refusal from the server.
 */
const orderRoles = async (ids: readonly string[]): Promise<Refusal> => {
  const response = await fetch('/api/admin/roles/order', {
    method: 'PUT',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ids }),
  }).catch(() => null);

  return response === null
    ? { message: say('common.theServerCouldNotBeReached') }
    : readRefusal(response);
};

/**
 * Adds a role beneath every other one: what it is called and what it grants. Granting it to anybody
 * is a separate step, so a role can be got right before it applies to a single person.
 *
 * @param role - The role to add.
 * @returns The role as it was made, or why it was not.
 */
const createRole = async (
  role: Omit<Role, 'id' | 'position'>,
): Promise<{ role: Role | null; refusal: Refusal }> => {
  const response = await fetch('/api/admin/roles', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(role),
  }).catch(() => null);

  if (response === null) {
    return { role: null, refusal: { message: say('common.theServerCouldNotBeReached') } };
  }

  if (!response.ok) {
    return { role: null, refusal: await readRefusal(response) };
  }

  const made = RoleSchema.safeParse(await response.json().catch(() => null));

  return made.success
    ? { role: made.data, refusal: null }
    : { role: null, refusal: { message: say('client.admin.readRefusal.thatCouldNotBeDoneTry') } };
};

/**
 * Changes a role. Takes only what changed rather than the whole role, so two administrators editing
 * different parts of one role do not overwrite each other.
 *
 * @param id - The role to change.
 * @param changes - What to change about it.
 * @returns Any refusal from the server.
 */
const updateRole = async (id: string, changes: Partial<Omit<Role, 'id'>>): Promise<Refusal> => {
  const response = await fetch(`/api/admin/roles/${id}`, {
    method: 'PATCH',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(changes),
  }).catch(() => null);

  return response === null
    ? { message: say('common.theServerCouldNotBeReached') }
    : readRefusal(response);
};

/**
 * Removes a role, and with it whatever it granted to everyone holding it. Anything set against a
 * person directly is untouched, so somebody may keep a permission the role also happened to give.
 *
 * @param id - The role to remove.
 * @returns Any refusal from the server.
 */
const deleteRole = async (id: string): Promise<Refusal> => {
  const response = await fetch(`/api/admin/roles/${id}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  }).catch(() => null);

  return response === null
    ? { message: say('common.theServerCouldNotBeReached') }
    : readRefusal(response);
};

/**
 * Reads what one account may do: the roles it holds, the grants set against it directly, and what
 * the two come to together.
 *
 * @param userId - The account being asked about.
 * @returns What it may do, or null where the request failed.
 */
const fetchAccountPermissions = async (userId: string): Promise<AccountPermissions> => {
  return readFromServer(`/api/admin/accounts/${userId}/roles`, AccountPermissionsSchema);
};

/**
 * Gives an account a role, adding what it grants to whatever the account already had rather than
 * replacing it — an account may hold several.
 *
 * @param userId - The account.
 * @param roleId - The role to give it.
 * @returns Any refusal from the server.
 */
const assignRole = async (userId: string, roleId: string): Promise<Refusal> => {
  const response = await fetch(`/api/admin/accounts/${userId}/roles/${roleId}`, {
    method: 'PUT',
    credentials: 'same-origin',
  }).catch(() => null);

  return response === null
    ? { message: say('common.theServerCouldNotBeReached') }
    : readRefusal(response);
};

/**
 * Takes a role away from an account, leaving any grants set against it directly.
 *
 * @param userId - The account.
 * @param roleId - The role to take away.
 * @returns Any refusal from the server.
 */
const removeRole = async (userId: string, roleId: string): Promise<Refusal> => {
  const response = await fetch(`/api/admin/accounts/${userId}/roles/${roleId}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  }).catch(() => null);

  return response === null
    ? { message: say('common.theServerCouldNotBeReached') }
    : readRefusal(response);
};

/**
 * Sets one permission against an account directly, allowing or denying it whatever its roles say.
 * This is how one person is given something without a role being made for them, or denied something
 * their role otherwise grants.
 *
 * @param userId - The account.
 * @param grant - The permission, and whether to allow or deny it.
 * @returns Any refusal from the server.
 */
const setOverride = async (userId: string, grant: PermissionGrant): Promise<Refusal> => {
  const response = await fetch(`/api/admin/accounts/${userId}/overrides`, {
    method: 'PUT',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(grant),
  }).catch(() => null);

  return response === null
    ? { message: say('common.theServerCouldNotBeReached') }
    : readRefusal(response);
};

/**
 * Clears a permission set against an account directly, putting it back to whatever its roles say.
 *
 * @param userId - The account.
 * @param permission - The permission to stop overriding.
 * @returns Any refusal from the server.
 */
const clearOverride = async (userId: string, permission: Permission): Promise<Refusal> => {
  const response = await fetch(`/api/admin/accounts/${userId}/overrides/${permission}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  }).catch(() => null);

  return response === null
    ? { message: say('common.theServerCouldNotBeReached') }
    : readRefusal(response);
};

export {
  fetchPermissionCatalogue,
  fetchRoles,
  orderRoles,
  createRole,
  updateRole,
  deleteRole,
  fetchAccountPermissions,
  assignRole,
  removeRole,
  setOverride,
  clearOverride,
};

export type { AccountPermissions, Refusal, RoleList };
