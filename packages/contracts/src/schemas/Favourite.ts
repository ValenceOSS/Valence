import { z } from 'zod';

const FavouriteSchema = z.object({
  mediaId: z.string().uuid(),
  keptAt: z.string().datetime(),
});

const FavouriteBookSchema = z.object({
  bookId: z.string().uuid(),
  keptAt: z.string().datetime(),
});

const FavouriteListSchema = z.object({
  favourites: z.array(FavouriteSchema),
  books: z.array(FavouriteBookSchema).default([]),
});

type Favourite = z.infer<typeof FavouriteSchema>;

type FavouriteBook = z.infer<typeof FavouriteBookSchema>;

export type { Favourite, FavouriteBook };

export { FavouriteBookSchema, FavouriteSchema, FavouriteListSchema };
