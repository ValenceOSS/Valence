import { z } from 'zod';

const LocalIdSchema = z.string().regex(/^[a-z][a-z0-9-]{0,39}$/);

export { LocalIdSchema };
