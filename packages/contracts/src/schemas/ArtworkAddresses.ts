import { z } from 'zod';

const ArtworkAddressesSchema = z
  .object({
    poster: z.string().min(1).optional(),
    backdrop: z.string().min(1).optional(),
    logo: z.string().min(1).optional(),
  })
  .describe(
    'Where each of the item’s own pictures is served by name, narrowed: add `-w` and a width the server narrows to, then `.webp`. It never changes for a picture, so it may be kept for good, and anybody may fetch it. Absent where the server does not name its pictures, which are then asked for at the item’s image address instead.',
  );

type ArtworkAddresses = z.infer<typeof ArtworkAddressesSchema>;

export type { ArtworkAddresses };

export { ArtworkAddressesSchema };
