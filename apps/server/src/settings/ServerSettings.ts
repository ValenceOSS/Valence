import { SUBTITLE_DEFAULTS, SubtitleSettingsSchema } from '@ValenceContracts/schemas/SubtitleSettings';
import { z } from 'zod';
import { AllowedAppsSchema, EVERY_APP_ALLOWED } from '@ValenceContracts/schemas/AllowedApps';
import { PreviewQualitySchema } from '@ValenceContracts/schemas/PreviewQuality';
import { RoundnessSchema } from '@ValenceContracts/schemas/Roundness';
import { ReleaseTypesSchema } from '@ValenceContracts/schemas/MediaRequest';
import {
  PRE_TRANSCODING_DEFAULTS,
  PreTranscodingSettingsSchema,
} from '@ValenceContracts/schemas/PreTranscoding';
import { SEERR_DEFAULTS, SeerrSettingsSchema } from '@ValenceContracts/schemas/SeerrLink';
import { EMAIL_DEFAULTS, EmailSettingsSchema } from '@ValenceContracts/schemas/EmailSettings';
import { LINK_SETTINGS_DEFAULTS, LinkSettingsSchema } from '@ValenceServer/linking/LinkSettings';

const ServerSettingsSchema = z.object({
  trustedOrigins: z.array(z.string().url()),
  cookieSecure: z.boolean(),
  setupCompletedAt: z.string().datetime().nullable(),
  setupFlow: z.enum(['open', 'finished']).default('finished'),
  catalogueApiKey: z.string().default(''),
  hardwareAccel: z.string().default(''),
  previewQuality: PreviewQualitySchema.default('high'),
  showsProfilesBeforeSignIn: z.boolean().default(true),
  allowedApps: AllowedAppsSchema.default(EVERY_APP_ALLOWED),
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
  omdbKey: z.string().default(''),
  ownerAccountId: z.string().default(''),
  splashscreenFile: z.string().nullable().default(null),
  reencodesAwaitingReviewCap: z.number().int().positive().max(50).default(5),
  requestReleaseTypes: ReleaseTypesSchema.default(['album']),
  roundness: RoundnessSchema.default('default'),
  keepsDownloadsForDays: z.number().int().nonnegative().max(3650).default(14),
  preTranscoding: PreTranscodingSettingsSchema.default(PRE_TRANSCODING_DEFAULTS),
  seerr: SeerrSettingsSchema.default(SEERR_DEFAULTS),
  email: EmailSettingsSchema.default(EMAIL_DEFAULTS),
  subtitles: SubtitleSettingsSchema.default(SUBTITLE_DEFAULTS),
  linking: LinkSettingsSchema.default(LINK_SETTINGS_DEFAULTS),
});

type ServerSettings = z.infer<typeof ServerSettingsSchema>;

type SettingsStore = {
  read: () => Promise<ServerSettings>;
  write: (patch: Partial<ServerSettings>) => Promise<ServerSettings>;
};

const SETTINGS_KEY = 'server';

export type { ServerSettings, SettingsStore };

export { ServerSettingsSchema, SETTINGS_KEY };
