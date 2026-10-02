import { z } from 'zod';
import { ProfileColourSchema } from './ViewerProfile';

const LINK_PROTOCOL = 'valence-link/1';

const LINK_INVITE_PREFIX = 'valence-link:';

const LINK_STATES = ['awaitingThem', 'awaitingUs', 'linked', 'refused', 'unlinkedByThem'] as const;

const LinkStateSchema = z.enum(LINK_STATES);

const LinkAddressSchema = z
  .string()
  .url()
  .refine((address) => /^https?:\/\//u.test(address))
  .transform((address) => address.replace(/\/+$/u, ''));

const PublicServerKeySchema = z.object({
  kty: z.literal('OKP'),
  crv: z.literal('Ed25519'),
  x: z.string().min(1),
});

const ServerIdentitySchema = z.object({
  name: z.string().min(1).max(60),
  colour: ProfileColourSchema,
  protocols: z.array(z.string()),
  publicKey: PublicServerKeySchema,
  fingerprint: z.string().min(1),
});

const LinkIdentitySchema = ServerIdentitySchema.extend({
  address: LinkAddressSchema,
});

const LinkIdentityChangeSchema = z.object({
  name: z.string().trim().min(1).max(60).optional(),
  colour: ProfileColourSchema.optional(),
  address: LinkAddressSchema.optional(),
});

const LinkInviteSchema = z.object({
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
});

const MadeLinkInviteSchema = LinkInviteSchema.extend({
  invite: z.string().startsWith(LINK_INVITE_PREFIX),
});

const InviteContentsSchema = z.object({
  v: z.literal(1),
  address: LinkAddressSchema,
  code: z.string().min(16).max(200),
  fingerprint: z.string().min(1),
});

const LinkedServerSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  colour: ProfileColourSchema,
  address: LinkAddressSchema,
  fingerprint: z.string(),
  state: LinkStateSchema,
  createdAt: z.string().datetime(),
  linkedAt: z.string().datetime().nullable(),
  lastSeenAt: z.string().datetime().nullable(),
});

const LinkingSchema = z.object({
  identity: LinkIdentitySchema,
  invites: z.array(LinkInviteSchema),
  servers: z.array(LinkedServerSchema),
});

const UseLinkInviteSchema = z.object({
  invite: z.string().trim().startsWith(LINK_INVITE_PREFIX).max(2000),
});

const PairRequestSchema = z.object({
  code: z.string().min(16).max(200),
  server: z.object({
    name: z.string().min(1).max(60),
    colour: ProfileColourSchema,
    address: LinkAddressSchema,
    publicKey: PublicServerKeySchema,
  }),
});

const PairAnswerSchema = z.object({
  pairingId: z.string().uuid(),
  state: LinkStateSchema,
});

type LinkState = z.infer<typeof LinkStateSchema>;
type PublicServerKey = z.infer<typeof PublicServerKeySchema>;
type ServerIdentity = z.infer<typeof ServerIdentitySchema>;
type LinkIdentity = z.infer<typeof LinkIdentitySchema>;
type LinkIdentityChange = z.infer<typeof LinkIdentityChangeSchema>;
type LinkInvite = z.infer<typeof LinkInviteSchema>;
type MadeLinkInvite = z.infer<typeof MadeLinkInviteSchema>;
type InviteContents = z.infer<typeof InviteContentsSchema>;
type LinkedServer = z.infer<typeof LinkedServerSchema>;
type Linking = z.infer<typeof LinkingSchema>;
type PairRequest = z.infer<typeof PairRequestSchema>;
type PairAnswer = z.infer<typeof PairAnswerSchema>;

export type {
  InviteContents,
  LinkIdentity,
  LinkIdentityChange,
  LinkInvite,
  LinkState,
  LinkedServer,
  Linking,
  MadeLinkInvite,
  PairAnswer,
  PairRequest,
  PublicServerKey,
  ServerIdentity,
};

export {
  InviteContentsSchema,
  LINK_INVITE_PREFIX,
  LINK_PROTOCOL,
  LINK_STATES,
  LinkAddressSchema,
  LinkIdentityChangeSchema,
  LinkIdentitySchema,
  LinkInviteSchema,
  LinkStateSchema,
  LinkedServerSchema,
  LinkingSchema,
  MadeLinkInviteSchema,
  PairAnswerSchema,
  PairRequestSchema,
  PublicServerKeySchema,
  ServerIdentitySchema,
  UseLinkInviteSchema,
};
