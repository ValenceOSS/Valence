import { z } from 'zod';
import { MediaSummarySchema } from './Library';

const LIKE_THIS_SHOWN = 20;

const LikeThisSchema = z.object({
  items: z.array(MediaSummarySchema),
});

const WatchedTitleSchema = z.object({
  title: z.string().min(1),
  mediaId: z.string().uuid(),
  seriesId: z.string().nullable(),
});

const BecauseYouWatchedRowSchema = z.object({
  watched: WatchedTitleSchema,
  items: z.array(MediaSummarySchema),
});

const BecauseYouWatchedSchema = z.object({
  rows: z.array(BecauseYouWatchedRowSchema),
});

type LikeThis = z.infer<typeof LikeThisSchema>;
type WatchedTitle = z.infer<typeof WatchedTitleSchema>;
type BecauseYouWatchedRow = z.infer<typeof BecauseYouWatchedRowSchema>;
type BecauseYouWatched = z.infer<typeof BecauseYouWatchedSchema>;

export type { BecauseYouWatched, BecauseYouWatchedRow, LikeThis, WatchedTitle };

export {
  BecauseYouWatchedRowSchema,
  BecauseYouWatchedSchema,
  LIKE_THIS_SHOWN,
  LikeThisSchema,
  WatchedTitleSchema,
};
