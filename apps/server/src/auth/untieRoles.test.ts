import { describe, expect, it } from 'vitest';
import { createMemoryPermissionService } from './createMemoryPermissionService';
import { untieRoles } from './untieRoles';

const ROLE = { color: null, permissions: [] };

describe('untieRoles', () => {
  it('gives tied roles ranks of their own, in the order they are listed', async () => {
    const permissions = createMemoryPermissionService({
      roles: [],
      assignments: {},
      overrides: {},
    });

    await permissions.createRole({ ...ROLE, name: 'Top', position: 100 });
    await permissions.createRole({ ...ROLE, name: 'Kids', position: 50 });
    await permissions.createRole({ ...ROLE, name: 'Family', position: 50 });

    expect(await untieRoles(permissions)).toBe(true);
    expect((await permissions.listRoles()).map((role) => [role.name, role.position])).toEqual([
      ['Top', 2],
      ['Family', 1],
      ['Kids', 0],
    ]);
  });

  it('leaves roles that are already apart where they are', async () => {
    const permissions = createMemoryPermissionService({
      roles: [],
      assignments: {},
      overrides: {},
    });

    await permissions.createRole({ ...ROLE, name: 'Top', position: 100 });
    await permissions.createRole({ ...ROLE, name: 'Kids', position: 50 });

    expect(await untieRoles(permissions)).toBe(false);
    expect((await permissions.listRoles()).map((role) => role.position)).toEqual([100, 50]);
  });
});
