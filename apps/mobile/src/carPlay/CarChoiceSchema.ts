import { z } from 'zod';

const CarChoiceSchema = z.object({ id: z.string().min(1) });

export { CarChoiceSchema };
