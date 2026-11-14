import { z } from 'zod';

const AppIconSchema = z.enum(['system', 'light', 'dark']).catch('system');

type AppIcon = z.infer<typeof AppIconSchema>;

export { AppIconSchema };
export type { AppIcon };
