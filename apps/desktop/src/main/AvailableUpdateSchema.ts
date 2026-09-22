import { z } from 'zod';

const AvailableUpdateSchema = z.object({ version: z.string() });

export { AvailableUpdateSchema };
