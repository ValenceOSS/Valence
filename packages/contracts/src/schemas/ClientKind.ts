import { z } from 'zod';

const CLIENT_KINDS = ['browser', 'desktop', 'tv', 'phone'] as const;

const ClientKindSchema = z.enum(CLIENT_KINDS);

type ClientKind = z.infer<typeof ClientKindSchema>;

export type { ClientKind };

export { CLIENT_KINDS, ClientKindSchema };
