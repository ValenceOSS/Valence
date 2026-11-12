import { z } from 'zod';
import { MediaSummarySchema } from './Library';

const HomeShelfSchema = z
  .object({
    id: z.string().min(1),
    kind: z.enum(['genre', 'decade', 'more', 'again']),
    genre: z.string().nullable(),
    order: z.enum(['newest', 'title']).nullable(),
    decade: z.number().int().nullable(),
    page: z.number().int().nonnegative(),
    items: z.array(MediaSummarySchema),
  })
  .describe(
    'One shelf of the endless part of the front page: a genre, a decade, a genre seen from another angle, or one of those come round again. It carries what it is drawn from rather than a title, so each client names it in its own language.',
  );

const HomeShelvesSchema = z.object({
  shelves: z.array(HomeShelfSchema),
  cursor: z
    .string()
    .nullable()
    .describe('What to send to read the shelves after these, or null where there are none.'),
});

type HomeShelf = z.infer<typeof HomeShelfSchema>;
type HomeShelves = z.infer<typeof HomeShelvesSchema>;

export type { HomeShelf, HomeShelves };

export { HomeShelfSchema, HomeShelvesSchema };
