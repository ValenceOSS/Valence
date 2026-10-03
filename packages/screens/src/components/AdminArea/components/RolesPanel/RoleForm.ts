import type { z } from 'zod';
import type { RoleFormSchema } from './RoleFormSchema';

type RoleForm = z.input<typeof RoleFormSchema>;

export type { RoleForm };
