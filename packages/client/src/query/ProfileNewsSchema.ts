import { z } from 'zod';

const ProfileNewsSchema = z.object({ event: z.literal('favourites') });

export { ProfileNewsSchema };
