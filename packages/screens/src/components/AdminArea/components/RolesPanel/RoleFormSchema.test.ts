import { describe, expect, it } from 'vitest';
import { A_NEW_ROLE } from './A_NEW_ROLE';
import { RoleFormSchema } from './RoleFormSchema';

describe('RoleFormSchema', () => {
  it('reads a role, its rank as a number', () => {
    expect(RoleFormSchema.parse({ ...A_NEW_ROLE, name: ' Housemate ', position: '250' })).toEqual({
      name: 'Housemate',
      position: 250,
      color: null,
      permissions: [],
    });
  });

  it('needs a name', () => {
    expect(RoleFormSchema.safeParse(A_NEW_ROLE).error?.issues[0]?.message).toBe(
      'Give the role a name.',
    );
  });

  it('needs a rank that is a whole number from 0 up', () => {
    for (const position of ['', '-1', '2.5', 'top']) {
      expect(
        RoleFormSchema.safeParse({ ...A_NEW_ROLE, name: 'Housemate', position }).error?.issues[0]
          ?.message,
      ).toBe('A rank is a whole number from 0 up.');
    }
  });
});
