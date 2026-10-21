import { z } from 'zod';

const ConvertedSchema = z.enum(['picture', 'pictureAndSound']);

type Converted = z.infer<typeof ConvertedSchema>;

export type { Converted };

export { ConvertedSchema };
