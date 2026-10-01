import { z } from 'zod';

const NowListeningSchema = z.object({
  bookId: z.string().uuid(),
  chapterId: z.string().uuid(),
  positionSeconds: z.number().nonnegative(),
  durationSeconds: z.number().nonnegative(),
  isPlaying: z.boolean(),
  reportedAtMs: z.number().int().nonnegative(),
});

const NowReadingSchema = z.object({
  bookId: z.string().uuid(),
  fraction: z.number().min(0).max(1).nullable(),
  pageNumber: z.number().int().nonnegative().nullable(),
  reportedAtMs: z.number().int().nonnegative(),
});

const ReportNowListeningSchema = z.object({
  clientId: z.string().min(1).max(120),
  nowListening: NowListeningSchema.nullable(),
});

const ReportNowReadingSchema = z.object({
  clientId: z.string().min(1).max(120),
  nowReading: NowReadingSchema.nullable(),
});

const BookOnShowSchema = z.object({
  bookId: z.string().uuid(),
  title: z.string(),
  authors: z.array(z.string()),
  hasCover: z.boolean(),
});

const BookListeningSessionSchema = BookOnShowSchema.extend({
  isPlaying: z.boolean(),
  positionSeconds: z.number().nonnegative(),
  durationSeconds: z.number().nonnegative(),
  reportedAtMs: z.number().int().nonnegative(),
});

const ReadingSessionSchema = BookOnShowSchema.extend({
  fraction: z.number().min(0).max(1).nullable(),
  pageNumber: z.number().int().nonnegative().nullable(),
  reportedAtMs: z.number().int().nonnegative(),
});

const BookCommandSchema = z.enum(['pause', 'resume', 'stop']);

type NowListening = z.infer<typeof NowListeningSchema>;
type NowReading = z.infer<typeof NowReadingSchema>;
type BookListeningSession = z.infer<typeof BookListeningSessionSchema>;
type ReadingSession = z.infer<typeof ReadingSessionSchema>;
type BookCommand = z.infer<typeof BookCommandSchema>;

export type { BookCommand, BookListeningSession, NowListening, NowReading, ReadingSession };

export {
  BookCommandSchema,
  BookListeningSessionSchema,
  NowListeningSchema,
  NowReadingSchema,
  ReadingSessionSchema,
  ReportNowListeningSchema,
  ReportNowReadingSchema,
};
