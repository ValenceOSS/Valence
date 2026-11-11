import { z } from 'zod';
import { BookmarkSchema } from '@ValenceContracts/schemas/Book';

const BookmarkChangeSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('add'), bookmark: BookmarkSchema }),
  z.object({ kind: z.literal('remove'), bookmarkId: z.string().uuid() }),
]);

const KeptBookmarksSchema = z.object({
  known: z.array(BookmarkSchema),
  waiting: z.array(BookmarkChangeSchema),
});

type BookmarkChange = z.infer<typeof BookmarkChangeSchema>;

type KeptBookmarks = z.infer<typeof KeptBookmarksSchema>;

export type { BookmarkChange, KeptBookmarks };

export { KeptBookmarksSchema };
