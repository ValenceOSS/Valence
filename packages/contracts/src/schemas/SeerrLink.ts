import { z } from 'zod';

const SEERR_RADARR_PATH = '/arr/radarr';

const SEERR_SONARR_PATH = '/arr/sonarr';

const SeerrSettingsSchema = z.object({
  isEnabled: z.boolean().default(false),
  apiKey: z.string().default(''),
  accountId: z.string().default(''),
});

const SEERR_DEFAULTS = SeerrSettingsSchema.parse({});

const SeerrLinkSchema = z.object({
  isEnabled: z.boolean(),
  apiKey: z.string(),
  accountId: z.string(),
  isRequestingOn: z.boolean(),
  radarrPath: z.string(),
  sonarrPath: z.string(),
});

const SeerrLinkChangeSchema = z.object({
  isEnabled: z.boolean(),
  accountId: z.string().max(200),
});

type SeerrSettings = z.infer<typeof SeerrSettingsSchema>;
type SeerrLink = z.infer<typeof SeerrLinkSchema>;
type SeerrLinkChange = z.infer<typeof SeerrLinkChangeSchema>;

export type { SeerrLink, SeerrLinkChange, SeerrSettings };

export {
  SEERR_DEFAULTS,
  SEERR_RADARR_PATH,
  SEERR_SONARR_PATH,
  SeerrLinkChangeSchema,
  SeerrLinkSchema,
  SeerrSettingsSchema,
};
