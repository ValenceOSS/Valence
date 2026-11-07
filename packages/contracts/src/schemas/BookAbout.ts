import { z } from 'zod';
import { CatalogueTitleSchema } from './CatalogueTitle';

const BookAuthorSchema = z.object({
  name: z.string().min(1),
  bio: z.string().nullable(),
  photoUrl: z.string().nullable(),
  born: z.string().nullable(),
  died: z.string().nullable(),
  workCount: z.number().int().nonnegative().nullable(),
});

const BookAboutSchema = z.object({
  openLibraryId: z.string().min(1),
  overview: z.string().nullable(),
  subjects: z.array(z.string()),
  firstPublished: z.number().int().nullable(),
  pages: z.number().int().positive().nullable(),
  publishers: z.array(z.string()),
  languages: z.array(z.string()).default([]),
  editions: z.number().int().nonnegative().nullable(),
  rating: z
    .object({ average: z.number().min(0).max(5), count: z.number().int().nonnegative() })
    .nullable(),
  readers: z
    .object({
      wantToRead: z.number().int().nonnegative(),
      reading: z.number().int().nonnegative(),
      haveRead: z.number().int().nonnegative(),
    })
    .nullable(),
  author: BookAuthorSchema.nullable(),
  byAuthor: z.array(CatalogueTitleSchema),
  alike: z.array(CatalogueTitleSchema),
});

type BookAuthor = z.infer<typeof BookAuthorSchema>;

type BookAbout = z.infer<typeof BookAboutSchema>;

export type { BookAbout, BookAuthor };

export { BookAboutSchema, BookAuthorSchema };
