import { z } from 'zod';
import { LibraryKindSchema } from './Library';
import { QualityStepIdSchema } from './QualityStep';

const FEDERATION_ACTIONS = [
  'libraries',
  'activity',
  'catalogue',
  'media',
  'parties',
  'requests',
] as const;

const FEDERATION_OUTCOMES = ['allowed', 'notShared', 'aboveTheAge', 'blocked', 'tooMany'] as const;

const FederationActionSchema = z.enum(FEDERATION_ACTIONS);

const FederationOutcomeSchema = z.enum(FEDERATION_OUTCOMES);

const LinkSharingSchema = z.object({
  libraryIds: z.array(z.string().uuid()),
  maximumAge: z.number().int().min(0).max(21).nullable(),
  allowsUnrated: z.boolean(),
  namesTravel: z.boolean(),
  showsActivity: z.boolean(),
  mostStreams: z.number().int().positive().max(50).nullable(),
  qualityCeiling: QualityStepIdSchema.nullable(),
  takesTheirControls: z.boolean(),
  allowsDownloads: z.boolean(),
  takesTheirRequests: z.boolean(),
  playsDirect: z.boolean(),
});

const LinkSharingChangeSchema = z.object({
  libraryIds: z.array(z.string().uuid()).max(500).optional(),
  maximumAge: z.number().int().min(0).max(21).nullable().optional(),
  allowsUnrated: z.boolean().optional(),
  namesTravel: z.boolean().optional(),
  showsActivity: z.boolean().optional(),
  mostStreams: z.number().int().positive().max(50).nullable().optional(),
  qualityCeiling: QualityStepIdSchema.nullable().optional(),
  takesTheirControls: z.boolean().optional(),
  allowsDownloads: z.boolean().optional(),
  takesTheirRequests: z.boolean().optional(),
  playsDirect: z.boolean().optional(),
});

const SharedLibrarySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  kind: LibraryKindSchema,
});

const SharedLibrariesSchema = z.object({
  libraries: z.array(SharedLibrarySchema).max(500),
  allowsDownloads: z.boolean().default(false),
  takesRequests: z.boolean().default(false),
});

const RemotePersonSchema = z.object({
  id: z.string().uuid(),
  name: z.string().nullable(),
  firstSeenAt: z.string().datetime(),
  lastSeenAt: z.string().datetime(),
  blockedAt: z.string().datetime().nullable(),
});

const RemotePeopleSchema = z.object({ people: z.array(RemotePersonSchema) });

const FederationActivitySchema = z.object({
  id: z.string().uuid(),
  at: z.string().datetime(),
  personId: z.string().uuid().nullable(),
  personName: z.string().max(100).nullable(),
  action: FederationActionSchema,
  mediaTitle: z.string().max(300).nullable(),
  outcome: FederationOutcomeSchema,
  count: z.number().int().positive(),
});

const FederationActivityListSchema = z.object({
  entries: z.array(FederationActivitySchema).max(500),
});

const TheirLibrariesSchema = z.object({
  isReachable: z.boolean(),
  libraries: z.array(SharedLibrarySchema),
});

const TheirActivitySchema = z.object({
  standing: z.enum(['shown', 'notShown', 'unreachable']),
  entries: z.array(FederationActivitySchema),
});

const LinkedServerFaceSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  colour: z.string(),
  isReachable: z.boolean(),
  takesRequests: z.boolean().default(false),
});

const LinkedServerFacesSchema = z.object({ servers: z.array(LinkedServerFaceSchema) });

const AskableElsewhereSchema = z.object({
  people: z.array(z.object({ id: z.string().min(1), name: z.string() })),
});

const AskedAlongSchema = z.object({
  pseudonym: z.string().min(1).max(64),
  partyId: z.string().min(1).max(100),
  mediaId: z.string().uuid(),
  byName: z.string().max(100),
});

type LinkedServerFace = z.infer<typeof LinkedServerFaceSchema>;
type AskedAlong = z.infer<typeof AskedAlongSchema>;
type FederationAction = z.infer<typeof FederationActionSchema>;
type FederationOutcome = z.infer<typeof FederationOutcomeSchema>;
type LinkSharing = z.infer<typeof LinkSharingSchema>;
type LinkSharingChange = z.infer<typeof LinkSharingChangeSchema>;
type SharedLibrary = z.infer<typeof SharedLibrarySchema>;
type RemotePerson = z.infer<typeof RemotePersonSchema>;
type FederationActivity = z.infer<typeof FederationActivitySchema>;
type TheirLibraries = z.infer<typeof TheirLibrariesSchema>;
type TheirActivity = z.infer<typeof TheirActivitySchema>;

export type {
  AskedAlong,
  LinkedServerFace,
  FederationAction,
  FederationActivity,
  FederationOutcome,
  LinkSharing,
  LinkSharingChange,
  RemotePerson,
  SharedLibrary,
  TheirActivity,
  TheirLibraries,
};

export {
  FEDERATION_ACTIONS,
  FEDERATION_OUTCOMES,
  FederationActionSchema,
  FederationActivityListSchema,
  FederationActivitySchema,
  FederationOutcomeSchema,
  LinkSharingChangeSchema,
  LinkSharingSchema,
  LinkedServerFaceSchema,
  LinkedServerFacesSchema,
  AskableElsewhereSchema,
  AskedAlongSchema,
  RemotePeopleSchema,
  RemotePersonSchema,
  SharedLibrariesSchema,
  SharedLibrarySchema,
  TheirActivitySchema,
  TheirLibrariesSchema,
};
