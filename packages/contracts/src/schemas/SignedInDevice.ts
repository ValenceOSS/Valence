import { z } from 'zod';
import { SaidSchema } from '@ValenceI18n/SaidSchema';
import {
  DEVICE_WORDS_LONGEST,
  DeviceIdentitySchema,
  DeviceIdentityWireSchema,
} from '@ValenceContracts/schemas/DeviceIdentity';

const SignedInDeviceSchema = z.object({
  id: z.string(),
  name: SaidSchema,
  device: SaidSchema.nullable().default(null),
  client: SaidSchema.nullable().default(null),
  identity: DeviceIdentityWireSchema.nullable().default(null),
  renamed: z.string().nullable().default(null),
  address: z.string().nullable(),
  signedInAt: z.string(),
  lastActiveAt: z.string().nullable().default(null),
  isActiveNow: z.boolean().default(false),
  expiresAt: z.string(),
  isCurrent: z.boolean().default(false),
});

const SignedInDeviceListSchema = z.object({ devices: z.array(SignedInDeviceSchema) });

const ReadDeviceSchema = SignedInDeviceSchema.extend({
  identity: DeviceIdentitySchema.nullable().catch(null).default(null),
});

const ReadDeviceListSchema = z.object({ devices: z.array(ReadDeviceSchema) });

const DeviceRenameSchema = z.object({
  name: z.string().trim().max(DEVICE_WORDS_LONGEST).nullable(),
});

type SignedInDevice = z.infer<typeof SignedInDeviceSchema>;

type ReadDevice = z.infer<typeof ReadDeviceSchema>;

type DeviceRename = z.infer<typeof DeviceRenameSchema>;

export type { DeviceRename, ReadDevice, SignedInDevice };

export {
  DeviceRenameSchema,
  ReadDeviceListSchema,
  ReadDeviceSchema,
  SignedInDeviceListSchema,
  SignedInDeviceSchema,
};
