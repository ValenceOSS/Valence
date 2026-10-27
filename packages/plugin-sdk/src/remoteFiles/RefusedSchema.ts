import { z } from 'zod';
import { RemoteRefusalSchema } from './RemoteRefusalSchema';

const RefusedSchema = z.object({ refused: RemoteRefusalSchema });

type Refused = z.infer<typeof RefusedSchema>;

export type { Refused };

export { RefusedSchema };
