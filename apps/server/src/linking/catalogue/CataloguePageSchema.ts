import { z } from 'zod';
import { createSchemaFactory } from 'drizzle-zod';
import {
  book,
  bookChapter,
  mediaItem,
  musicAlbum,
  musicArtist,
  musicTrack,
  musicTrackArtist,
  series,
} from '#dialect/Schema';

const MOST_ROWS = 2000;

const { createInsertSchema } = createSchemaFactory({ coerce: { date: true } });

const CataloguePageSchema = z.object({
  series: z.array(createInsertSchema(series)).max(MOST_ROWS),
  mediaItems: z.array(createInsertSchema(mediaItem)).max(MOST_ROWS),
  artists: z.array(createInsertSchema(musicArtist)).max(MOST_ROWS),
  albums: z.array(createInsertSchema(musicAlbum)).max(MOST_ROWS),
  tracks: z.array(createInsertSchema(musicTrack)).max(MOST_ROWS),
  trackArtists: z.array(createInsertSchema(musicTrackArtist)).max(MOST_ROWS * 4),
  books: z.array(createInsertSchema(book)).max(MOST_ROWS),
  chapters: z.array(createInsertSchema(bookChapter)).max(MOST_ROWS * 4),
  next: z.string().min(1).nullable(),
});

type CataloguePage = z.infer<typeof CataloguePageSchema>;

export type { CataloguePage };

export { CataloguePageSchema };
