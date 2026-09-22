import { z } from 'zod';

const NearbyValenceSchema = z.object({
  address: z.string(),
  name: z.string(),
});

export type NearbyValence = z.infer<typeof NearbyValenceSchema>;
export { NearbyValenceSchema };
