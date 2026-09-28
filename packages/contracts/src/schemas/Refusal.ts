import { z } from 'zod';

const RefusalSchema = z.object({ error: z.string() });

export { RefusalSchema };
