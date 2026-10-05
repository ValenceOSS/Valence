import { z } from 'zod';

const AllowedAppsSchema = z.object({
  desktop: z.boolean(),
  phone: z.boolean(),
  tv: z.boolean(),
});

type AllowedApps = z.infer<typeof AllowedAppsSchema>;

const EVERY_APP_ALLOWED: AllowedApps = { desktop: true, phone: true, tv: true };

export type { AllowedApps };

export { AllowedAppsSchema, EVERY_APP_ALLOWED };
