import { z } from 'zod';
import type { GrantedPermission } from '@ValenceContracts/schemas/Permission';
import { say } from '@ValenceI18n/say';

const RoleFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: say('screens.adminArea.rolesPanel.giveTheRoleAName') }),
  position: z
    .string()
    .trim()
    .regex(/^\d+$/, { error: say('screens.adminArea.rolesPanel.rankIsAWholeNumber') })
    .transform(Number),
  color: z.string().nullable(),
  permissions: z.array(z.custom<GrantedPermission>()),
});

export { RoleFormSchema };
