import {
  SUBTITLE_DEFAULTS,
  SubtitleSettingsSchema,
} from '@ValenceContracts/schemas/SubtitleSettings';
import { LibraryLocksSchema } from '@ValenceContracts/schemas/LibraryLock';
import { BrandSettingsSchema } from '@ValenceContracts/schemas/Brand';
import { StreamLimitsSchema } from '@ValenceContracts/schemas/StreamLimit';
import { z } from 'zod';
import { AllowedAppsSchema, EVERY_APP_ALLOWED } from '@ValenceContracts/schemas/AllowedApps';
import { PreviewQualitySchema } from '@ValenceContracts/schemas/PreviewQuality';
import { RoundnessSchema } from '@ValenceContracts/schemas/Roundness';
import { DEFAULT_RELEASE_TYPES, ReleaseTypesSchema } from '@ValenceContracts/schemas/MediaRequest';
import {
  PRE_TRANSCODING_DEFAULTS,
  PreTranscodingSettingsSchema,
} from '@ValenceContracts/schemas/PreTranscoding';
import { SEERR_DEFAULTS, SeerrSettingsSchema } from '@ValenceContracts/schemas/SeerrLink';
import { EMAIL_DEFAULTS, EmailSettingsSchema } from '@ValenceContracts/schemas/EmailSettings';
import { WayInMessageSchema } from '@ValenceContracts/schemas/WayInMessage';
import { AnnouncementSchema } from '@ValenceContracts/schemas/Announcement';
import { LINK_SETTINGS_DEFAULTS, LinkSettingsSchema } from '@ValenceServer/linking/LinkSettings';
import { withPreTranscodeTargets } from '@ValenceServer/settings/withPreTranscodeTargets';

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
  usesShortSegments: z.boolean().default(true),
  fetchesMusicDetails: z.boolean().default(false),
  audioDbKey: z.string().default(''),
  omdbKey: z.string().default(''),
  ownerAccountId: z.string().default(''),
  splashscreenFile: z.string().nullable().default(null),
  libraryLocks: LibraryLocksSchema.default({}),
  brandLogoFile: z.string().nullable().default(null),
  brand: BrandSettingsSchema.default({ name: null, accent: null, description: null }),
  wayInMessage: WayInMessageSchema.nullable().default(null),
  announcement: AnnouncementSchema.nullable().default(null),
  streamLimits: StreamLimitsSchema.default({ accounts: {}, roles: {} }),
  reencodesAwaitingReviewCap: z.number().int().positive().max(50).default(5),
  requestReleaseTypes: ReleaseTypesSchema.default([...DEFAULT_RELEASE_TYPES]),
  controlsConnectedApps: z.boolean().default(false),
  roundness: RoundnessSchema.default('default'),
  keepsDownloadsForDays: z.number().int().nonnegative().max(3650).default(14),
  preTranscoding: z
    .preprocess(withPreTranscodeTargets, PreTranscodingSettingsSchema)
    .default(PRE_TRANSCODING_DEFAULTS),
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
