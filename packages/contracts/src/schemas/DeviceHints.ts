import { z } from 'zod';
import { BrowserSchema } from '@ValenceContracts/schemas/Browser';
import {
  DeviceAppSchema,
  DeviceFormSchema,
  DeviceSystemSchema,
  DeviceWordsSchema,
} from '@ValenceContracts/schemas/DeviceIdentity';

const DeviceIdSchema = z.string().regex(/^[\w-]{8,64}$/u);

const DeviceHintsSchema = z.object({
  id: DeviceIdSchema.optional().catch(undefined),
  app: DeviceAppSchema.optional().catch(undefined),
  system: DeviceSystemSchema.optional().catch(undefined),
  form: DeviceFormSchema.optional().catch(undefined),
  browser: BrowserSchema.optional().catch(undefined),
  model: DeviceWordsSchema.optional().catch(undefined),
  name: DeviceWordsSchema.optional().catch(undefined),
});

type DeviceHints = z.infer<typeof DeviceHintsSchema>;

export type { DeviceHints };

export { DeviceHintsSchema, DeviceIdSchema };
