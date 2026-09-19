import { z } from 'zod';

const LOG_LEVELS = ['debug', 'info', 'warn', 'error'] as const;

const LOG_SOURCES = [
  'server',
  'scanner',
  'transcoder',
  'jobs',
  'auth',
  'playback',
  'catalogue',
  'requests',
] as const;

const LogLevelSchema = z.enum(LOG_LEVELS);

const LogSourceSchema = z.enum(LOG_SOURCES);

const LogContextSchema = z.object({
  jobId: z.string().nullable().default(null),
  jobKind: z.string().nullable().default(null),
  libraryId: z.string().nullable().default(null),
  mediaId: z.string().nullable().default(null),
  sessionId: z.string().nullable().default(null),
  requestId: z.string().nullable().default(null),
});

const LogRecordSchema = z.object({
  id: z.string(),
  atMs: z.number().int().nonnegative(),
  level: LogLevelSchema,
  source: LogSourceSchema,
  message: z.string(),
  detail: z.string().nullable(),
  count: z.number().int().positive(),
  context: LogContextSchema,
});

const LogPageSchema = z.object({
  records: z.array(LogRecordSchema),
  total: z.number().int().nonnegative(),
});

const LogQuerySchema = z.object({
  levels: z.array(LogLevelSchema).default(['warn', 'error']),
  sources: z.array(LogSourceSchema).default([]),
  search: z.string().default(''),
  sinceMs: z.number().int().nonnegative().nullable().default(null),
  untilMs: z.number().int().nonnegative().nullable().default(null),
  jobId: z.string().nullable().default(null),
  limit: z.number().int().positive().max(1000).default(200),
});

type LogLevel = z.infer<typeof LogLevelSchema>;
type LogSource = z.infer<typeof LogSourceSchema>;
type LogContext = z.infer<typeof LogContextSchema>;
type LogRecord = z.infer<typeof LogRecordSchema>;
type LogQuery = z.infer<typeof LogQuerySchema>;

const RANK: Readonly<Record<LogLevel, number>> = { debug: 0, info: 1, warn: 2, error: 3 };

const KEPT_FOR_DAYS: Readonly<Record<LogLevel, number>> = {
  debug: 1,
  info: 3,
  warn: 14,
  error: 30,
};

const DEFAULT_LEVELS: readonly LogLevel[] = ['warn', 'error'];

const SEPARATOR = '\u001f';

/**
 * Whether a level is at least as serious as another, for reading a floor like "warnings and worse"
 * rather than listing every level above it.
 *
 * @param level - The level of the record.
 * @param floor - The least serious level worth showing.
 * @returns Whether the record clears the floor.
 */
const isAtLeast = (level: LogLevel, floor: LogLevel): boolean => RANK[level] >= RANK[floor];

/**
 * How long a record of this level is kept. Errors and warnings outlive the ordinary chatter, because
 * the line explaining why a scan failed last week is worth far more than the four thousand lines
 * saying it read a file successfully — and keeping everything equally means keeping nothing for long.
 *
 * @param level - How serious the record is.
 * @returns The number of days it survives.
 */
const keptForDays = (level: LogLevel): number => KEPT_FOR_DAYS[level];

/**
 * The moment a record of this level stops being worth keeping.
 *
 * @param level - How serious the record is.
 * @param atMs - When it was written.
 * @returns When it may be forgotten.
 */
const forgottenAfterMs = (level: LogLevel, atMs: number): number =>
  atMs + keptForDays(level) * 86_400_000;

/**
 * What makes two records the same event repeating rather than two things happening.
 *
 * A job retrying in a loop, or a scan meeting four thousand unreadable files, can write more lines
 * than everything else in the system put together and push out the records that mattered. Repeats are
 * counted against one record instead, which keeps the flood visible without letting it do the
 * pushing.
 *
 * The context is part of the identity: the same message about two different files is two events, not
 * one seen twice.
 *
 * @param record - The record about to be written.
 * @returns A key that repeats share.
 */
const sameEventKey = (record: {
  level: LogLevel;
  source: LogSource;
  message: string;
  context: LogContext;
}): string =>
  [
    record.level,
    record.source,
    record.message,
    record.context.jobId ?? '',
    record.context.libraryId ?? '',
    record.context.mediaId ?? '',
    record.context.sessionId ?? '',
  ].join(SEPARATOR);

export type { LogLevel, LogSource, LogContext, LogRecord, LogQuery };

export {
  LOG_LEVELS,
  LOG_SOURCES,
  DEFAULT_LEVELS,
  LogLevelSchema,
  LogSourceSchema,
  LogContextSchema,
  LogRecordSchema,
  LogPageSchema,
  LogQuerySchema,
  isAtLeast,
  keptForDays,
  forgottenAfterMs,
  sameEventKey,
};
