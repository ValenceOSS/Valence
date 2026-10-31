import { z } from 'zod';
import { HOME_ROW_LIMITS } from './HOME_ROW_LIMITS';

const HomeRowAnswerSchema = z
  .object({ items: z.array(z.string().min(1).max(200)).max(HOME_ROW_LIMITS.items) })
  .strict();

export { HomeRowAnswerSchema };
