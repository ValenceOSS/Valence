import { z } from 'zod';
import { PreviewQualitySchema } from '@ValenceContracts/schemas/PreviewQuality';

const ServerSettingsSchema = z.object({
  trustedOrigins: z.array(z.string().url()),
  cookieSecure: z.boolean(),
  setupCompletedAt: z.string().datetime().nullable(),
  catalogueApiKey: z.string().default(''),
  hardwareAccel: z.string().default(''),
  previewQuality: PreviewQualitySchema.default('high'),
  showsProfilesBeforeSignIn: z.boolean().default(true),
  seededJobTriggerKinds: z.array(z.string()).default([]),
  seededRoleNames: z.array(z.string()).default([]),
  pushPublicKey: z.string().default(''),
  pushPrivateKey: z.string().default(''),
  mediaDigestReadTo: z.string().datetime().nullable().default(null),
  jobsTimezone: z.string().default(''),
  certificationRegion: z.string().length(2).toUpperCase().default('GB'),
  fetchesCatalogueTrailers: z.boolean().default(false),
  fetchesMusicDetails: z.boolean().default(false),
  audioDbKey: z.string().default(''),
  ownerAccountId: z.string().default(''),
  splashscreenFile: z.string().nullable().default(null),
});

type ServerSettings = z.infer<typeof ServerSettingsSchema>;

type SettingsStore = {
  read: () => Promise<ServerSettings>;
  write: (patch: Partial<ServerSettings>) => Promise<ServerSettings>;
};

const SETTINGS_KEY = 'server';

export type { ServerSettings, SettingsStore };

export { ServerSettingsSchema, SETTINGS_KEY };
