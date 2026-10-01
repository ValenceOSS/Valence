import { z } from 'zod';

const ArrIdSchema = z.object({ id: z.number().int() });

export { ArrIdSchema };
