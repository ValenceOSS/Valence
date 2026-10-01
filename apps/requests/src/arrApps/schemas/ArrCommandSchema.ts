import { z } from 'zod';

const ArrCommandSchema = z.object({ id: z.number().int(), name: z.string() });

export { ArrCommandSchema };
