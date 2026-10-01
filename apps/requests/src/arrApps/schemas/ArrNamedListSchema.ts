import { z } from 'zod';

const ArrNamedListSchema = z.array(z.object({ id: z.number().int(), name: z.string() }));

export { ArrNamedListSchema };
