import { z } from 'zod';

const BrowseOrderSchema = z.enum(['added', 'released', 'title', 'rating', 'size']);

type BrowseOrder = z.infer<typeof BrowseOrderSchema>;

export type { BrowseOrder };

export { BrowseOrderSchema };
