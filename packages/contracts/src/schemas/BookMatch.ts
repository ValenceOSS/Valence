import { z } from 'zod';

const BookMatchSchema = z.object({
  openLibraryId: z.number().int().positive(),
  title: z.string(),
  author: z.string().nullable(),
  year: z.number().int().nullable(),
  coverUrl: z.string().nullable(),
});

const BookMatchListSchema = z.object({ matches: z.array(BookMatchSchema) });

type BookMatch = z.infer<typeof BookMatchSchema>;

export type { BookMatch };

export { BookMatchListSchema, BookMatchSchema };
